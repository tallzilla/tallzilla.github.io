// Curated list of public-domain artworks, sourced from the Art Institute of
// Chicago's open API (api.artic.edu), filtered on four criteria: flat/2D
// media only (see the fourth-check note below), aspect ratio close to the
// frame's own 1600x1200 (roughly 10% cover-crop or less), contrast, and
// edge density (below). The last two run on the pixels and are
// implemented exactly in frame/score-artwork.py -- run that on a
// candidate file (or with --audit over this whole list) rather than
// re-deriving the formula; the downscale filter in particular is fiddly
// enough that a near-miss reconstruction flips pass/fail verdicts. There
// used to be a fifth criterion -- physical
// size within ~2x the frame's actual ~10.6x8in (27x20cm) footprint, meant
// to keep out pieces so much larger than the display that they'd have been
// downscaled from something far more detailed than what a 1600x1200 render
// can resolve -- dropped as redundant with the checks below.
//
// Edge density: mean local-gradient magnitude on a downscaled (300px
// longest side) luminance sample, sqrt((d luminance/dx)^2 + (d
// luminance/dy)^2) averaged over every pixel. Required to be at least 25.
// This is a deliberate, explicit departure from the finding right below
// it (the real-dither-output speckle metric, and every other automated
// proxy tried, showed zero correlation with real-device verdicts from a
// 21-piece human calibration exercise) -- that calibration data is being
// set aside on purpose to try a simpler rule instead. Current status:
// unvalidated against real-device appearance. Revisit if pieces let
// through this way turn out to look bad in practice.
//
// Contrast is measured on a downscaled sample as the standard deviation of
// per-pixel luminance, required to be at least ~42 out of 255. This
// matters specifically for the 6-color Spectra palette: a genuinely faint
// piece (a pale pencil sketch, a soft pastel with huge low-contrast
// sky/sand areas) doesn't just look muted after dithering, it disappears
// almost entirely, since there's barely any tonal separation for the
// palette to work with. Rejecting those at selection time is the fix, not
// trying to contrast-correct them at render time -- tried that first (tone
// mapping + dynamic range compression) and even a heavy-handed version
// only partially recovered a piece that was a lost cause to begin with.
//
// Note on the contrast check: a simple percentile range (p95-p5 luminance)
// isn't reliable on its own -- it lets through pieces that are mostly
// near-white with only a thin dark tail (a faint sketch with one small
// dark detail can technically post a wide range while still reading as
// washed-out everywhere else). Standard deviation catches that skew and is
// the metric actually enforced now; the range is still worth glancing at
// but isn't the gate.
//
// A LOT of effort went into a fourth automated check meant to catch dense
// fine detail (engraving/etching crosshatch, a scan with a subtle sepia
// cast) that survives the contrast check fine but comes out as chaotic
// multi-color speckle after dithering. Several source-image proxies were
// tried and rejected as uncorrelated with the real outcome (luminance
// midtone fraction, distance-to-nearest-palette-color, distance-margin
// between nearest/second-nearest palette color). The one that seemed most
// promising: run the real candidate through the real dither pipeline
// (dither.js/epdoptimize, same as production) and measure the OUTPUT --
// tile it into small windows and check what fraction contain 4+ distinct
// colors, on the theory that a coherent dithered region only needs 2
// colors to fake one in-between tone while genuine chaos cycles through
// most of the palette in a tiny area.
//
// That metric is NOT reliable and should not be used. It was tuned
// against the wrong ground truth: zoomed-in screenshots of the dithered
// output, inspected at well beyond 1:1 pixel scale on a monitor. Dithered
// images ALWAYS look like chaotic speckle at that zoom level -- that's
// what dithering fundamentally is, independent of whether the source
// image actually dithers well. Judging candidates that way manufactures
// false rejections. The real test is the physical device (or a fair
// approximation: the real dithered output shown at roughly true size, on
// a normal screen, at normal viewing distance -- see frame/calibrate.html,
// a throwaway review tool built for exactly this, and its instructions).
// When several pieces this metric had flagged as bad were actually
// checked that way, the results were damning for the metric: confirmed
// pass and confirmed fail scores completely overlapped (e.g. a
// confirmed-good piece at 0.98, a confirmed-bad piece at 0.76). There is
// currently no known automated proxy for "will this speckle badly" --
// contrast and flat/2D-media (below) are the only two automated gates;
// everything else needs an actual human look at an actual (or
// realistically approximated) render. Don't spend more time trying to
// re-derive a numeric threshold for this without new real-device evidence
// backing it -- that's the mistake that produced this whole situation.
//
// A separate check rejects anything that isn't a flat/2D medium -- a
// photograph of a physical object (a ceramic vessel, a woven textile, a
// sculpture) rather than a painting/print/drawing/photograph-as-artwork.
// Nothing about contrast catches this failure mode; a well-lit object
// photo can dither perfectly cleanly and still be wrong for a display
// meant to show 2D art. Caught via AIC's artwork_type_title field (keep
// it if the string contains "painting", "print", "drawing", "watercolor",
// "photograph", "pastel", "etching", "engraving", "lithograph",
// "woodcut", "gouache", or "illustration"; reject otherwise -- e.g.
// "Textile", "Vessel", "Sculpture"). A depth/diameter check on
// dimensions_detail was tried as a backstop and abandoned: it produces
// false positives on ordinary framed paintings (which legitimately have a
// physical frame depth), so it isn't a reliable signal on its own. This
// check hasn't itself been invalidated by the speckle-metric mess above,
// but it also hasn't been stress-tested much -- treat it as reasonable,
// not gospel.
//
// render.js picks one at random on every page load when data.js's "image"
// is left null, and uses title/artist/date to build the header text.
//
// Images are self-hosted at frame/images/art/{image_id}.jpg rather than
// hotlinked from AIC live -- AIC's CORS is permissive (confirmed working
// for dithering) but the actual device reported images just not showing
// up while everything else on the page rendered fine, and AIC is a small
// museum API, not a CDN, being hit on every scheduled capture.
// Self-hosting removes that dependency entirely.
//
// To add more: search https://api.artic.edu/api/v1/artworks/search with
// query[term][is_public_domain]=true and fields including
// artwork_type_title (see the flat/2D-media note above) and
// dimensions_detail (for the aspect-ratio check -- width/height ratio
// within about 1.15-1.55; no size floor/ceiling). Note: the AIC search
// endpoint (api.artic.edu) rate-limits much more aggressively than its
// IIIF image endpoint (www.artic.edu/iiif/2/...) -- more than ~5 rapid
// requests in a tight loop silently fails to write output files. Space
// search-endpoint calls out (a second or so apart) or batch them in small
// groups; the image-download endpoint doesn't have this problem. Then
// download the image at
// https://www.artic.edu/iiif/2/{image_id}/full/!2400,1800/0/default.jpg
// (the !2400,1800 size fits inside that box, so the result covers the
// frame's 1600x1200 on both axes even at the extremes of the aspect band;
// !1600,1200 lands short on one axis and gets upscaled at render time)
// and run `python frame/score-artwork.py <file>` -- it must report PASS
// (contrast std >= 42, edge density >= 25, and >= 1600x1200 delivered)
// before the piece is worth keeping. Save it to
// frame/images/art/{image_id}.jpg and add an entry below.

