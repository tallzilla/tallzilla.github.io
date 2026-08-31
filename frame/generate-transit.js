// Run by .github/workflows/update-frame.yml on a 15-minute cadence (via
// `node frame/generate-transit.js`) to bake AC Transit predictions into
// frame/transit.js as a plain static <script>, shown in its own footer box
// next to weather. Same reason as frame/generate-weather.js: the device
// capturing /frame doesn't wait for in-page fetch()es, so this has to run
// ahead of time and commit a static result.
//
// Blends two sources per stop:
//  - 511.org StopMonitoring (SIRI-SM): live, AVL-tracked predictions.
//    Accurate, but only covers vehicles currently dispatched/tracked -- a
//    lower-frequency route like 12 can have as few as 1-2 live entries even
//    with a 90 minute lookahead window, well short of enough to fill a line.
//  - frame/transit-schedule-cache.json: AC Transit's published GTFS
//    schedule, pre-distilled to just these two stops by
//    generate-transit-schedule-cache.js (see that file's top comment for
//    why -- short version: 511.org's live "timetable" API only exposes a
//    route's published "timepoints," a small subset of its actual stops,
//    and neither 51175 nor most other physical stops are among them; GTFS's
//    stop_times.txt has a row for every stop a trip actually serves). No
//    network call is involved in reading it -- it's a file already in the
//    repo, refreshed on its own infrequent schedule since AC Transit's
//    schedule itself only changes every few months.
// Live entries are kept as-is; scheduled entries are only appended after
// the latest live entry, so a live-tracked bus never shows up twice as both
// a live prediction and its own scheduled slot.
const fs = require("fs");
const path = require("path");

const TIME_ZONE = "America/Los_Angeles";
const WINDOW_MINUTES = 90; // a bit past the refresh cadence, so the last
                           // departure or two doesn't fall out of view
                           // right before the next bake
const API_KEY = process.env.TRANSIT_511_API_KEY;

// Route "72" at stop 55501 is actually three branded sub-lines (72, 72M,
// 72L) that all stop there. Live predictions distinguish these by LineRef
// suffix (matched via the optional trailing letter in routePattern below);
// the cached schedule is keyed by the full line name directly (lineNames),
// and each entry's variant suffix is derived by stripping the base route
// off the front (e.g. "72M".slice("72".length) === "M"). Route "12" has no
// such variants.
//
// stopName is hardcoded (short form) rather than pulled from the live API's
// StopPointName, since that's only available when a live visit actually
// matched -- with zero live matches there'd be nothing to derive it from.
const STOPS = [
    { stopCode: "51175", route: "12", stopName: "Gilman & Curtis", lineNames: ["12"] },
    { stopCode: "55501", route: "72", stopName: "San Pablo & Gilman", lineNames: ["72", "72M", "72L"] }
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
            label: formatTime12h(time) + (variant ? "(" + variant + ")" : ""),
            live: true
        };
    }).filter(function (entry) {
        return entry.time <= windowEnd;
    }).sort(function (a, b) {
        return a.time - b.time;
    });
}

// Returns the UTC instant for wall-clock `timeStr` ("HH:MM:SS", optionally
// past 24:00:00 for a next-day trip -- GTFS's own convention for late-night
// service) on `dateStr` ("YYYY-MM-DD") as observed in `timeZone`. Plain
// Date has no built-in "construct from local time in an arbitrary IANA
// zone" operation, so this derives the zone's UTC offset at that moment via
// Intl and applies it by hand -- correct across DST since the offset is
// computed for the actual target date, not assumed fixed.
function zonedTimeToUtc(dateStr, timeStr, timeZone) {
    const [h, m, s] = timeStr.split(":").map(Number);
    const dayMs = Math.floor(h / 24) * 86400000;
    const hh = String(h % 24).padStart(2, "0");
    const utcGuess = new Date(dateStr + "T" + hh + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + "Z");

    const offsetFormatter = new Intl.DateTimeFormat("en-US", { timeZone: timeZone, timeZoneName: "longOffset" });
    const offsetPart = offsetFormatter.formatToParts(utcGuess).find(function (p) { return p.type === "timeZoneName"; });
    const match = (offsetPart.value || "").match(/GMT([+-])(\d{2}):(\d{2})/);
    const offsetMin = match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;

    return new Date(utcGuess.getTime() - offsetMin * 60000 + dayMs);
}

