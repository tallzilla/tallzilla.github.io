// Renders the /frame title/date box and caption box as canvas bitmaps
// instead of live DOM text, and hard-thresholds every pixel to pure black
// or white (no gray, no error diffusion — unlike dither.js's photo
// dithering, text should stay crisp, not dotted).
//
// Thresholding anti-aliased glyphs to 1-bit removes the sub-pixel gradient
// that normally fakes smooth curves, so small/thin strokes show visible
// stairstepping — that's what was reading as "fuzzy" on the real device
// (confirmed: a normal browser view of this page looks the same as the
// device, so nothing downstream is adding extra blur). Larger, heavier
// text has proportionally finer stairsteps relative to the letterform, so
// sizes/weights here are pushed up from what you'd use on a normal screen.
(function () {
    var PADDING = 32;
    var BORDER = 4;
    var THRESHOLD = 150; // luminance below this -> black, else white

    var FONT_FAMILY = '"Helvetica Neue", Helvetica, Arial, sans-serif';

    function threshold(imageData) {
        var data = imageData.data;
        for (var i = 0; i < data.length; i += 4) {
            var luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            var v = luminance < THRESHOLD ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = v;
            data[i + 3] = 255;
        }
    }

    // Same idea as threshold(), but for text drawn on a transparent
    // background (no white box behind it) -- anti-aliased edge pixels snap
    // to fully opaque black/white or fully transparent instead of all
    // being forced opaque, so the untouched background stays see-through.
    function thresholdKeepTransparency(imageData) {
        var data = imageData.data;
        for (var i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) {
                data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
                continue;
            }
            var luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            var v = luminance < THRESHOLD ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = v;
            data[i + 3] = 255;
        }
    }

    // Greedy word-wrap using real glyph measurement. ctx.font must already
    // be set to the font this text will be drawn in.
    function wrapText(ctx, text, maxWidth) {
        var words = text.split(/\s+/).filter(Boolean);
        var lines = [];
        var current = "";

        for (var i = 0; i < words.length; i++) {
            var candidate = current ? current + " " + words[i] : words[i];
            if (current && ctx.measureText(candidate).width > maxWidth) {
                lines.push(current);
                current = words[i];
            } else {
                current = candidate;
            }
        }
        if (current) {
            lines.push(current);
        }
        return lines.length ? lines : [""];
    }

    // Truncates to maxLines, adding an ellipsis to the last line if
    // anything had to be cut — mirrors the old CSS -webkit-line-clamp.
    function clampLines(ctx, lines, maxWidth, maxLines) {
        if (lines.length <= maxLines) {
            return lines;
        }
        var clamped = lines.slice(0, maxLines);
        var last = clamped[maxLines - 1];
        while (last.length > 0 && ctx.measureText(last + "…").width > maxWidth) {
            last = last.slice(0, -1).replace(/\s+$/, "");
        }
        clamped[maxLines - 1] = last + "…";
        return clamped;
    }

    // blocks: [{ font, lineHeight, marginTop, lines: [...] }, ...]
    // Draws a white box with a black border and the given text blocks
    // top-to-bottom, sized to exactly fit the widest line / total line
    // count, then hard-thresholds the whole thing to pure black/white.
    function drawBox(canvasEl, blocks, contentWidth) {
        var contentHeight = 0;
        blocks.forEach(function (block) {
            contentHeight += (block.marginTop || 0) + block.lines.length * block.lineHeight;
        });

        // Each line gets a full lineHeight-tall slot, but actual glyph ink
        // doesn't fill it (lineHeight includes leading for comfortable
        // multi-line spacing) — for every line except the last, that slack
        // just becomes the gap before the next line, which looks right.
        // For the very last line specifically, there's nothing after it to
        // "use" that slack, so it reads as extra padding below the text
        // that the top of the box doesn't have. Trim it so the box hugs
        // the last line's real ink, keeping top/bottom padding symmetric.
        var lastBlock = blocks[blocks.length - 1];
        var lastLine = lastBlock.lines[lastBlock.lines.length - 1];
        var measureCtx = canvasEl.getContext("2d");
        measureCtx.font = lastBlock.font;
        var metrics = measureCtx.measureText(lastLine);
        var tightLastLineHeight = (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0);
        contentHeight -= Math.max(0, lastBlock.lineHeight - tightLastLineHeight);

        var width = Math.ceil(contentWidth) + PADDING * 2 + BORDER * 2;
        var height = Math.ceil(contentHeight) + PADDING * 2 + BORDER * 2;
        canvasEl.width = width;
        canvasEl.height = height;

        var ctx = canvasEl.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = BORDER;
        ctx.strokeRect(BORDER / 2, BORDER / 2, width - BORDER, height - BORDER);

        ctx.fillStyle = "#000";
        ctx.textBaseline = "top";

        var y = BORDER + PADDING;
        blocks.forEach(function (block) {
            y += block.marginTop || 0;
            ctx.font = block.font;
            block.lines.forEach(function (line) {
                ctx.fillText(line, BORDER + PADDING, y);
                y += block.lineHeight;
            });
        });

        var imageData = ctx.getImageData(0, 0, width, height);
        threshold(imageData);
        ctx.putImageData(imageData, 0, 0);
    }

    // Renders the top-left header box: one big title line (or two, if it
    // wraps) followed by any number of equal-weight subtitle lines (e.g.
    // artist, then "piece name, year") — each its own block so a long one
    // wrapping to 2 lines doesn't affect the others. maxContentWidth bounds
    // wrapping; the box itself is sized tightly to whatever the widest
    // actual line is (like the old CSS width:fit-content), not always
    // maxed out.
    function renderHeader(canvasEl, title, subtitleLines, maxContentWidth) {
        var ctx = canvasEl.getContext("2d");
        var titleFont = "bold 72px " + FONT_FAMILY;
        // First subtitle line (the artist) keeps the bold/upright style;
        // the second (piece name + year) is deliberately lighter — unbold,
        // a touch smaller, italic — so it reads as a caption/citation
        // rather than competing with the artist's name.
        var subtitleFonts = [
            "600 30px " + FONT_FAMILY,
            "italic 400 26px " + FONT_FAMILY
        ];
        var subtitleLineHeights = [36, 32];

        ctx.font = titleFont;
        var titleLines = clampLines(ctx, wrapText(ctx, title, maxContentWidth), maxContentWidth, 2);

        var blocks = [{ font: titleFont, lineHeight: 83, marginTop: 0, lines: titleLines }];

        (subtitleLines || []).filter(Boolean).forEach(function (text, i) {
            var font = subtitleFonts[i] || subtitleFonts[subtitleFonts.length - 1];
            var lineHeight = subtitleLineHeights[i] || subtitleLineHeights[subtitleLineHeights.length - 1];
            ctx.font = font;
            var lines = clampLines(ctx, wrapText(ctx, text, maxContentWidth), maxContentWidth, 2);
            blocks.push({ font: font, lineHeight: lineHeight, marginTop: i === 0 ? 12 : 4, lines: lines });
        });

        var contentWidth = 0;
        blocks.forEach(function (block) {
            ctx.font = block.font;
            block.lines.forEach(function (line) {
                contentWidth = Math.max(contentWidth, ctx.measureText(line).width);
            });
        });

        drawBox(canvasEl, blocks, contentWidth);
    }

    // Renders the bottom caption box, spanning a fixed content width
    // (unlike the header, which hugs its text) and clamped to maxLines.
    function renderFooter(canvasEl, body, contentWidth, maxLines) {
        var ctx = canvasEl.getContext("2d");
        var font = "600 34px " + FONT_FAMILY;
        ctx.font = font;
        var lines = clampLines(ctx, wrapText(ctx, body, contentWidth), contentWidth, maxLines);

        drawBox(canvasEl, [
            { font: font, lineHeight: 48, marginTop: 0, lines: lines }
        ], contentWidth);
    }

    // Renders a small black-text-with-white-stroke timestamp directly onto
    // a transparent canvas -- no white box, unlike the header/footer, since
    // the point is for it to sit quietly in the corner over the artwork
    // rather than draw attention like the caption boxes do. The white
    // stroke is what keeps it legible against dark parts of the image
    // instead of an opaque background.
    function renderTimestamp(canvasEl, text) {
        var font = "700 22px " + FONT_FAMILY;
        var strokeWidth = 4;
        var pad = Math.ceil(strokeWidth / 2) + 1;

        var ctx = canvasEl.getContext("2d");
        ctx.font = font;
        var metrics = ctx.measureText(text);
        var textWidth = metrics.width;
        var textHeight = (metrics.actualBoundingBoxAscent || 16) + (metrics.actualBoundingBoxDescent || 4);

        canvasEl.width = Math.ceil(textWidth) + pad * 2;
        canvasEl.height = Math.ceil(textHeight) + pad * 2;

        ctx.font = font;
        ctx.textBaseline = "top";
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(text, pad, pad);
        ctx.fillStyle = "#000";
        ctx.fillText(text, pad, pad);

        var imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
        thresholdKeepTransparency(imageData);
        ctx.putImageData(imageData, 0, 0);
    }

    window.FRAME_TEXT_CANVAS = {
        renderHeader: renderHeader,
        renderFooter: renderFooter,
        renderTimestamp: renderTimestamp
    };
})();
