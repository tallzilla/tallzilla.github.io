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
    // be set to the font this text will be drawn in. "\n" in the source
    // text forces a line break (e.g. the transit caption puts each route on
    // its own line) — each such paragraph is wrapped independently so a
    // long one still soft-wraps instead of overflowing maxWidth.
    function wrapText(ctx, text, maxWidth) {
        var lines = [];
        text.split("\n").forEach(function (paragraph) {
            var words = paragraph.split(/\s+/).filter(Boolean);
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
            lines.push(current);
        });
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

    // A line is either a plain string (drawn in the block's font, the
    // common case) or an array of { text, font } runs for a line that
    // mixes weights (e.g. renderTransitFooter's bold-live/normal-scheduled
    // departures) -- drawBox itself doesn't need to care which shape it got.
    function drawLine(ctx, blockFont, line, x, y) {
        if (typeof line === "string") {
            ctx.font = blockFont;
            ctx.fillText(line, x, y);
            return;
        }
        var curX = x;
        line.forEach(function (run) {
            ctx.font = run.font;
            ctx.fillText(run.text, curX, y);
            curX += ctx.measureText(run.text).width;
        });
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
        var lastLineText = typeof lastLine === "string" ? lastLine : lastLine.map(function (r) { return r.text; }).join("");
        measureCtx.font = lastBlock.font;
        var metrics = measureCtx.measureText(lastLineText);
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
            block.lines.forEach(function (line) {
                drawLine(ctx, block.font, line, BORDER + PADDING, y);
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

    // Path data vendored from Lucide (lucide.dev, ISC license), not loaded
    // at runtime — just the `d` attributes for the handful of weather icons
    // this card needs, each in Lucide's native 24x24 viewBox with a plain
    // stroke (no fill), matching the "simple black outline, hollow middle"
    // look. sun.svg's <circle> is expressed as an equivalent two-arc path
    // so every icon here is a flat array of Path2D-compatible `d` strings.
    // See generate-weather.js's WEATHER_CODES for how a WMO code maps to
    // one of these category names.
    var WEATHER_ICON_PATHS = {
        "clear": [ // lucide "sun"
            "M8 12a4 4 0 1 0 8 0 4 4 0 1 0 -8 0",
            "M12 2v2", "M12 20v2",
            "m4.93 4.93 1.41 1.41", "m17.66 17.66 1.41 1.41",
            "M2 12h2", "M20 12h2",
            "m6.34 17.66-1.41 1.41", "m19.07 4.93-1.41 1.41"
        ],
        "partly-cloudy": [ // lucide "cloud-sun"
            "M12 2v2", "m4.93 4.93 1.41 1.41", "M20 12h2", "m19.07 4.93-1.41 1.41",
            "M15.947 12.65a4 4 0 0 0-5.925-4.128",
            "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"
        ],
        "cloudy": [ // lucide "cloud"
            "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"
        ],
        "fog": [ // lucide "cloud-fog"
            "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
            "M16 17H7", "M17 21H9"
        ],
        "rain": [ // lucide "cloud-rain"
            "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
            "M16 14v6", "M8 14v6", "M12 16v6"
        ],
        "snow": [ // lucide "cloud-snow"
            "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",
            "M8 15h.01", "M8 19h.01", "M12 17h.01", "M12 21h.01", "M16 15h.01", "M16 19h.01"
        ],
        "thunder": [ // lucide "cloud-lightning"
            "M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973",
            "m13 12-3 5h4l-3 5"
        ]
    };

    // Draws one weather icon inside the x,y,size square by stroking Lucide
    // path data scaled from its native 24x24 viewBox — pure black stroke,
    // hollow middle (no fill), matching every other icon in the set.
    // renderWeatherCard() thresholds the whole canvas afterward like every
    // other box here.
    function drawWeatherIcon(ctx, icon, x, y, size) {
        var paths = WEATHER_ICON_PATHS[icon] || WEATHER_ICON_PATHS.cloudy;
        var scale = size / 24;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.6; // in 24-unit icon space; scales up with the icon
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        paths.forEach(function (d) {
            ctx.stroke(new Path2D(d));
        });
        ctx.restore();
    }

    // Renders the compact weather card: an icon plus three short lines
    // (temp, high/low, next sunrise/sunset) rather than a wrapped prose
    // sentence — deliberately terse since this box is only 1/5 of the
    // footer's width. targetHeight, when given, is the transit box's own
    // rendered height (render.js draws that one first) so the two footer
    // boxes come out exactly the same height instead of two independent
    // computations drifting apart by a few px.
    function renderWeatherCard(canvasEl, weather, contentWidth, targetHeight) {
        var ctx = canvasEl.getContext("2d");
        if (!weather) {
            canvasEl.width = 0;
            canvasEl.height = 0;
            return;
        }

        var tempFont = "700 30px " + FONT_FAMILY;
        var detailFont = "600 21px " + FONT_FAMILY;
        var lineHeight1 = 34;
        var lineHeight2 = 26;
        var textHeight = lineHeight1 + lineHeight2 * 2;
        var iconGap = 14;

        // Match the transit box's actual content height exactly when given
        // one, even if that's slightly less than this card's natural text
        // stack height (textHeight) — equal box heights matter more than a
        // few px of extra breathing room around the text.
        var contentHeight = targetHeight ? (targetHeight - PADDING * 2 - BORDER * 2) : textHeight;
        var iconSize = contentHeight;

        var width = Math.ceil(contentWidth) + PADDING * 2 + BORDER * 2;
        var height = Math.ceil(contentHeight) + PADDING * 2 + BORDER * 2;
        canvasEl.width = width;
        canvasEl.height = height;

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = BORDER;
        ctx.strokeRect(BORDER / 2, BORDER / 2, width - BORDER, height - BORDER);

        var originX = BORDER + PADDING;
        var originY = BORDER + PADDING;

        drawWeatherIcon(ctx, weather.icon, originX, originY, iconSize);

        var textX = originX + iconSize + iconGap;
        var textY = originY + Math.max(0, (contentHeight - textHeight) / 2);
        ctx.fillStyle = "#000";
        ctx.textBaseline = "top";
        ctx.font = tempFont;
        ctx.fillText(weather.temp + "°F", textX, textY);
        ctx.font = detailFont;
        ctx.fillText("H" + weather.high + "° L" + weather.low + "°", textX, textY + lineHeight1);
        ctx.fillText(weather.sunGlyph + weather.sunTime, textX, textY + lineHeight1 + lineHeight2);

        var imageData = ctx.getImageData(0, 0, width, height);
        threshold(imageData);
        ctx.putImageData(imageData, 0, 0);
    }

    // Renders a caption box, spanning a fixed content width (unlike the
    // header, which hugs its text) and clamped to maxLines. fontSize/
    // lineHeight default to the original single-box footer's sizing;
    // callers with a narrower box (e.g. the split weather/transit footer)
    // can pass smaller values so more text fits before truncating.
    function renderFooter(canvasEl, body, contentWidth, maxLines, fontSize, lineHeight) {
        var ctx = canvasEl.getContext("2d");
        var font = "600 " + (fontSize || 34) + "px " + FONT_FAMILY;
        ctx.font = font;
        var lines = clampLines(ctx, wrapText(ctx, body, contentWidth), contentWidth, maxLines);

        drawBox(canvasEl, [
            { font: font, lineHeight: lineHeight || 48, marginTop: 0, lines: lines }
        ], contentWidth);
    }

    // Renders the transit box: one line per route, each holding as many
    // upcoming departures as fit without wrapping onto a second line --
    // unlike renderFooter's word-wrap, this stops adding entries the moment
    // the next one would overflow contentWidth rather than wrapping them
    // onto extra lines, so the box reads as "however many happen to fit"
    // instead of a ragged multi-line dump.
    //
    // segments: [{ route, stopName, entries: [{ time: <ISO string>, label,
    // live }] }, ...], baked ahead of time by generate-transit.js (live
    // entries from real-time StopMonitoring, non-live ones filled in from
    // the published schedule -- see that file's top comment). Entries are
    // filtered here against `now` (the actual render/capture moment, not
    // generate-transit.js's bake time -- the frame can be captured a while
    // after the data was baked) so a departure that's already passed by the
    // time this page is actually rendered doesn't show up as a prediction.
    // Live departures draw bold, scheduled ones at normal weight, so it's
    // visually clear which times reflect an actually-tracked bus.
    function renderTransitFooter(canvasEl, segments, contentWidth, now) {
        var ctx = canvasEl.getContext("2d");
        var fontSize = 34;
        var lineHeight = 48;
        var baseFont = "600 " + fontSize + "px " + FONT_FAMILY;
        var liveFont = "700 " + fontSize + "px " + FONT_FAMILY;
        var scheduledFont = "400 " + fontSize + "px " + FONT_FAMILY;

        function measure(font, text) {
            ctx.font = font;
            return ctx.measureText(text).width;
        }

        var lines = (segments || []).map(function (segment) {
            var prefix = segment.route + " (" + segment.stopName + "): ";
            var upcoming = segment.entries.filter(function (e) {
                return new Date(e.time) > now;
            });
            if (upcoming.length === 0) {
                return prefix + "no buses expected soon";
            }

            var runs = [{ text: prefix, font: baseFont }];
            var width = measure(baseFont, prefix);
            for (var i = 0; i < upcoming.length; i++) {
                var entry = upcoming[i];
                var entryFont = entry.live ? liveFont : scheduledFont;
                var sep = i === 0 ? "" : ", ";
                var addWidth = (sep ? measure(baseFont, sep) : 0) + measure(entryFont, entry.label);
                if (i > 0 && width + addWidth > contentWidth) {
                    break;
                }
                if (sep) runs.push({ text: sep, font: baseFont });
                runs.push({ text: entry.label, font: entryFont });
                width += addWidth;
            }
            return runs;
        });

        drawBox(canvasEl, [
            { font: baseFont, lineHeight: lineHeight, marginTop: 0, lines: lines }
        ], contentWidth);
    }

    // Renders a small black-text-with-white-stroke timestamp directly onto
    // a transparent canvas -- no white box, unlike the header/footer, since
    // the point is for it to sit quietly in the corner over the artwork
    // rather than draw attention like the caption boxes do. The white
    // stroke is what keeps it legible against dark parts of the image
    // instead of an opaque background.
    function renderTimestamp(canvasEl, text) {
        var font = "700 14px " + FONT_FAMILY;
        var strokeWidth = 3;
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
        renderTransitFooter: renderTransitFooter,
        renderWeatherCard: renderWeatherCard,
        renderTimestamp: renderTimestamp
    };
})();