window.FRAME_ARTWORKS = [
    {
        image: "images/art/a748474d-ba2f-d3e5-da04-05e525a3f37a.jpg",
        title: "Ship Building, Gloucester Harbor",
        artist: "Winslow Homer",
        date: "1873"
    },
    {
        image: "images/art/f33cab45-4591-d51f-76f3-9aa8076e033e.jpg",
        title: "Ruins of the Palace of the Caesars in Rome, plate eight from Die Römische Ansichten",
        artist: "Joseph Anton Koch",
        date: "1810"
    },
    {
        image: "images/art/38726da7-8122-dc49-9243-766a1eeba9ed.jpg",
        title: "A Mild Breeze on a Fine Day (Gaifu kaisei), from the series \"Thirty-six Views of Mount Fuji (Fugaku sanjurokkei)\"",
        artist: "Katsushika Hokusai 葡飾 北斎",
        date: "c. 1830/33"
    },
    {
        image: "images/art/b3974542-b9b4-7568-fc4b-966738f61d78.jpg",
        title: "Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave, from the series \"Thirty-Six Views of Mount Fuji (Fugaku sanjūrokkei)\"",
        artist: "Katsushika Hokusai 葛飾 北斎",
        date: "1830/33"
    },
    {
        image: "images/art/e29ab761-2da7-f2ae-85a7-0f6be42e95a3.jpg",
        title: "Pine Beach with Shrine Gate, from the series \"A World of Things (Momoyogusa)\"",
        artist: "Kamisaka Sekka 神坂 雪佳",
        date: "1909/10"
    },
    {
        image: "images/art/4d5a6178-a330-708a-c7eb-cfa20c3f66af.jpg",
        title: "Cliffs and Sea, Sainte-Adresse",
        artist: "Claude Monet",
        date: "c. 1864"
    },
    {
        image: "images/art/d11c0a27-95f3-92fd-049b-37003e3cdf5a.jpg",
        title: "The Battle around the Shield and Lance",
        artist: "Giovanni Jacopo Caraglio",
        date: "c. 1527"
    },
    {
        image: "images/art/34f09257-4c7f-3421-7396-e9dba321258a.jpg",
        title: "Weeping Tree",
        artist: "Vincent van Gogh",
        date: "1889"
    },
    {
        image: "images/art/66ebff3a-12b4-763f-8f56-167301b59360.jpg",
        title: "Snow at Akabane Bridge in Shiba (Shiba Akabane no yuki), from the series \"Famous Places in the Eastern Capital (Toto meisho)\"",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "c. 1843/47"
    },
    {
        image: "images/art/cef4e5df-a749-090b-b897-7d5f40654685.jpg",
        title: "Hamamatsu, from the series \"Fifty-three Stations of the Tokaido (Tokaido gojusan tsugi),\" also known as the Tokaido with Poem (Kyoka iri Tokaido)",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "c. 1837/42"
    },
    {
        image: "images/art/38636be8-f1bc-c451-ae65-c441919bd0c3.jpg",
        title: "Bullfight",
        artist: "Édouard Manet",
        date: "1865–66"
    },
    {
        image: "images/art/c287562e-816e-096c-022a-b05199ba4b8f.jpg",
        title: "Kanbara: Evening Snow (Kanbara, yoru no yuki), from the series \"Fifty-three Stations of the Tokaido (Tokaido gojusan tsugi no uchi),\" also known as the Hoeido Tokaido",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "c. 1833/34"
    },
    {
        image: "images/art/43642ffb-2bd7-3f70-d6e6-3c0bee12d83c.jpg",
        title: "Village in Brittany",
        artist: "Charles François Daubigny",
        date: "1844"
    },
    {
        image: "images/art/e35161fb-cd78-b757-8000-15ba3ebb0fc3.jpg",
        title: "The Annunciation",
        artist: "George Hitchcock",
        date: "1887"
    },
    {
        image: "images/art/97eae368-8f14-4a2d-e69d-358a3e9c3a5b.jpg",
        title: "Harbor Scene",
        artist: "William Roxby Beverley",
        date: "n.d."
    },
    {
        image: "images/art/b34de958-1cbe-065f-4941-c34f64d2b366.jpg",
        title: "After the Hurricane, Bahamas",
        artist: "Winslow Homer",
        date: "1899"
    },
    {
        image: "images/art/5d467173-3de8-2a29-ee53-d3af6c8a7812.jpg",
        title: "Farm Courtyard",
        artist: "François Boucher",
        date: "c. 1750"
    },
    {
        image: "images/art/4534cb54-bbde-d48d-e58e-779a03efefe3.jpg",
        title: "Pontefract Castle",
        artist: "J. Marsden",
        date: "1774"
    },
    {
        image: "images/art/ec14e825-ed02-c8a5-c25d-c04cbbc6a471.jpg",
        title: "Sketch for The Revolt of Cairo",
        artist: "Anne-Louis Girodet de Roussy-Trioson",
        date: "c. 1810"
    },
    {
        image: "images/art/d9bde524-38b2-4262-3338-e4d06a50746d.jpg",
        title: "Still Life with Dead Game, Fruits, and Vegetables in a Market",
        artist: "Frans Snyders",
        date: "1614"
    },
    {
        image: "images/art/0b0b5c15-0633-376b-278e-2660f09b582a.jpg",
        title: "The Wedding at Cana",
        artist: "Giuseppe Maria Crespi",
        date: "c. 1686"
    },
    {
        image: "images/art/b9cb6d89-3721-2198-6df5-fd508d9fd97d.jpg",
        title: "A Romantic Landscape with a Ruined Castle",
        artist: "Robert Adam",
        date: "1778–87"
    },
    {
        image: "images/art/86296102-d04c-8413-34e0-36d96668c0dd.jpg",
        title: "Decorated Initial \"G\" in Pink with Curling Leaves from a Manuscript",
        artist: "Unknown",
        date: "14th century or modern, c. 1920"
    },
    {
        image: "images/art/d538e584-9299-ab59-5480-049ce13eda48.jpg",
        title: "Two Figures along River near Bridges and Houses (recto); Two Figures on Bridge Looking at Man in Punt (verso)",
        artist: "Unknown",
        date: "n.d."
    },
    {
        image: "images/art/3bae5e81-c63d-6118-2322-02fd447fbf5b.jpg",
        title: "In the Woods",
        artist: "Imitator of Narcisse Virgile Diaz de la Peña",
        date: "c. 1860"
    },
    {
        image: "images/art/a2b271f3-350a-1626-2e42-567f6c2605f9.jpg",
        title: "The Shipwreck",
        artist: "Claude Lorrain",
        date: "1638/41"
    },
    {
        image: "images/art/f7471c74-d431-ed5d-9543-1d6e4a44d5dc.jpg",
        title: "Untitled (Ruins of Roman Forum)",
        artist: "Robert MacPherson",
        date: "c. 1867"
    },
    {
        image: "images/art/60a6eba1-7d17-796d-df04-7d1f8b0f1f94.jpg",
        title: "Arcadian Landscape with Figures",
        artist: "Alessandro Magnasco",
        date: "c. 1700"
    },
    {
        image: "images/art/0cadd59f-0b74-c5a9-3b53-10d6144c4841.jpg",
        title: "The Battle of St. James the Greater at Clavijo",
        artist: "School of Martin Schongauer",
        date: "n.d."
    },
    {
        image: "images/art/dc9289d8-ce4f-09ce-c91b-56dc24154ece.jpg",
        title: "The Market at Dolo, from Vedute",
        artist: "Canaletto",
        date: "1735/44"
    },
];
