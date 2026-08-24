// Populates the frame markup from window.FRAME_DATA (set in data.js, which
// is loaded as a plain <script src> before this file so the title/date/image
// are already available synchronously — no fetch()/async race to worry
// about before a screenshot/capture pipeline grabs the page). The caption
// is the one exception: when data.body isn't set, it's filled in from a
// live weather lookup, which is necessarily async — see fetchWeather below.
(function () {
    var data = window.FRAME_DATA || {};

    var WEATHER_LOCATION = { name: "Berkeley", latitude: 37.8715, longitude: -122.2730 };

    // WMO weather codes, as returned by open-meteo.com's daily forecast.
    var WEATHER_CODES = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Foggy with rime frost",
        51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
        56: "Light freezing drizzle", 57: "Freezing drizzle",
        61: "Light rain", 63: "Rain", 65: "Heavy rain",
        66: "Light freezing rain", 67: "Freezing rain",
        71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
        80: "Light rain showers", 81: "Rain showers", 82: "Heavy rain showers",
        85: "Light snow showers", 86: "Heavy snow showers",
        95: "Thunderstorms", 96: "Thunderstorms with hail", 99: "Severe thunderstorms with hail"
    };

    var COMPASS_DIRECTIONS = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ];

    function compassDirection(deg) {
        return COMPASS_DIRECTIONS[Math.round(deg / 22.5) % 16];
    }

    function todayFormatted() {
        // Pin an explicit IANA timezone rather than trusting the rendering
        // device's own clock/timezone setting (toLocaleDateString's default
        // uses whatever timezone the device is configured for — if that's
        // wrong or just different from yours, the date shown can be off by
        // a day). Override via FRAME_DATA.timeZone in data.js if needed.
        var d = new Date();
        return d.toLocaleDateString("en-US", {
            timeZone: data.timeZone || "America/Los_Angeles",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    var titleEl = document.getElementById("frame-title");
    var subtitleEl = document.getElementById("frame-subtitle");
    var imageEl = document.getElementById("frame-image");
    var bodyEl = document.getElementById("frame-body");

    titleEl.textContent = data.title || "";
    subtitleEl.textContent = data.subtitle || todayFormatted();

    if (data.image) {
        imageEl.src = data.image;
        imageEl.alt = data.imageAlt || "";
        imageEl.style.display = "";
    } else {
        imageEl.style.display = "none";
    }

    if (data.body) {
        bodyEl.textContent = data.body;
    } else {
        bodyEl.textContent = "Loading today's weather for " + WEATHER_LOCATION.name + "…";
        fetchWeather();
    }

    function fetchWeather() {
        var timeZone = data.timeZone || "America/Los_Angeles";
        var url = "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + WEATHER_LOCATION.latitude +
            "&longitude=" + WEATHER_LOCATION.longitude +
            "&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,winddirection_10m_dominant" +
            "&temperature_unit=fahrenheit&windspeed_unit=mph" +
            "&timezone=" + encodeURIComponent(timeZone) +
            "&forecast_days=1";

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (json) {
                var daily = json.daily;
                var code = daily.weathercode[0];
                var high = Math.round(daily.temperature_2m_max[0]);
                var low = Math.round(daily.temperature_2m_min[0]);
                var windSpeed = Math.round(daily.windspeed_10m_max[0]);
                var windDir = compassDirection(daily.winddirection_10m_dominant[0]);
                var description = WEATHER_CODES[code] || "Weather conditions";

                bodyEl.textContent = description + " in " + WEATHER_LOCATION.name +
                    " today, with a high near " + high + "°F and a low around " +
                    low + "°F overnight. " + windDir + " wind, up to " + windSpeed + " mph.";
            })
            .catch(function () {
                bodyEl.textContent = "Weather unavailable right now.";
            });
    }
})();
