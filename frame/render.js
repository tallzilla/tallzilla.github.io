// Populates the frame markup from window.FRAME_DATA (set in data.js) and
// window.FRAME_WEATHER (set in weather.js, regenerated on a schedule by
// .github/workflows/update-frame-weather.yml — see frame/generate-weather.js).
// Both are loaded as plain <script src>s before this file, so everything
// here is available synchronously: no fetch()/async race to worry about
// before a screenshot/capture pipeline grabs the page. (An earlier version
// fetched weather client-side, but the device capturing /frame doesn't wait
// for in-page network requests, so it only ever saw the "Loading..." state.)
(function () {
    var data = window.FRAME_DATA || {};

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

    bodyEl.textContent = data.body || window.FRAME_WEATHER || "";
})();
