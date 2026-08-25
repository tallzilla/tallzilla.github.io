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
// and check contrast before committing to the full download: draw it to a
// canvas, compute the luminance (0.299r+0.587g+0.114b) per pixel, and only
// keep it if the standard deviation across all pixels is at least ~42.
// Then download the full size --
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
        image: "images/art/a748474d-ba2f-d3e5-da04-05e525a3f37a.jpg",
        title: "Ship Building, Gloucester Harbor",
        artist: "Winslow Homer",
        date: "published October 11, 1873"
    },
    {
        image: "images/art/72a76270-d6f4-e744-d47b-307873a8e8ff.jpg",
        title: "A City Park",
        artist: "William Merritt Chase",
        date: "c. 1887"
    },
    {
        image: "images/art/5fa07bf4-a95a-15b2-26df-9e888d4ac8d5.jpg",
        title: "Cottage at the Top of a Hill",
        artist: "Jacob van Ruisdael",
        date: "c. 1660"
    },
    {
        image: "images/art/15800d70-d1c8-a732-007f-a22a55cb407e.jpg",
        title: "Harbor Scene with a Lighthouse",
        artist: "Claude Lorrain",
        date: "1638–41"
    },
    {
        image: "images/art/38726da7-8122-dc49-9243-766a1eeba9ed.jpg",
        title: "A Mild Breeze on a Fine Day (Gaifu kaisei), from the series \"Thirty-six Views of Mount Fuji (Fugaku sanjurokkei)\"",
        artist: "Katsushika Hokusai 葛飾 北斎",
        date: "c. 1830/33"
    },
    {
        image: "images/art/a8e72155-62cd-c0e0-d7f3-57b2532654d4.jpg",
        title: "Malta, Harbor of Valletta",
        artist: "Abraham Storck",
        date: "1695"
    },
    {
        image: "images/art/862608e5-8953-b1a3-53fd-ec009662516f.jpg",
        title: "Still Life",
        artist: "Hugo Charlemont",
        date: "1883"
    },
    {
        image: "images/art/10c31086-2515-1348-2c37-ed41aaa7dc88.jpg",
        title: "Landscape",
        artist: "Théodore Rousseau",
        date: "c. 1835"
    },
    {
        image: "images/art/1d3a275d-45dd-6026-b6ed-d7d8df417a3d.jpg",
        title: "A Peasant Woman Digging in Front of Her Cottage",
        artist: "Vincent van Gogh",
        date: "c. 1885"
    },
    {
        image: "images/art/e1bc0d4a-8953-3446-351c-accf5c671434.jpg",
        title: "Broad Street, Stirling",
        artist: "David Young Cameron",
        date: "1899"
    },
    {
        image: "images/art/e1826a0c-e20a-0e5e-a9e3-abf4fe123884.jpg",
        title: "Head of a Roebuck and Two Ptarmigan",
        artist: "Edwin Henry Landseer",
        date: "c. 1830"
    },
    {
        image: "images/art/f3f1109a-5ca6-7bba-0a79-ebfdba2e4b6b.jpg",
        title: "Landscape with Three Gabled Cottages Beside a Road",
        artist: "Rembrandt van Rijn",
        date: "1650"
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
        image: "images/art/ad3280c6-611a-c136-29b8-8f303a02f416.jpg",
        title: "Landscape with Figures",
        artist: "Narcisse Virgile Diaz de la Peña",
        date: "c. 1870"
    },
    {
        image: "images/art/f33cab45-4591-d51f-76f3-9aa8076e033e.jpg",
        title: "Ruins of the Palace of the Caesars in Rome, plate eight from Die Römische Ansichten",
        artist: "Joseph Anton Koch",
        date: "1810"
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
        image: "images/art/eb55340f-ed2a-c068-e1fb-b51b60d9bbda.jpg",
        title: "Hillside with Trees",
        artist: "William Morris Hunt",
        date: "1872–78"
    },
    {
        image: "images/art/7a63b68a-a84f-87b0-80a4-2848404f1ad6.jpg",
        title: "Moonlight Scene",
        artist: "Unknown artist",
        date: "19th century"
    },
    {
        image: "images/art/a2c51713-67cc-adff-555c-928a8261d5ca.jpg",
        title: "The Little Thatched Cottages",
        artist: "Félix Hilaire Buhot",
        date: "1878"
    },
    {
        image: "images/art/7f4d28d4-dd4c-66a0-c388-f8093c4ca38b.jpg",
        title: "A Winter Morning Shovelling Out",
        artist: "Winslow Homer",
        date: "published January 14, 1871"
    },
    {
        image: "images/art/43f47517-f126-94f2-1608-df20f2a149f3.jpg",
        title: "Scene near Bathford",
        artist: "E. Parker",
        date: "n.d."
    },
];
