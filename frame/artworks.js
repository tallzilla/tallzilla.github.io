// Curated list of public-domain artworks, sourced from the Art Institute of
// Chicago's open API (api.artic.edu), filtered on three criteria: flat/2D
// media only (see the fourth-check note below), aspect ratio close to the
// frame's own 1600x1200 (roughly 10% cover-crop or less), and contrast.
// There used to be a fourth criterion -- physical size within ~2x the
// frame's actual ~10.6x8in (27x20cm) footprint, meant to keep out pieces so
// much larger than the display that they'd have been downscaled from
// something far more detailed than what a 1600x1200 render can resolve --
// dropped as redundant with real-device spot-checking (see below).
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
// within about 1.2-1.48; no size floor/ceiling). Note: the AIC search
// endpoint (api.artic.edu) rate-limits much more aggressively than its
// IIIF image endpoint (www.artic.edu/iiif/2/...) -- more than ~5 rapid
// requests in a tight loop silently fails to write output files. Space
// search-endpoint calls out (a second or so apart) or batch them in small
// groups; the image-download endpoint doesn't have this problem. Then
// download a preview size and check contrast: draw it to a canvas,
// compute the luminance (0.299r+0.587g+0.114b) per pixel, and only keep
// it if the standard deviation across all pixels is at least ~42. That's
// as far as any automated check can responsibly take a candidate -- next,
// download the full size --
// https://www.artic.edu/iiif/2/{image_id}/full/!1600,1200/0/default.jpg --
// into frame/images/art/{image_id}.jpg, and get an actual human verdict
// on the real dithered render (frame/calibrate.html or equivalent) before
// adding an entry below.

