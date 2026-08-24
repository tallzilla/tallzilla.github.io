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

    var FRAME_WIDTH = 1600;
    var FRAME_HEIGHT = 1200;

    // Both text boxes sit inset 32px from the frame's left/right edges —
    // this is the content width left over after that inset plus the box's
    // own padding (32px) and border (4px) on each side. The header wraps
    // within this as a max-width (and hugs whatever the actual widest line
    // is); the footer uses it as its fixed box width.
    var TEXT_MAX_CONTENT_WIDTH = FRAME_WIDTH - 32 - 32 - 32 * 2 - 4 * 2;

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

    var headerCanvasEl = document.getElementById("frame-header-canvas");
    var footerCanvasEl = document.getElementById("frame-footer-canvas");
    var imageEl = document.getElementById("frame-image");
    var canvasEl = document.getElementById("frame-canvas");

    var title = data.title || "";
    var subtitle = data.subtitle || todayFormatted();
    var body = data.body || window.FRAME_WEATHER || "";

    window.FRAME_TEXT_CANVAS.renderHeader(headerCanvasEl, title, subtitle, TEXT_MAX_CONTENT_WIDTH);
    headerCanvasEl.setAttribute("aria-label", title + " — " + subtitle);

    window.FRAME_TEXT_CANVAS.renderFooter(footerCanvasEl, body, TEXT_MAX_CONTENT_WIDTH, 3);
    footerCanvasEl.setAttribute("aria-label", body);

    if (data.image) {
        imageEl.alt = data.imageAlt || "";
        imageEl.style.display = "";
        canvasEl.style.display = "none";

        // Needed so the canvas below can read the image's pixels at all —
        // without it, a cross-origin image taints the canvas and
        // getImageData throws, which dither.js already falls back from,
        // but skipping this means every cross-origin image would fail.
        imageEl.crossOrigin = "anonymous";

        imageEl.onload = function () {
            if (data.dither === false || !window.FRAME_DITHER) {
                return;
            }
            canvasEl.width = FRAME_WIDTH;
            canvasEl.height = FRAME_HEIGHT;
            var ok = window.FRAME_DITHER.renderDithered(imageEl, canvasEl);
            if (ok) {
                imageEl.style.display = "none";
                canvasEl.style.display = "";
            }
            // else: leave the plain <img> visible (CSS object-fit:contain
            // still applies), e.g. if the source blocks cross-origin pixel
            // reads even with crossOrigin set.
        };

        imageEl.src = data.image;
    } else {
        imageEl.style.display = "none";
        canvasEl.style.display = "none";
    }
})();
