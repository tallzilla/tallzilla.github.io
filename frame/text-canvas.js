// Renders the /frame title/date box and caption box as canvas bitmaps
// instead of live DOM text, and hard-thresholds every pixel to pure black
// or white (no gray, no error diffusion — unlike dither.js's photo
// dithering, text should stay crisp, not dotted). On the real eink device,
// normal anti-aliased font edges (smooth gray pixels along glyph curves)
// were getting fuzzed by whatever converts the page for the 6-color panel —
// same class of problem the comic image had before dither.js, except text
// wants a hard cutoff rather than a dither pattern.
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

    // Renders the top-left title/date box. maxContentWidth bounds wrapping;
    // the box itself is sized tightly to whatever the widest actual line is
    // (like the old CSS width:fit-content), not always maxed out.
    function renderHeader(canvasEl, title, subtitle, maxContentWidth) {
        var ctx = canvasEl.getContext("2d");
        var titleFont = "bold 56px " + FONT_FAMILY;
        var subtitleFont = "400 24px " + FONT_FAMILY;

        ctx.font = titleFont;
        var titleLines = clampLines(ctx, wrapText(ctx, title, maxContentWidth), maxContentWidth, 2);

        ctx.font = subtitleFont;
        var subtitleLines = clampLines(ctx, wrapText(ctx, subtitle, maxContentWidth), maxContentWidth, 1);

        var contentWidth = 0;
        titleLines.concat(subtitleLines).forEach(function (line, i) {
            ctx.font = i < titleLines.length ? titleFont : subtitleFont;
            contentWidth = Math.max(contentWidth, ctx.measureText(line).width);
        });

        drawBox(canvasEl, [
            { font: titleFont, lineHeight: 64, marginTop: 0, lines: titleLines },
            { font: subtitleFont, lineHeight: 29, marginTop: 10, lines: subtitleLines }
        ], contentWidth);
    }

    // Renders the bottom caption box, spanning a fixed content width
    // (unlike the header, which hugs its text) and clamped to maxLines.
    function renderFooter(canvasEl, body, contentWidth, maxLines) {
        var ctx = canvasEl.getContext("2d");
        var font = "400 26px " + FONT_FAMILY;
        ctx.font = font;
        var lines = clampLines(ctx, wrapText(ctx, body, contentWidth), contentWidth, maxLines);

        drawBox(canvasEl, [
            { font: font, lineHeight: 36, marginTop: 0, lines: lines }
        ], contentWidth);
    }

    window.FRAME_TEXT_CANVAS = {
        renderHeader: renderHeader,
        renderFooter: renderFooter
    };
})();