window.FRAME_ARTWORKS = [
    {
        image: "images/art/a748474d-ba2f-d3e5-da04-05e525a3f37a.jpg",
        title: "Ship Building, Gloucester Harbor",
        artist: "Winslow Homer",
        date: "1873"
    },
    {
        image: "images/art/862608e5-8953-b1a3-53fd-ec009662516f.jpg",
        title: "Still Life",
        artist: "Hugo Charlemont",
        date: "1883"
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
        image: "images/art/c8a269d9-d12b-2b70-4f8a-a5286ce94c59.jpg",
        title: "The Beach at Sainte-Adresse, with the Dumont Baths",
        artist: "Gustave Le Gray",
        date: "1856/57"
    },
    {
        image: "images/art/b0416125-7910-a0a3-75bb-b01f935c2af3.jpg",
        title: "Shirasuka: Shiomi Slope,no. 33 from the series Fifty-Three Stations of the Tokaido (Tōkaidō gojūsan tsugi)",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "1847-52"
    },
    {
        image: "images/art/5f3cc8e1-a024-9d9c-4d75-a18c5fcbbe65.jpg",
        title: "Ejiri in Suruga Province (Sunshu Ejiri), from the series \"Thirty-six Views of Mount Fuji (Fugaku sanjurokkei)\"",
        artist: "Katsushika Hokusai 葛飾 北斎",
        date: "c. 1830/33"
    },
    {
        image: "images/art/10c31086-2515-1348-2c37-ed41aaa7dc88.jpg",
        title: "Landscape",
        artist: "Théodore Rousseau",
        date: "c. 1835"
    },
    {
        image: "images/art/85e92d7a-9d6e-28fe-db5a-f0a7244c3f1f.jpg",
        title: "Self-Portrait Preparing an Etching",
        artist: "Henri Charles Guérard",
        date: "c. 1890"
    },
    {
        image: "images/art/0ac9663b-e17e-471d-e4e3-6c60fc800704.jpg",
        title: "Big River, from the Rancherie, Mendocino, California",
        artist: "Carleton E. Watkins",
        date: "1863"
    },
    {
        image: "images/art/a2e9aad2-dd14-ae12-6c44-6811229b3619.jpg",
        title: "Landscape with Figures Crossing a Bridge",
        artist: "John Rathbone",
        date: "1790–1800"
    },
    {
        image: "images/art/9fcd0220-7fcb-205c-163b-8a629004b33a.jpg",
        title: "Landscape, Switzerland",
        artist: "Adolphe Braun",
        date: "c. 1860"
    },
    {
        image: "images/art/b3af1961-f127-2a88-ef03-c2b03866956d.jpg",
        title: "\"Fire!\", plate 35 from Types Parisiens",
        artist: "Honoré Victorin Daumier",
        date: "1839"
    },
    {
        image: "images/art/eb2c6693-2a9e-7f31-9a13-9fbc4056325c.jpg",
        title: "Ships in the Harbor at Sète",
        artist: "Gustave Le Gray",
        date: "1857"
    },
    {
        image: "images/art/a08c2d95-70b8-51ad-962d-e3393833447c.jpg",
        title: "Village Street",
        artist: "Ernst Ludwig Kirchner",
        date: "1906–09"
    },
    {
        image: "images/art/b3974542-b9b4-7568-fc4b-966738f61d78.jpg",
        title: "Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave, from the series \"Thirty-Six Views of Mount Fuji (Fugaku sanjūrokkei)\"",
        artist: "Katsushika Hokusai 葛飾 北斎",
        date: "1830/33"
    },
    {
        image: "images/art/290adf41-49b4-2d81-2976-a0bc884de14c.jpg",
        title: "Fishing Village, from the series \"A World of Things (Momoyogusa)\"",
        artist: "Kamisaka Sekka 神坂 雪佳",
        date: "1909/10"
    },
    {
        image: "images/art/9a51d50a-ce5f-2cc8-add8-91d24feb90f1.jpg",
        title: "A Mountainous Landscape with a Stream",
        artist: "Totoya Hokkei 魚屋 北渓",
        date: "1827"
    },
    {
        image: "images/art/e88a2253-69a0-425e-32d1-e9640111ef39.jpg",
        title: "Landscape with the Penitent Saint Jerome",
        artist: "Belgian",
        date: "1530–40"
    },
    {
        image: "images/art/41458ec7-da2d-773d-159c-9ae9afb53516.jpg",
        title: "Ravine Near Biskra",
        artist: "Victor Pierre Huguet",
        date: "c. 1895"
    },
    {
        image: "images/art/11f33728-685f-c85c-2326-cd0e42536044.jpg",
        title: "Abraham's Sacrifice of Isaac",
        artist: "David Teniers the Younger",
        date: "1654–56"
    },
    {
        image: "images/art/f4b5847d-d61d-2216-5fe1-d258c64fc3cf.jpg",
        title: "Morning Glories, Pinks, and Maiden Flower, from the series \"Seven Autumn Flowers in Moonlight\"",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "1830/44"
    },
    {
        image: "images/art/0010bff3-4f51-8e35-46ee-0c46184354f6.jpg",
        title: "For to Be a Farmer's Boy",
        artist: "Winslow Homer",
        date: "1887"
    },
    {
        image: "images/art/e29ab761-2da7-f2ae-85a7-0f6be42e95a3.jpg",
        title: "Pine Beach with Shrine Gate, from the series \"A World of Things (Momoyogusa)\"",
        artist: "Kamisaka Sekka 神坂 雪佳",
        date: "1909/10"
    },
    {
        image: "images/art/696e53db-a122-3f1a-6139-ab561cfea452.jpg",
        title: "Mount Fuji Rising beyond Miho Beach",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "c. 1838/42"
    },
    {
        image: "images/art/a80c256d-e1dd-9841-36da-a8c41b16381b.jpg",
        title: "Yoshida: The Toyo River Bridge (Yoshida, Toyokawabashi), from the series \"Fifty-three Stations of the Tokaido (Tokaido gojusan tsugi no uchi),\" also known as the Hoeido Tokaido",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "c. 1833/34"
    },
    {
        image: "images/art/4d5a6178-a330-708a-c7eb-cfa20c3f66af.jpg",
        title: "Cliffs and Sea, Sainte-Adresse",
        artist: "Claude Monet",
        date: "c. 1864"
    },
    {
        image: "images/art/e0d8a305-15b0-bdcd-1e83-06d8594a2f7e.jpg",
        title: "On the Road",
        artist: "Jules Dupré",
        date: "1856"
    },
];
