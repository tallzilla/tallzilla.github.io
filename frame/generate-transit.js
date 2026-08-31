// Run by .github/workflows/update-frame.yml on an hourly schedule (via
// `node frame/generate-transit.js`) to bake AC Transit predictions into
// frame/transit.js as a plain static <script>, shown in its own footer box
// next to weather. Same reason as frame/generate-weather.js: the device
// capturing /frame doesn't wait for in-page fetch()es, so this has to run
// ahead of time and commit a static result.
//
// Blends two 511.org sources per stop:
//  - StopMonitoring (SIRI-SM): live, AVL-tracked predictions. Accurate, but
//    only covers vehicles currently dispatched/tracked -- a lower-frequency
//    route like 12 can have as few as 1-2 live entries even with a 90
//    minute lookahead window, well short of enough to fill a line.
//  - timetable (line-scoped NeTEx schedule): the published schedule, always
//    has plenty of departures, but doesn't know about delays/detours/
//    cancellations the way live tracking does.
// Live entries are kept as-is; scheduled entries are only appended after
// the latest live entry, so a live-tracked bus never shows up twice as both
// a live prediction and its own scheduled slot.
const fs = require("fs");
const path = require("path");

const TIME_ZONE = "America/Los_Angeles";
const WINDOW_MINUTES = 90; // a bit past the hourly refresh cadence, so the
                           // last departure or two doesn't fall out of view
                           // right before the next bake
const API_KEY = process.env.TRANSIT_511_API_KEY;

// Route "72" at stop 55501 is actually three branded sub-lines (72, 72M,
// 72L) that all stop there. Live predictions distinguish these by LineRef
// suffix (matched via the optional trailing letter in routePattern below);
// the scheduled timetable has no such filtering, so each is queried as its
// own line_id, and the variant is known upfront rather than parsed back out.
// Route "12" has no such variants.
//
// stopName is hardcoded (short form) rather than pulled from the live API's
// StopPointName, since that's only available when a live visit actually
// matched -- with zero live matches there'd be nothing to derive it from,
// and the scheduled side is keyed by an internal stop id (see below), not a
// human-readable name at all.
const STOPS = [
    {
        stopCode: "51175", route: "12", stopName: "Gilman & Curtis",
        lineIds: [{ id: "12", variant: "" }]
    },
    {
        stopCode: "55501", route: "72", stopName: "San Pablo & Gilman",
        lineIds: [{ id: "72", variant: "" }, { id: "72M", variant: "M" }, { id: "72L", variant: "L" }]
    }
];

// No AM/PM suffix -- every departure in the WINDOW_MINUTES lookahead falls
// within the same part of the day, so it'd just be repeated noise.
function formatTime12h(date) {
    return date.toLocaleTimeString("en-US", {
        timeZone: TIME_ZONE,
        hour: "numeric",
        minute: "2-digit"
    }).replace(/\s*[AP]M$/i, "");
}

// The NeTEx JSON 511.org's timetable endpoint returns is XML-derived, and
// like most XML->JSON conversions collapses a single-item list to a bare
// object instead of a one-element array. Every list field read below goes
// through this so both shapes work.
function asArray(x) {
    if (x == null) return [];
    return Array.isArray(x) ? x : [x];
}

async function fetchStopMonitoring(stopCode) {
    const url = "https://api.511.org/transit/StopMonitoring" +
        "?api_key=" + encodeURIComponent(API_KEY) +
        "&agency=AC&stopcode=" + encodeURIComponent(stopCode) +
        "&format=json";
    // 511.org always gzip-compresses the response regardless of the
    // request's Accept-Encoding; fetch() decompresses transparently.
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("511.org StopMonitoring request failed for stop " + stopCode + ": " + res.status);
    }
    const json = await res.json();
    return json.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit || [];
}

function buildLiveEntries(visits, route, windowEnd) {
    const routePattern = new RegExp("^" + route + "([A-Z])?$");

    return visits.filter(function (visit) {
        return routePattern.test(visit.MonitoredVehicleJourney.LineRef);
    }).map(function (visit) {
        const call = visit.MonitoredVehicleJourney.MonitoredCall;
        const variant = visit.MonitoredVehicleJourney.LineRef.match(routePattern)[1] || "";
        const time = new Date(call.ExpectedArrivalTime || call.AimedArrivalTime);
        return {
            time: time,
            label: formatTime12h(time) + (variant ? "(" + variant + ")" : "")
        };
    }).filter(function (entry) {
        return entry.time <= windowEnd;
    }).sort(function (a, b) {
        return a.time - b.time;
    });
}

async function fetchTimetable(lineId) {
    const url = "https://api.511.org/transit/timetable" +
        "?api_key=" + encodeURIComponent(API_KEY) +
        "&operator_id=AC&line_id=" + encodeURIComponent(lineId) +
        "&format=json";
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) {
        throw new Error("511.org timetable request failed for line " + lineId + ": " + res.status);
    }
    return res.json();
}

// Which of ServiceCalendarFrame's day-type ids are in effect "today" in
// TIME_ZONE -- resolves e.g. a Tuesday to whichever id has "Tuesday" in its
// DaysOfWeek. 511's calendar for these two routes is just three plain
// weekday/Saturday/Sunday buckets with no holiday exceptions layered in.
function activeDayTypeIds(calendarFrame, now) {
    const weekday = now.toLocaleDateString("en-US", { timeZone: TIME_ZONE, weekday: "long" });
    const dayTypes = asArray(calendarFrame && calendarFrame.dayTypes && calendarFrame.dayTypes.DayType);
    return dayTypes.filter(function (dt) {
        const days = (dt.properties && dt.properties.PropertyOfDay && dt.properties.PropertyOfDay.DaysOfWeek) || "";
        return days.indexOf(weekday) !== -1;
    }).map(function (dt) {
        return dt.id;
    });
}

