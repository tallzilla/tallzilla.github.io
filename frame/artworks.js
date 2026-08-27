// Curated list of public-domain artworks, sourced from the Art Institute of
// Chicago's open API (api.artic.edu), filtered on three criteria: aspect
// ratio close to the frame's own 1600x1200 (roughly 10% cover-crop or
// less), physical size within about 2x the frame's actual ~10.6x8in
// (27x20cm) footprint (so a piece isn't downscaled from something much
// larger than the display), and contrast -- measured on a downscaled
// sample as the standard deviation of per-pixel luminance, required to be
// at least ~42 out of 255. That last one matters specifically for the
// 6-color Spectra palette: a genuinely faint piece (a pale pencil sketch, a
// soft pastel with huge low-contrast sky/sand areas) doesn't just look
// muted after dithering, it disappears almost entirely, since there's
// barely any tonal separation for the palette to work with. Rejecting
// those at selection time is the fix, not trying to contrast-correct them
// at render time -- tried that first (tone mapping + dynamic range
// compression) and even a heavy-handed version only partially recovered a
// piece that was a lost cause to begin with.
//
// Note on the contrast check: a simple percentile range (p95-p5 luminance)
// isn't reliable on its own -- it lets through pieces that are mostly
// near-white with only a thin dark tail (a faint sketch with one small
// dark detail can technically post a wide range while still reading as
// washed-out everywhere else). Standard deviation catches that skew and is
// the metric actually enforced now; the range is still worth glancing at
// but isn't the gate.
//
// A fourth check, added later, catches a different failure mode contrast
// doesn't: dense fine detail (engraving/etching crosshatch, a scan with a
// subtle sepia cast) that survives the contrast check fine but comes out
// as chaotic multi-color speckle after dithering, since the Spectra
// palette has no gray primary and has to fake a midtone by rapidly
// alternating colors. Source-image proxies for this were tried and
// rejected -- luminance midtone fraction, distance-to-nearest-palette-color,
// even distance-margin between nearest and second-nearest palette color --
// none of them correlated with the real outcome (a bold two-tone Hokusai
// print can score "far from palette" on paper yet dither cleanly, while a
// muddy sepia piece scores "fine" on contrast alone yet speckles badly).
// What actually works is running the real candidate through the real
// dither pipeline (dither.js/epdoptimize, same as production) and
// measuring the OUTPUT: tile it into small windows (e.g. 6x6px) and check
// what fraction of windows contain 4 or more distinct output colors --
// a coherent dithered region only ever needs 2 colors to fake one
// in-between tone; genuine chaos cycles through most of the 6-color
// palette in a tiny area. The most-obviously-bad pieces scored ~0.97-1.0 on
// that fraction, which is where the reject line was first drawn -- too
// lenient. A piece that scored 0.91 (comfortably "passing" at that
// threshold) turned out visibly bad too once actually looked at on the
// rendered page, and re-checking the rest of the collection found a whole
// cluster sitting at 0.86-0.95 that was likely just as bad. The one clean
// break in the data across everything tested is between a confirmed-good
// piece at 0.78 and the next-lowest score at 0.86 -- reject at or above
// ~0.82, comfortably inside that gap. Don't trust a "looks separated
// enough" cutoff without actually eyeballing a render at the top of
// whatever you let through; there's no committed script for this check
// yet since it needs a browser (Canvas/epdoptimize aren't available in
// plain Node) -- done via a throwaway HTML harness that imports dither.js
// and runs it against each candidate.
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
// dimensions_detail (physical size in cm comes back directly, no extra
// call needed) -- keep width/height within ~2x of 27x20cm and the
// width/height ratio within about 1.2-1.48. Then download a preview size
// and check contrast before committing further: draw it to a canvas,
// compute the luminance (0.299r+0.587g+0.114b) per pixel, and only keep it
// if the standard deviation across all pixels is at least ~42. Then run it
// through the real dither pipeline (see the fourth-check note above) and
// reject anything scoring at or above ~0.82 on the high-diversity-window
// fraction. Only then download the full size --
// https://www.artic.edu/iiif/2/{image_id}/full/!1600,1200/0/default.jpg --
// into frame/images/art/{image_id}.jpg and add an entry below.

window.FRAME_ARTWORKS = [
    {
        image: "images/art/5873d7d7-732d-6e45-2bc0-8402afd7c0f0.jpg",
        title: "The Rapids, Hudson River, Adirondacks",
        artist: "Winslow Homer",
        date: "1894"
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
        image: "images/art/38726da7-8122-dc49-9243-766a1eeba9ed.jpg",
        title: "A Mild Breeze on a Fine Day (Gaifu kaisei), from the series \"Thirty-six Views of Mount Fuji (Fugaku sanjurokkei)\"",
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
        image: "images/art/30fb830f-664d-08b8-7e87-2d5cfebb61dd.jpg",
        title: "Chair Seat",
        artist: "Abigail Davenport Williams",
        date: "c. 1717"
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
        image: "images/art/c8a269d9-d12b-2b70-4f8a-a5286ce94c59.jpg",
        title: "The Beach at Sainte-Adresse, with the Dumont Baths",
        artist: "Gustave Le Gray",
        date: "1856/57"
    },
    {
        image: "images/art/357de077-487f-6588-624d-1104fedda811.jpg",
        title: "Autumn Moon at Ishiyama (Ishiyama shugetsu), from the series \"Eight Views of Omi (Omi hakkei no uchi)\"",
        artist: "Utagawa Hiroshige 歌川 広重",
        date: "c. 1834"
    },
    {
        image: "images/art/795a45a6-54b2-1aee-54d4-2693a1416e45.jpg",
        title: "Autumn Color, from the series \"Worlds of Things (Momoyogusa)\"",
        artist: "Kamisaka Sekka 神坂 雪佳",
        date: "1909/10"
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
        image: "images/art/1cada44e-2cd7-81e1-b754-bd0c55be291c.jpg",
        title: "The Stone Bridge over the Aji River near Nii Hill, Osaka (Osaka Ajigawa Niiyama ishibashi), from the series \"Famous Places in Osaka: Fine Views of Mount Tenpo (Naniwa meisho Tenpozan shokei ichiran)\"",
        artist: "Yashima Gakutei 八島 岳亭",
        date: "c. 1834"
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
