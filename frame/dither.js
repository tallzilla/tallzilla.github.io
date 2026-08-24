// Quantizes+dithers an image to the E Ink Spectra 6 palette (black, white,
// red, yellow, green, blue — the only 6 colors the reTerminal E1004's panel
// can actually display) using the epdoptimize library (vendored at
// frame/vendor/epdoptimize.mjs — see that file's header for source/license)
// rather than a hand-rolled Floyd-Steinberg implementation. It's built
// specifically for calibrated e-paper color reproduction: tone mapping,
// dynamic range compression, and an auto-recommender that picks dithering
// settings based on whether the source looks like a photo or flat-color
// illustration (comic art, in our case), on top of several dithering
// algorithms — well beyond what's worth hand-rolling here.
//
// epdoptimize's palettes carry two colors per entry: a calibrated `color`
// (what the ink actually looks like, measured against real Spectra 6
// hardware) and a `deviceColor` (a saturated primary meant for a hardware
// driver's own waveform processing, e.g. pure #ff0000 for "red"). We want
// the former — ditherImage()'s output already uses `color`; `deviceColor`
// only matters if you separately call replaceColors() to feed a physical
// EPD controller, which doesn't apply here since /frame is just a web page
// that gets screenshotted, not written to a display driver directly.
import {
    ditherImage,
    aitjcizeSpectra6Palette
} from "./vendor/epdoptimize.mjs";

// Draws sourceImg onto canvasEl at canvasEl's existing width/height using
// the same centering math as CSS object-fit:contain, filling any letterbox
// margin with black, then dithers the result to the Spectra 6 palette.
// Returns a Promise<boolean> — true on success; false (leaving canvasEl
// untouched) if the canvas is CORS-tainted or the image has no usable
// dimensions — callers should fall back to the plain <img> in that case.
async function renderDithered(sourceImg, canvasEl) {
    var iw = sourceImg.naturalWidth;
    var ih = sourceImg.naturalHeight;
    if (!iw || !ih) {
        return false;
    }

    var frameWidth = canvasEl.width;
    var frameHeight = canvasEl.height;

    var inputCanvas = document.createElement("canvas");
    inputCanvas.width = frameWidth;
    inputCanvas.height = frameHeight;
    var inputCtx = inputCanvas.getContext("2d");

    inputCtx.fillStyle = "#000";
    inputCtx.fillRect(0, 0, frameWidth, frameHeight);

    var scale = Math.min(frameWidth / iw, frameHeight / ih);
    var drawW = iw * scale;
    var drawH = ih * scale;
    var dx = (frameWidth - drawW) / 2;
    var dy = (frameHeight - drawH) / 2;

    inputCtx.drawImage(sourceImg, dx, dy, drawW, drawH);

    try {
        // Touch the pixel data up front so a CORS-tainted source throws
        // here, before handing off to the library.
        inputCtx.getImageData(0, 0, 1, 1);
    } catch (err) {
        return false;
    }

    // Fixed options matching the library's own "Quick Start" example,
    // rather than its suggestCanvasProcessingOptions() auto-recommender:
    // the recommender classified this comic page as "textOrUi" content
    // (probably thrown off by all the lettered dialogue) and applied tone
    // mapping/dynamic range compression tuned for that, which came out
    // visibly washed-out — flat panel colors read as pale gray instead of
    // vivid green/yellow/blue. The plain defaults below dither straight
    // against the calibrated palette with no extra tone adjustment and
    // looked correct in a side-by-side test.
    await ditherImage(inputCanvas, canvasEl, {
        palette: aitjcizeSpectra6Palette,
        processingPreset: "balanced",
        ditheringType: "errorDiffusion",
        errorDiffusionMatrix: "floydSteinberg",
        serpentine: true,
        // Force pure-JS processing: avoids pulling in the library's WASM/
        // Worker-accelerated paths, which would mean vendoring and wiring
        // up additional asset files (a .wasm module, a Worker script) for
        // a speed-up that doesn't matter at this image size.
        processingEngine: "js",
        adjustmentEngine: "js"
    });

    return true;
}

window.FRAME_DITHER = {
    palette: aitjcizeSpectra6Palette,
    renderDithered: renderDithered
};
