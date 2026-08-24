// Quantizes+dithers an image to the E Ink Spectra 6 palette (black, white,
// red, yellow, green, blue — the only 6 colors the reTerminal E1004's panel
// can actually display) via Floyd-Steinberg error diffusion, so gradients
// and blended colors in a photo/comic image degrade gracefully into a
// dot-pattern instead of just snapping each pixel to its single nearest
// palette color (which bands badly on anything that isn't already flat
// color, like the shading in comic art).
//
// E Ink hasn't published official RGB values for Spectra 6, and real
// hardware renders noticeably more muted than pure monitor primaries
// (#ff0000 red, #00ff00 green, etc). The values below are the "compensated"
// estimate that a couple of Spectra 6 hobbyist projects (Pimoroni's Inky
// Impression forum, the PhotoPainter Spectra 6 converter) converged on —
// see https://forums.pimoroni.com/t/what-rgb-colors-are-you-using-for-the-colors-on-the-impression-spectra-6/27942
// They're an eyeballed approximation, not a measured spec, so treat this
// as a reasonable starting point rather than ground truth. Even if
// whatever renders /frame on the actual device re-quantizes on its own
// afterward, our pixels are already one of these 6 colors, so a
// nearest-color pass on top of this is a no-op in the worst case.
(function () {
    var PALETTE = [
        [0, 0, 0],       // black
        [255, 255, 255], // white
        [160, 32, 32],   // red    #a02020
        [240, 224, 80],  // yellow #f0e050
        [96, 128, 80],   // green  #608050
        [80, 128, 184]   // blue   #5080b8
    ];

    function nearestPaletteColor(r, g, b) {
        var best = PALETTE[0];
        var bestDist = Infinity;
        for (var i = 0; i < PALETTE.length; i++) {
            var p = PALETTE[i];
            var dr = r - p[0], dg = g - p[1], db = b - p[2];
            var dist = dr * dr + dg * dg + db * db;
            if (dist < bestDist) {
                bestDist = dist;
                best = p;
            }
        }
        return best;
    }

    function clamp(v) {
        return v < 0 ? 0 : v > 255 ? 255 : v;
    }

    function diffuse(data, width, height, x, y, errR, errG, errB, factor) {
        if (x < 0 || x >= width || y < 0 || y >= height) {
            return;
        }
        var i = (y * width + x) * 4;
        data[i] = clamp(data[i] + errR * factor);
        data[i + 1] = clamp(data[i + 1] + errG * factor);
        data[i + 2] = clamp(data[i + 2] + errB * factor);
    }

    // Mutates imageData in place (Floyd-Steinberg error diffusion).
    function ditherToPalette(imageData) {
        var data = imageData.data;
        var width = imageData.width;
        var height = imageData.height;

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var i = (y * width + x) * 4;
                var r = data[i], g = data[i + 1], b = data[i + 2];
                var match = nearestPaletteColor(r, g, b);
                var errR = r - match[0];
                var errG = g - match[1];
                var errB = b - match[2];

                data[i] = match[0];
                data[i + 1] = match[1];
                data[i + 2] = match[2];

                diffuse(data, width, height, x + 1, y, errR, errG, errB, 7 / 16);
                diffuse(data, width, height, x - 1, y + 1, errR, errG, errB, 3 / 16);
                diffuse(data, width, height, x, y + 1, errR, errG, errB, 5 / 16);
                diffuse(data, width, height, x + 1, y + 1, errR, errG, errB, 1 / 16);
            }
        }
    }

    // Draws sourceImg onto canvasEl at canvasEl's existing width/height using
    // the same centering math as CSS object-fit:contain, filling any
    // letterbox margin with black, then dithers the result to the Spectra 6
    // palette. Returns true on success; false (leaving canvasEl untouched)
    // if the canvas is CORS-tainted or the image has no usable dimensions —
    // callers should fall back to the plain <img> in that case.
    function renderDithered(sourceImg, canvasEl) {
        var iw = sourceImg.naturalWidth;
        var ih = sourceImg.naturalHeight;
        if (!iw || !ih) {
            return false;
        }

        var frameWidth = canvasEl.width;
        var frameHeight = canvasEl.height;
        var ctx = canvasEl.getContext("2d");

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, frameWidth, frameHeight);

        var scale = Math.min(frameWidth / iw, frameHeight / ih);
        var drawW = iw * scale;
        var drawH = ih * scale;
        var dx = (frameWidth - drawW) / 2;
        var dy = (frameHeight - drawH) / 2;

        ctx.drawImage(sourceImg, dx, dy, drawW, drawH);

        try {
            var imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
            ditherToPalette(imageData);
            ctx.putImageData(imageData, 0, 0);
        } catch (err) {
            // CORS-tainted canvas (source image didn't allow cross-origin
            // pixel reads) — caller falls back to the undithered <img>.
            return false;
        }

        return true;
    }

    window.FRAME_DITHER = {
        palette: PALETTE,
        renderDithered: renderDithered
    };
})();
