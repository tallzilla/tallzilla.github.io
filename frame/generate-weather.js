// Run by .github/workflows/update-frame-weather.yml on a schedule (via
// `node frame/generate-weather.js`) to bake live weather data into
// frame/weather.js as a plain static <script>. This runs ahead of time
// rather than in the browser because the device that captures /frame takes
// its screenshot without waiting for in-page fetch()es to resolve, so a
// client-side weather fetch was rendering as "Loading today's weather...".
const fs = require("fs");
const path = require("path");

const LOCATION = { latitude: 37.8715, longitude: -122.2730 };
const TIME_ZONE = "America/Los_Angeles";

// WMO weather codes, as returned by open-meteo.com's daily forecast, mapped
// to the small set of icons text-canvas.js knows how to draw (see
// drawWeatherIcon there) plus a short human description kept only for the
// aria-label (the on-screen card is icon/number only, no prose).
const WEATHER_CODES = {
    0: ["clear", "Clear sky"], 1: ["clear", "Mainly clear"],
    2: ["partly-cloudy", "Partly cloudy"], 3: ["cloudy", "Overcast"],
    45: ["fog", "Foggy"], 48: ["fog", "Foggy with rime frost"],
    51: ["rain", "Light drizzle"], 53: ["rain", "Drizzle"], 55: ["rain", "Heavy drizzle"],
    56: ["rain", "Light freezing drizzle"], 57: ["rain", "Freezing drizzle"],
    61: ["rain", "Light rain"], 63: ["rain", "Rain"], 65: ["rain", "Heavy rain"],
    66: ["rain", "Light freezing rain"], 67: ["rain", "Freezing rain"],
    71: ["snow", "Light snow"], 73: ["snow", "Snow"], 75: ["snow", "Heavy snow"], 77: ["snow", "Snow grains"],
    80: ["rain", "Light rain showers"], 81: ["rain", "Rain showers"], 82: ["rain", "Heavy rain showers"],
    85: ["snow", "Light snow showers"], 86: ["snow", "Heavy snow showers"],
    95: ["thunder", "Thunderstorms"], 96: ["thunder", "Thunderstorms with hail"], 99: ["thunder", "Severe thunderstorms with hail"]
};

// Open-Meteo's "current"/daily times come back as naive local timestamps
// (already adjusted for the `timezone` param, e.g. "2026-08-25T14:15") --
// pull the hour/minute out directly rather than going through Date, which
// would re-interpret them in the server's own timezone (UTC on GitHub
// Actions).
function parseLocalHourMinute(isoLocalString) {
    const [, timePart] = isoLocalString.split("T");
    const [hourStr, minute] = timePart.split(":");
    return { hour: parseInt(hourStr, 10), minute: minute };
}

// Compact form for the on-card display, e.g. "7:47p" -- every character
// here counts against the narrow weather card's width.
function formatTimeCompact(isoLocalString) {
    const { hour, minute } = parseLocalHourMinute(isoLocalString);
    const suffix = hour >= 12 ? "p" : "a";
    const hour12 = hour % 12 || 12;
    return hour12 + ":" + minute + suffix;
}

// Friendly form for the aria-label only (screen readers, not shown on
// screen), e.g. "7:47 PM".
function formatTimeFull(isoLocalString) {
    const { hour, minute } = parseLocalHourMinute(isoLocalString);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return hour12 + ":" + minute + " " + suffix;
}

async function main() {
    const url = "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + LOCATION.latitude +
        "&longitude=" + LOCATION.longitude +
        "&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset" +
        "&current=temperature_2m" +
        "&temperature_unit=fahrenheit" +
        "&timezone=" + encodeURIComponent(TIME_ZONE) +
        "&forecast_days=2";

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("open-meteo request failed: " + res.status);
    }
    const json = await res.json();
    const daily = json.daily;

    const code = daily.weathercode[0];
    const [icon, description] = WEATHER_CODES[code] || ["cloudy", "Weather conditions"];
    const high = Math.round(daily.temperature_2m_max[0]);
    const low = Math.round(daily.temperature_2m_min[0]);
    const temp = Math.round(json.current.temperature_2m);

    // Naive local timestamps sort lexically same as chronologically within
    // a single day, so plain string comparison against current.time works.
    const now = json.current.time;
    let sunGlyph, sunEvent;
    if (now < daily.sunrise[0]) {
        sunGlyph = "↑"; // up arrow: sun rising
        sunEvent = daily.sunrise[0];
    } else if (now < daily.sunset[0]) {
        sunGlyph = "↓"; // down arrow: sun setting
        sunEvent = daily.sunset[0];
    } else {
        sunGlyph = "↑";
        sunEvent = daily.sunrise[1];
    }

    const weather = {
        temp: temp,
        high: high,
        low: low,
        icon: icon,
        sunGlyph: sunGlyph,
        sunTime: formatTimeCompact(sunEvent),
        ariaLabel: temp + "°F, with a high near " + high + "°F and a low around " +
            low + "°F overnight. " + description + " expected. " +
            (sunGlyph === "↑" ? "Sunrise" : "Sunset") + " at " + formatTimeFull(sunEvent) + "."
    };

    const output = "// Auto-generated by frame/generate-weather.js via a scheduled GitHub\n" +
        "// Actions workflow (.github/workflows/update-frame-weather.yml).\n" +
        "// Do not edit by hand — it's overwritten on the next scheduled run.\n" +
        "window.FRAME_WEATHER = " + JSON.stringify(weather) + ";\n";

    fs.writeFileSync(path.join(__dirname, "weather.js"), output);
    console.log("Wrote frame/weather.js:", JSON.stringify(weather));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
