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
//
// The library ships several independently-calibrated Spectra 6 palettes
// (aitjcizeSpectra6Palette, spectra6Palette, spectra6BoeberPalette, etc.) —
// different people's measurements of the same panel type, not necessarily
// of this exact unit. Using spectra6BoeberPalette here specifically
// because its red (#ea4843, a bright coral) reads much closer to true red
// than aitjcizeSpectra6Palette's red (#871300, a dark brick) — the latter
// is what every example in the library's own README uses, but it looked
// too dark on the actual device. Every color in Boeber's set runs brighter
// across the board (white, blue, green too), not just red.
import {
    ditherImage,
    spectra6BoeberPalette
} from "./vendor/epdoptimize.mjs";

// Draws sourceImg onto canvasEl at canvasEl's existing width/height using
// the same math as CSS object-fit:cover — scaled up to fill the frame
// completely, center-cropping whatever overflows the shorter axis, no
// letterbox bars — then dithers the result to the Spectra 6 palette.
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

    // Cover-fit (like CSS object-fit:cover): scale up to fill the frame
    // completely on both axes, center-cropping whatever overflows the
    // shorter axis, rather than contain-fit's letterbox bars. No black
    // fill needed first since the image always covers every pixel.
    var scale = Math.max(frameWidth / iw, frameHeight / ih);
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
    // vivid green/yellow/blue.
    await ditherImage(inputCanvas, canvasEl, {
        palette: spectra6BoeberPalette,
        processingPreset: "balanced",
        ditheringType: "errorDiffusion",
        errorDiffusionMatrix: "floydSteinberg",
        serpentine: true,
        // Manual exposure/saturation/contrast boost, disabled for now.
        // "contrast" mode is required for exposure/saturation/contrast to
        // take effect at all (default mode "off" ignores them) — flip mode
        // back to "contrast" to re-enable.
        toneMapping: { mode: "off", exposure: 0.1, saturation: 0.1, contrast: 0.1 },
        // Force pure-JS processing: avoids pulling in the library's WASM/
        // Worker-accelerated paths, which would mean vendoring and wiring
        // up additional asset files (a .wasm module, a Worker script) for
        // a speed-up that doesn't matter at this image size.
        processingEngine: "js",
        adjustmentEngine: "js",
        // Comic art is basically line art — heavy black ink outlines
        // around every character/panel border — and plain error diffusion
        // was letting dither speckle bleed into those lines, making them
        // read as noisy instead of solid. Both options default to
        // disabled; a side-by-side test on the current comic image showed
        // a clear improvement (cleaner ink lines) with no visible downside
        // elsewhere, so both are on.
        edgePreservation: { enabled: true },
        edgeAntialiasing: { enabled: true }
    });

    return true;
}

window.FRAME_DITHER = {
    palette: spectra6BoeberPalette,
    renderDithered: renderDithered
};