// GTFS calendar rules: a service_id runs on its listed days-of-week within
// [startDate, endDate], except calendar_dates.txt exceptions override that
// for a specific date -- added (runs regardless of weekday/range) or
// removed (doesn't run even if the weekday/range says it should, e.g. a
// holiday). Dates here are all GTFS's native "YYYYMMDD" so plain string
// comparison is chronological.
function serviceActiveOn(service, dateCompact, weekday) {
    if (!service) return false;
    if (service.removedDates.indexOf(dateCompact) !== -1) return false;
    if (service.addedDates.indexOf(dateCompact) !== -1) return true;
    if (service.daysOfWeek.indexOf(weekday) === -1) return false;
    if (service.startDate && dateCompact < service.startDate) return false;
    if (service.endDate && dateCompact > service.endDate) return false;
    return true;
}

function buildScheduledEntries(cache, stop, now, windowEnd) {
    const todayDateStr = now.toLocaleDateString("en-CA", { timeZone: TIME_ZONE }); // "YYYY-MM-DD"
    const todayCompact = todayDateStr.replace(/-/g, ""); // "YYYYMMDD", matches GTFS's own date format
    const weekday = now.toLocaleDateString("en-US", { timeZone: TIME_ZONE, weekday: "long" });

    const byLine = (cache.stops && cache.stops[stop.stopCode]) || {};
    const entries = [];
    stop.lineNames.forEach(function (lineName) {
        const variant = lineName.slice(stop.route.length);
        (byLine[lineName] || []).forEach(function (e) {
            if (!serviceActiveOn(cache.services && cache.services[e.serviceId], todayCompact, weekday)) return;
            const time = zonedTimeToUtc(todayDateStr, e.time, TIME_ZONE);
            if (time > now && time <= windowEnd) {
                entries.push({ time: time, label: formatTime12h(time) + (variant ? "(" + variant + ")" : ""), live: false });
            }
        });
    });
    return entries;
}

// Live entries as-is, plus scheduled entries filling in past the latest
// live one (or past `now` if there were no live entries at all) -- see the
// top-of-file comment for why they're blended this way.
function buildStopSegment(stop, visits, cache, now) {
    const windowEnd = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);
    const liveEntries = buildLiveEntries(visits, stop.route, windowEnd);
    const cutoff = liveEntries.length ? liveEntries[liveEntries.length - 1].time : now;

    const scheduledEntries = buildScheduledEntries(cache, stop, now, windowEnd).filter(function (e) {
        return e.time > cutoff;
    });

    const allEntries = liveEntries.concat(scheduledEntries).sort(function (a, b) {
        return a.time - b.time;
    });

    return {
        route: stop.route,
        stopName: stop.stopName,
        entries: allEntries.map(function (e) {
            return { time: e.time.toISOString(), label: e.label, live: e.live };
        })
    };
}

function loadScheduleCache() {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, "transit-schedule-cache.json"), "utf8"));
    } catch (err) {
        // Missing/corrupt cache degrades to live-only rather than failing
        // this (frequent) bake -- generate-transit-schedule-cache.js is
        // what maintains this file, on its own separate schedule.
        console.error("Could not load transit-schedule-cache.json, continuing live-only:", err.message);
        return { services: {}, stops: {} };
    }
}

async function main() {
    if (!API_KEY) {
        throw new Error("TRANSIT_511_API_KEY environment variable is not set");
    }

    const cache = loadScheduleCache();
    const now = new Date();
    const segments = [];
    // Sequential, not parallel: 511.org's default rate limit is 60
    // requests/hour and this is cheap enough not to need the speed.
    for (const stop of STOPS) {
        const visits = await fetchStopMonitoring(stop.stopCode);
        segments.push(buildStopSegment(stop, visits, cache, now));
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
