// Run by .github/workflows/update-frame.yml on an hourly schedule (via
// `node frame/generate-transit.js`) to bake live AC Transit predictions into
// frame/transit.js as a plain static <script>, shown in its own footer box
// next to weather. Same reason as frame/generate-weather.js: the device
// capturing /frame doesn't wait for in-page fetch()es, so this has to run
// ahead of time and commit a static result.
const fs = require("fs");
const path = require("path");

const TIME_ZONE = "America/Los_Angeles";
const WINDOW_MINUTES = 90; // a bit past the hourly refresh cadence, so the
                           // last departure or two doesn't fall out of view
                           // right before the next bake
const API_KEY = process.env.TRANSIT_511_API_KEY;

// Route "72" at stop 55501 is actually three branded sub-lines (72, 72M,
// 72L) that all stop there — matched by the optional trailing letter and
// shown as e.g. "4:17(M)". Route "12" has no such variants, so the plain
// regex just matches "12" exactly.
//
// stopName is hardcoded (short form) rather than pulled from the API's
// StopPointName, since that's only available on a visit that actually
// matched — with zero matches there'd be no name to label the "no buses"
// line with.
const STOPS = [
    { stopCode: "51175", route: "12", stopName: "Gilman & Curtis" },
    { stopCode: "55501", route: "72", stopName: "San Pablo & Gilman" }
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
        throw new Error("511.org request failed for stop " + stopCode + ": " + res.status);
    }
    const json = await res.json();
    return json.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit || [];
}

// TEMPORARY debug probe (to be reverted): dump the raw stoptimetable
// response shape for one stop/route so real parsing can be written against
// the actual field names instead of a guess.
async function debugProbeStopTimetable(stopCode, route) {
    const sfUrl = "https://api.511.org/transit/timetable?api_key=" + encodeURIComponent(API_KEY) +
        "&operator_id=AC&line_id=" + encodeURIComponent(route) + "&format=json";
    const sfJson = await (await fetch(sfUrl, { headers: { "Accept": "application/json" } })).json();
    const sf = sfJson.Content && sfJson.Content.ServiceFrame;
    console.error("DEBUG timetable " + route + " ServiceFrame top-level keys: " + JSON.stringify(Object.keys(sf || {})));
    console.error("DEBUG timetable " + route + " ServiceFrame non-routes sample: " +
        JSON.stringify(Object.assign({}, sf, { routes: "[omitted]" })).slice(0, 2000));

    const stopsUrl = "https://api.511.org/transit/stops?api_key=" + encodeURIComponent(API_KEY) +
        "&operator_id=AC&format=json";
    const stopsRes = await fetch(stopsUrl, { headers: { "Accept": "application/json" } });
    const stopsText = await stopsRes.text();
    console.error("DEBUG stops endpoint status=" + stopsRes.status + " body[0:1500]=" + stopsText.slice(0, 1500));
    if (stopsRes.ok) {
        const hasStopCode = stopsText.includes('"' + stopCode + '"');
        console.error("DEBUG stops endpoint mentions stopCode " + stopCode + ": " + hasStopCode);
    }
}

// Returns { route, stopName, entries: [{ time: <ISO string>, label }] } --
// entries carry a real timestamp (not just the pre-formatted label) so
// render.js can drop ones that have already departed by the time the page
// is actually captured, and fit as many as the box's actual pixel width
// allows, rather than baking a fixed decision in here where neither of
// those is known yet.
function buildStopSegment(stopCode, route, stopName, visits, now) {
    const routePattern = new RegExp("^" + route + "([A-Z])?$");
    const windowEnd = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);

    const matches = visits.filter(function (visit) {
        return routePattern.test(visit.MonitoredVehicleJourney.LineRef);
    });

    const entries = matches.map(function (visit) {
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

    return {
        route: route,
        stopName: stopName,
        entries: entries.map(function (e) {
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
        segments.push(buildStopSegment(stop.stopCode, stop.route, stop.stopName, visits, now));
        await debugProbeStopTimetable(stop.stopCode, stop.route);
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
