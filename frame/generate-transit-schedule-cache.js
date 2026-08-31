// Run occasionally (see .github/workflows/update-transit-schedule-cache.yml,
// which downloads+unzips AC Transit's GTFS static feed and calls this with
// the extracted directory) to distill just what generate-transit.js needs
// into frame/transit-schedule-cache.json: for stop 51175 (route 12) and
// stop 55501 (routes 72/72M/72L), every scheduled departure at that exact
// physical stop, plus enough of calendar.txt/calendar_dates.txt to resolve
// which service_id (day-type) applies on any given date.
//
// This exists because 511.org's timetable API (see generate-transit.js's
// top comment) only exposes "timepoint" stops -- a small subset of a
// route's published schedule, and 51175 isn't one of them even though live
// StopMonitoring predictions clearly show route 12 stopping there. GTFS's
// stop_times.txt has a row for every physical stop a trip serves
// (confirmed by its own "timepoint" column, 0 for most rows), which is
// exactly the data the timetable API was missing.
//
// Regenerating only needs to happen when AC Transit's schedule itself
// changes (a "sign-up," on the order of every few months) -- unlike
// update-frame.yml's 15-minute cadence, so this runs on its own monthly
// workflow. generate-transit.js reads the committed
// frame/transit-schedule-cache.json directly at bake time; no 511.org API
// call is involved in the frequent path at all.
const fs = require("fs");
const path = require("path");

const STOPS = [
    { stopCode: "51175", lineNames: ["12"] },
    { stopCode: "55501", lineNames: ["72", "72M", "72L"] }
];

// GTFS's own text fields for these particular files (route/trip names,
// stop names) don't contain commas in practice (confirmed against a real
// download) -- a plain split keeps this simple rather than writing a full
// quoted-CSV parser for a monthly, human-reviewable-diff cache build.
function readCsv(dir, name) {
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    const lines = text.split("\n");
    const header = lines[0].split(",");
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.trim()) continue;
        const fields = line.split(",");
        const row = {};
        for (let c = 0; c < header.length; c++) {
            row[header[c]] = fields[c] !== undefined ? fields[c].trim() : "";
        }
        rows.push(row);
    }
    return rows;
}

function main() {
    const dir = process.argv[2];
    if (!dir) {
        throw new Error("usage: node generate-transit-schedule-cache.js <extracted-gtfs-dir>");
    }

    const targetLineNames = new Set();
    STOPS.forEach(function (s) { s.lineNames.forEach(function (n) { targetLineNames.add(n); }); });

    const routes = readCsv(dir, "routes.txt");
    const routeIdByLineName = {};
    routes.forEach(function (r) {
        if (targetLineNames.has(r.route_short_name)) {
            routeIdByLineName[r.route_short_name] = r.route_id;
        }
    });
    const missingLines = Array.from(targetLineNames).filter(function (n) { return !routeIdByLineName[n]; });
    if (missingLines.length) {
        throw new Error("routes.txt has no route_short_name matching: " + missingLines.join(", "));
    }
    const lineNameByRouteId = {};
    Object.keys(routeIdByLineName).forEach(function (name) { lineNameByRouteId[routeIdByLineName[name]] = name; });
    const targetRouteIds = new Set(Object.values(routeIdByLineName));

    const trips = readCsv(dir, "trips.txt");
    const tripInfoById = {}; // trip_id -> { lineName, serviceId }
    trips.forEach(function (t) {
        if (targetRouteIds.has(t.route_id)) {
            tripInfoById[t.trip_id] = { lineName: lineNameByRouteId[t.route_id], serviceId: t.service_id };
        }
    });

    const targetStopIds = new Set(STOPS.map(function (s) { return s.stopCode; }));

    // stop_times.txt is tens of MB (every stop of every trip in the whole
    // agency) -- read it once as raw text and scan by hand rather than
    // building readCsv()'s full array-of-objects for ~800k unwanted rows.
    const stopTimesText = fs.readFileSync(path.join(dir, "stop_times.txt"), "utf8");
    const stLines = stopTimesText.split("\n");
    const stHeader = stLines[0].split(",");
    const tripIdCol = stHeader.indexOf("trip_id");
    const stopIdCol = stHeader.indexOf("stop_id");
    const departureCol = stHeader.indexOf("departure_time");

    // stopCode -> lineName -> [{ time: "HH:MM:SS", serviceId }]
    const scheduleByStop = {};
    STOPS.forEach(function (s) { scheduleByStop[s.stopCode] = {}; });

    for (let i = 1; i < stLines.length; i++) {
        const line = stLines[i];
        if (!line) continue;
        const fields = line.split(",");
        const stopId = fields[stopIdCol];
        if (!targetStopIds.has(stopId)) continue;
        const tripInfo = tripInfoById[fields[tripIdCol]];
        if (!tripInfo) continue;

        const byLine = scheduleByStop[stopId];
        if (!byLine[tripInfo.lineName]) byLine[tripInfo.lineName] = [];
        byLine[tripInfo.lineName].push({ time: fields[departureCol], serviceId: tripInfo.serviceId });
    }

    // Only keep calendar/calendar_dates rows for service_ids actually
    // referenced above -- no reason to carry the whole agency's calendar
    // into a cache meant to answer just "is 12 or 72/72M/72L running now."
    const usedServiceIds = new Set();
    Object.keys(scheduleByStop).forEach(function (stopId) {
        Object.keys(scheduleByStop[stopId]).forEach(function (lineName) {
            scheduleByStop[stopId][lineName].forEach(function (e) { usedServiceIds.add(e.serviceId); });
        });
    });

    const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const services = {};
    readCsv(dir, "calendar.txt").forEach(function (row) {
        if (!usedServiceIds.has(row.service_id)) return;
        services[row.service_id] = {
            daysOfWeek: DAY_NAMES.filter(function (d) { return row[d] === "1"; })
                .map(function (d) { return d[0].toUpperCase() + d.slice(1); }),
            startDate: row.start_date,
            endDate: row.end_date,
            addedDates: [],
            removedDates: []
        };
    });
    readCsv(dir, "calendar_dates.txt").forEach(function (row) {
        if (!usedServiceIds.has(row.service_id)) return;
        if (!services[row.service_id]) {
            // A service_id can exist only as exceptions with no base
            // calendar.txt row at all (e.g. a holiday-only special run).
            services[row.service_id] = { daysOfWeek: [], startDate: null, endDate: null, addedDates: [], removedDates: [] };
        }
        services[row.service_id][row.exception_type === "1" ? "addedDates" : "removedDates"].push(row.date);
    });

    const output = { generatedAt: new Date().toISOString(), services: services, stops: scheduleByStop };
    fs.writeFileSync(path.join(__dirname, "transit-schedule-cache.json"), JSON.stringify(output));

    console.log("Wrote frame/transit-schedule-cache.json: " + Object.keys(services).length + " services, " +
        Object.keys(scheduleByStop).map(function (stopId) {
            return stopId + " (" + Object.keys(scheduleByStop[stopId]).map(function (l) {
                return l + "=" + scheduleByStop[stopId][l].length;
            }).join(", ") + ")";
        }).join(" | "));
}

main();
