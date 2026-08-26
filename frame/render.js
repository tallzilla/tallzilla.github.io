// Populates the frame markup from window.FRAME_DATA (set in data.js) and
// window.FRAME_WEATHER (set in weather.js, regenerated on a schedule by
// .github/workflows/update-frame-weather.yml — see frame/generate-weather.js).
// Both are loaded as plain <script>s before this file, so title/date/
// caption text are all available synchronously — no fetch()/async race to
// worry about before a screenshot/capture pipeline grabs the page. (An
// earlier version fetched weather client-side, but the device capturing
// /frame doesn't wait for in-page network requests, so it only ever saw
// the "Loading..." state.) Image dithering below is the one async piece
// (epdoptimize's ditherImage() is Promise-based), but it's pure in-page
// CPU work with no network call of its own, tied to the <img> load event,
// which any real capture pipeline already has to wait for anyway.
(function () {
    var data = window.FRAME_DATA || {};

    var FRAME_WIDTH = 1600;
    var FRAME_HEIGHT = 1200;

    // Both text boxes sit inset 32px from the frame's left/right edges —
    // this is the content width left over after that inset plus the box's
    // own padding (32px) and border (4px) on each side. The header wraps
    // within this as a max-width (and hugs whatever the actual widest line
    // is); the footer uses it as its fixed box width (or, when a manual
    // data.body override is set, the single full-width footer box below).
    var TEXT_MAX_CONTENT_WIDTH = FRAME_WIDTH - 32 - 32 - 32 * 2 - 4 * 2;

    // Normal (non-override) footer: two boxes side by side, weather at 1/5
    // width and transit at 4/5, sharing the same 32px left/right inset and
    // a gap between them. BOX_OVERHEAD is each box's own padding+border
    // (32px padding + 4px border, both sides) that drawBox() adds on top of
    // whatever contentWidth it's given.
    var FOOTER_GAP = 24;
    var BOX_OVERHEAD = 32 * 2 + 4 * 2;
    var FOOTER_TOTAL_OUTER = FRAME_WIDTH - 32 - 32;
    var WEATHER_BOX_OUTER = Math.round((FOOTER_TOTAL_OUTER - FOOTER_GAP) / 5);
    var TRANSIT_BOX_OUTER = FOOTER_TOTAL_OUTER - FOOTER_GAP - WEATHER_BOX_OUTER;
    var WEATHER_CONTENT_WIDTH = WEATHER_BOX_OUTER - BOX_OVERHEAD;
    var TRANSIT_CONTENT_WIDTH = TRANSIT_BOX_OUTER - BOX_OVERHEAD;

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

    // Unlike the weather caption's time (baked in by the scheduled GitHub
    // Action, so only accurate to within ~2 hours), this reflects the
    // actual moment this page rendered — the closest client-side proxy for
    // "when was this capture taken."
    function nowFormatted() {
        var d = new Date();
        return d.toLocaleTimeString("en-US", {
            timeZone: data.timeZone || "America/Los_Angeles",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    var headerCanvasEl = document.getElementById("frame-header-canvas");
    var footerWeatherCanvasEl = document.getElementById("frame-footer-weather-canvas");
    var footerTransitCanvasEl = document.getElementById("frame-footer-transit-canvas");
    var timestampCanvasEl = document.getElementById("frame-timestamp-canvas");
    var imageEl = document.getElementById("frame-image");
    var canvasEl = document.getElementById("frame-canvas");

    // data.image left null picks a random entry from window.FRAME_ARTWORKS
    // (frame/artworks.js) instead — a fresh painting each time the page is
    // loaded, rather than one fixed image. Math.random() here is plain
    // synchronous JS, not a network call, so there's no async-timing risk
    // like the old client-side weather fetch had. Computed before the
    // header, since the header shows this artwork's own title/artist.
    var artworkPick = null;
    if (!data.image && window.FRAME_ARTWORKS && window.FRAME_ARTWORKS.length) {
        artworkPick = window.FRAME_ARTWORKS[Math.floor(Math.random() * window.FRAME_ARTWORKS.length)];
    }
    var image = data.image || (artworkPick && artworkPick.image) || null;

    // The date is the main thing this frame shows at a glance, so it's the
    // big title now — not a personal greeting. Below it, two equal-weight
    // lines: the artwork's artist, then its title and year. Falls back to
    // data.subtitle as a single line if there's no artwork (a manually
    // pinned data.image with no matching frame/artworks.js entry).
    var title = data.title || todayFormatted();
    var subtitleLines = artworkPick
        ? [artworkPick.artist, artworkPick.title + (artworkPick.date ? ", " + artworkPick.date : "")]
        : (data.subtitle ? [data.subtitle] : []);
    var imageAlt = data.imageAlt || (artworkPick && (artworkPick.title + ", " + artworkPick.artist + ", " + artworkPick.date)) || "";

    window.FRAME_TEXT_CANVAS.renderHeader(headerCanvasEl, title, subtitleLines, TEXT_MAX_CONTENT_WIDTH);
    headerCanvasEl.setAttribute("aria-label", [title].concat(subtitleLines).join(" — "));

    // Weather (icon card) and transit are two separate boxes (1/5 + 4/5
    // width) side by side. A manual data.body override replaces both with
    // one full-width text box instead (the original layout), since there's
    // no sensible way to split hand-written text into a weather card.
    if (data.body) {
        footerWeatherCanvasEl.style.display = "none";
        footerTransitCanvasEl.style.left = "32px";
        window.FRAME_TEXT_CANVAS.renderFooter(footerTransitCanvasEl, data.body, TEXT_MAX_CONTENT_WIDTH, 4);
        footerTransitCanvasEl.setAttribute("aria-label", data.body);
    } else {
        var weather = window.FRAME_WEATHER || null;
        var transitText = window.FRAME_TRANSIT || "";

        // Transit renders first so its actual height (which varies with
        // however many departures fall in the next-hour window) is known;
        // the weather card is then sized to match exactly rather than the
        // two boxes each computing their own height and drifting apart by
        // a few px.
        footerTransitCanvasEl.style.left = (32 + WEATHER_BOX_OUTER + FOOTER_GAP) + "px";
        window.FRAME_TEXT_CANVAS.renderFooter(footerTransitCanvasEl, transitText, TRANSIT_CONTENT_WIDTH, 6);
        footerTransitCanvasEl.setAttribute("aria-label", transitText);

        footerWeatherCanvasEl.style.display = "";
        footerWeatherCanvasEl.style.left = "32px";
        window.FRAME_TEXT_CANVAS.renderWeatherCard(footerWeatherCanvasEl, weather, WEATHER_CONTENT_WIDTH, footerTransitCanvasEl.height);
        footerWeatherCanvasEl.setAttribute("aria-label", weather ? weather.ariaLabel : "");
    }

    var timestamp = "updated @ " + nowFormatted().replace(" ", "");
    window.FRAME_TEXT_CANVAS.renderTimestamp(timestampCanvasEl, timestamp);
    timestampCanvasEl.setAttribute("aria-label", "Rendered at " + nowFormatted());

    // Attempts one <img> load, resolving true/false for success/failure.
    // useCrossOrigin requests the image in CORS mode, needed so the canvas
    // below can read its pixels back out for dithering — but some hosts'
    // CORS policy only allowlists their own site (not "*"), and a browser
    // makes that a hard failure for the whole request in CORS mode, not
    // just a "can't read pixels later" restriction: the <img> never loads
    // at all, not even to display undithered. So this is called twice —
    // once with CORS to try for dithering, and if that outright fails,
    // once more without it, so the image can still show up undithered
    // rather than not appearing at all.
    function tryLoadImage(src, useCrossOrigin) {
        return new Promise(function (resolve) {
            function cleanup() {
                imageEl.onload = null;
                imageEl.onerror = null;
            }
            imageEl.onload = function () {
                cleanup();
                resolve(true);
            };
            imageEl.onerror = function () {
                cleanup();
                resolve(false);
            };
            if (useCrossOrigin) {
                imageEl.crossOrigin = "anonymous";
            } else {
                imageEl.removeAttribute("crossorigin");
            }
            imageEl.src = src;
        });
    }

    if (image) {
        imageEl.alt = imageAlt;
        imageEl.style.display = "";
        canvasEl.style.display = "none";

        tryLoadImage(image, true).then(function (loadedWithCors) {
            return loadedWithCors ? true : tryLoadImage(image, false);
        }).then(function (loaded) {
            if (!loaded) {
                imageEl.style.display = "none"; // genuinely broken image URL
                return;
            }
            if (data.dither === false || !window.FRAME_DITHER || !imageEl.hasAttribute("crossorigin")) {
                return; // no dithering attempt: opted out, or CORS load failed
            }
            canvasEl.width = FRAME_WIDTH;
            canvasEl.height = FRAME_HEIGHT;
            window.FRAME_DITHER.renderDithered(imageEl, canvasEl).then(function (ok) {
                if (ok) {
                    imageEl.style.display = "none";
                    canvasEl.style.display = "";
                }
                // else: leave the plain <img> visible (CSS
                // object-fit:contain still applies) — e.g. the source
                // blocks cross-origin pixel reads even though the CORS
                // load itself succeeded.
            });
        });
    } else {
        imageEl.style.display = "none";
        canvasEl.style.display = "none";
    }
})();