// Returns the UTC instant for wall-clock `timeStr` ("HH:MM:SS", optionally
// past 24:00:00 for a next-day trip) on `dateStr` ("YYYY-MM-DD") as
// observed in `timeZone`. Plain Date has no built-in "construct from local
// time in an arbitrary IANA zone" operation, so this derives the zone's
// UTC offset at that moment via Intl and applies it by hand -- correct
// across DST since the offset is computed for the actual target date, not
// assumed fixed.
function zonedTimeToUtc(dateStr, timeStr, timeZone) {
    const [h, m, s] = timeStr.split(":").map(Number);
    const dayMs = Math.floor(h / 24) * 86400000;
    const wrappedH = h % 24;
    const hh = String(wrappedH).padStart(2, "0");
    const utcGuess = new Date(dateStr + "T" + hh + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + "Z");

    const offsetFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timeZone, timeZoneName: "longOffset" });
    const offsetPart = offsetFormatter.formatToParts(utcGuess).find(function (p) { return p.type === "timeZoneName"; });
    const match = (offsetPart.value || "").match(/GMT([+-])(\d{2}):(\d{2})/);
    const offsetMin = match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;

    return new Date(utcGuess.getTime() - offsetMin * 60000 + dayMs);
}

// Scheduled entries for one line_id, filtered to ones that stop at
// stopCode, apply to today's service, and fall within [now, windowEnd].
function buildScheduledEntries(timetableJson, stopCode, variant, now, windowEnd) {
    const content = timetableJson.Content || {};
    const activeDayTypes = activeDayTypeIds(content.ServiceCalendarFrame, now);
    const todayDateStr = now.toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // "YYYY-MM-DD"

    const entries = [];
    asArray(content.TimetableFrame).forEach(function (frame) {
        const cond = frame.frameValidityConditions && frame.frameValidityConditions.AvailabilityCondition;
        if (!cond) return;

        const dayTypeRefs = asArray(cond.dayTypes && cond.dayTypes.DayTypeRef).map(function (r) { return r.ref; });
        if (!dayTypeRefs.some(function (ref) { return activeDayTypes.indexOf(ref) !== -1; })) return;
        if (cond.FromDate && new Date(cond.FromDate) > now) return;
        if (cond.ToDate && new Date(cond.ToDate) < now) return;

        asArray(frame.vehicleJourneys && frame.vehicleJourneys.ServiceJourney).forEach(function (journey) {
            const call = asArray(journey.calls && journey.calls.Call).find(function (c) {
                return c.ScheduledStopPointRef && c.ScheduledStopPointRef.ref === stopCode;
            });
            if (!call || !call.Departure || !call.Departure.Time) return;

            const time = zonedTimeToUtc(todayDateStr, call.Departure.Time, TIME_ZONE);
            if (time > now && time <= windowEnd) {
                entries.push({ time: time, label: formatTime12h(time) + (variant ? "(" + variant + ")" : "") });
            }
        });
    });
    return entries;
}

// Live entries as-is, plus scheduled entries filling in past the latest
// live one (or past `now` if there were no live entries at all) -- see the
// top-of-file comment for why they're blended this way.
async function buildStopSegment(stop, visits, now) {
    const windowEnd = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);
    const liveEntries = buildLiveEntries(visits, stop.route, windowEnd);
    const cutoff = liveEntries.length ? liveEntries[liveEntries.length - 1].time : now;

    let scheduledEntries = [];
    for (const lineId of stop.lineIds) {
        try {
            const json = await fetchTimetable(lineId.id);
            scheduledEntries = scheduledEntries.concat(
                buildScheduledEntries(json, stop.stopCode, lineId.variant, now, windowEnd)
            );
        } catch (err) {
            // Scheduled data is a fill-in on top of live predictions, which
            // already succeeded above -- a scheduled-side hiccup shouldn't
            // take down the whole bake, just fall back to live-only for
            // this line.
            console.error("Scheduled timetable fetch failed for line " + lineId.id + ", continuing without it:", err.message);
        }
    }
    scheduledEntries = scheduledEntries.filter(function (e) {
        return e.time > cutoff;
    });

    const allEntries = liveEntries.concat(scheduledEntries).sort(function (a, b) {
        return a.time - b.time;
    });

    return {
        route: stop.route,
        stopName: stop.stopName,
        entries: allEntries.map(function (e) {
            return { time: e.time.toISOString(), label: e.label };
        })
    };
}

async function main() {
    if (!API_KEY) {
        throw new Error("TRANSIT_511_API_KEY environment variable is not set");
    }

    const now = new Date();
    const segments = [];
    // Sequential, not parallel: 511.org's default rate limit is 60
    // requests/hour and this is cheap enough not to need the speed.
    for (const stop of STOPS) {
        const visits = await fetchStopMonitoring(stop.stopCode);
        segments.push(await buildStopSegment(stop, visits, now));
    }

    const output = "// Auto-generated by frame/generate-transit.js via a scheduled GitHub\n" +
        "// Actions workflow (.github/workflows/update-frame.yml). Rendered by\n" +
        "// render.js/text-canvas.js, which filter out already-departed entries\n" +
        "// and fit as many as the box's actual width allows -- see\n" +
        "// renderTransitFooter in text-canvas.js.\n" +
        "// Do not edit by hand — it's overwritten on the next scheduled run.\n" +
        "window.FRAME_TRANSIT = " + JSON.stringify(segments) + ";\n";

    fs.writeFileSync(path.join(__dirname, "transit.js"), output);
    console.log("Wrote frame/transit.js:", JSON.stringify(segments));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
