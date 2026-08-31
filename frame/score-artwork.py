#!/usr/bin/env python3
# The automated pixel pre-filter for /frame artworks. This is the exact
# implementation of the "contrast" and "edge density" gates described in
# artworks.js's header comment -- kept here as runnable code so nobody has
# to reconstruct the formula from prose (a plain bilinear resize instead of
# PIL's thumbnail() throws the edge-density number off by ~40%, enough to
# flip the pass/fail verdict, so the details matter).
#
# Only Pillow is needed (no numpy). Python 3.8+.
#
#   python frame/score-artwork.py path/to/candidate.jpg [more.jpg ...]
#       Score one or more image files and print PASS/FAIL per gate.
#
#   python frame/score-artwork.py --audit
#       Re-score every image currently referenced in frame/artworks.js.
#
#   python frame/score-artwork.py --json path/to/candidate.jpg
#       Emit machine-readable JSON instead of a table.
#
# These two gates run on the pixels and are the whole of what this script
# decides. The other criteria in artworks.js are NOT pixel checks and are
# not enforced here:
#   - flat/2D medium: from the Art Institute's artwork_type_title field.
#     Keep the piece only if that string contains one of: painting, print,
#     drawing, watercolor, photograph, pastel, etching, engraving,
#     lithograph, woodcut, gouache, illustration.
#   - aspect ratio: computed from the physical dimensions (cm) in
#     dimensions_detail, kept within ~1.15-1.55 (the frame is 4:3 = 1.333;
#     that band is roughly a 10% cover-crop or less). The pixel aspect of
#     the downloaded image is printed below as FYI only.
#   - final appearance: contrast + edge density are the only automated
#     gates that survived a 21-piece real-device calibration. Everything
#     they let through still needs a human look at a realistic render
#     (frame/calibrate.html).

import json
import re
import sys
from pathlib import Path

from PIL import Image

# --- gates -----------------------------------------------------------------

# Standard deviation of per-pixel luminance on the downscaled sample. Below
# this, a piece doesn't just look muted after 6-color dithering, it nearly
# disappears -- there's too little tonal separation for the palette to work
# with. Validated against real-device verdicts; this one is a real gate.
MIN_CONTRAST_STD = 42.0

# Mean local-gradient magnitude on the same sample. A simpler stand-in for
# "has enough fine detail to survive dithering" after every speckle-style
# proxy tested showed zero correlation with real-device verdicts. Status:
# UNVALIDATED against real-device appearance -- revisit if pieces let
# through this way turn out to look bad in practice.
MIN_EDGE_DENSITY = 25.0

# Longest side of the downscaled luminance sample, in pixels. Passed to
# Image.thumbnail() as a square box, so a landscape image lands at
# 300 x (300 / aspect). Do NOT swap in Image.resize() with an explicit
# filter -- thumbnail()'s default (bicubic + a supersampling pre-reduce)
# preserves markedly more edge energy, and MIN_EDGE_DENSITY was set
# against its output.
SAMPLE_LONGEST_SIDE = 300

# Printed as context, not enforced (see header note on aspect ratio).
ASPECT_GUIDE = (1.15, 1.55)


# --- metrics -------------------------------------------------------------

def _luminance_grid(img):
    """Downscale to the sample size and return (width, height, rows) where
    rows[y][x] is Rec.601 luma (0.299 R + 0.587 G + 0.114 B)."""
    img = img.convert("RGB")
    img.thumbnail((SAMPLE_LONGEST_SIDE, SAMPLE_LONGEST_SIDE))
    w, h = img.size
    px = img.load()
    rows = [
        [0.299 * px[x, y][0] + 0.587 * px[x, y][1] + 0.114 * px[x, y][2]
         for x in range(w)]
        for y in range(h)
    ]
    return w, h, rows


def contrast_std(rows):
    flat = [v for row in rows for v in row]
    mean = sum(flat) / len(flat)
    return (sum((v - mean) ** 2 for v in flat) / len(flat)) ** 0.5


def edge_density(w, h, rows):
    """Mean of sqrt((dL/dx)^2 + (dL/dy)^2) over interior pixels, using
    central differences across a 2-pixel span (not halved)."""
    total = 0.0
    count = 0
    for y in range(1, h - 1):
        row = rows[y]
        above = rows[y - 1]
        below = rows[y + 1]
        for x in range(1, w - 1):
            gx = row[x + 1] - row[x - 1]
            gy = below[x] - above[x]
            total += (gx * gx + gy * gy) ** 0.5
            count += 1
    return total / count if count else 0.0


def score_image(path):
    with Image.open(path) as img:
        pixel_aspect = img.width / img.height
        src = f"{img.width}x{img.height}"
        w, h, rows = _luminance_grid(img)
    contrast = contrast_std(rows)
    edge = edge_density(w, h, rows)
    checks = {
        "contrast": contrast >= MIN_CONTRAST_STD,
        "edge_density": edge >= MIN_EDGE_DENSITY,
    }
    return {
        "path": str(path),
        "source_px": src,
        "pixel_aspect_ratio": round(pixel_aspect, 3),
        "contrast_std": round(contrast, 2),
        "edge_density": round(edge, 2),
        "checks": checks,
        "pass": all(checks.values()),
    }


# --- cli ---------------------------------------------------------------

def _iter_audit_paths():
    here = Path(__file__).resolve().parent
    text = (here / "artworks.js").read_text(encoding="utf-8")
    for rel in re.findall(r'image:\s*"([^"]+)"', text):
        yield here / rel


def _print_row(r):
    flags = "".join(
        c if r["checks"][k] else c.lower()
        for k, c in (("contrast", "C"), ("edge_density", "E"))
    )
    verdict = "PASS" if r["pass"] else "FAIL"
    print(f'{verdict}  [{flags}]  contrast={r["contrast_std"]:6.2f}  '
          f'edge={r["edge_density"]:6.2f}  ar={r["pixel_aspect_ratio"]:.3f}  '
          f'{Path(r["path"]).name}')


def main(argv):
    args = [a for a in argv if not a.startswith("--")]
    opts = {a for a in argv if a.startswith("--")}

    if "--audit" in opts:
        paths = list(_iter_audit_paths())
    else:
        paths = [Path(a) for a in args]

    if not paths:
        print(__doc__ or "usage: score-artwork.py <image.jpg> | --audit", file=sys.stderr)
        return 2

    results = []
    for p in paths:
        try:
            results.append(score_image(p))
        except FileNotFoundError:
            print(f"missing: {p}", file=sys.stderr)
        except Exception as e:  # noqa: BLE001 - report and continue
            print(f"error scoring {p}: {e}", file=sys.stderr)

    if "--json" in opts:
        print(json.dumps(results, indent=2))
        return 0

    print(f"gates: contrast>={MIN_CONTRAST_STD:g}  edge>={MIN_EDGE_DENSITY:g}   "
          f"(lowercase flag = that check failed; ar shown for context, not gated)")
    for r in sorted(results, key=lambda r: -r["edge_density"]):
        _print_row(r)

    failed = [r for r in results if not r["pass"]]
    print(f"\n{len(results) - len(failed)}/{len(results)} pass both gates")
    return 1 if (failed and "--audit" not in opts) else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
