// TEMPORARY probe version -- just inspects the extracted GTFS files' actual
// headers/sample rows so the real parser can be written against confirmed
// field names instead of assumed-standard GTFS ones. Will be replaced.
const fs = require("fs");
const path = require("path");

const dir = process.argv[2];
if (!dir) {
    throw new Error("usage: node generate-transit-schedule-cache.js <extracted-gtfs-dir>");
}

["routes.txt", "trips.txt", "stop_times.txt", "calendar.txt", "calendar_dates.txt", "stops.txt"].forEach(function (name) {
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) {
        console.error("MISSING: " + name);
        return;
    }
    const lines = fs.readFileSync(p, "utf8").split("\n").slice(0, 4);
    console.error("=== " + name + " (" + fs.statSync(p).size + " bytes) ===");
    lines.forEach(function (l) { console.error(l); });
});
