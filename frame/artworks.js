// Curated list of public-domain artworks, sourced from the Art Institute of
// Chicago's open API (api.artic.edu), pre-filtered to landscape-ish aspect
// ratios close to the frame's own 1600x1200 (within roughly 10% cover-crop)
// so the center-crop used to fill the frame edge-to-edge only trims a small
// margin, not a big chunk of the composition. render.js picks one at random
// on every page load when data.js's "image" is left null, and uses
// title/artist/date to build the header text.
//
// Images are self-hosted at frame/images/art/{image_id}.jpg rather than
// hotlinked from AIC live -- AIC's CORS is permissive (confirmed working for
// dithering) and it worked fine in manual testing, but the actual device
// reported the image just not showing up while everything else on the page
// rendered fine, and AIC is a small museum API, not a CDN, being hit on
// every scheduled capture. Self-hosting removes that dependency entirely,
// same fix as the earlier hdqwalls.com/wikia.nocookie.net sources.
//
// To add more: search https://api.artic.edu/api/v1/artworks/search with
// query[term][is_public_domain]=true, check each candidate's real pixel
// dimensions at https://www.artic.edu/iiif/2/{image_id}/info.json -- keep
// width/height within about 10% of the frame's own 4:3 ratio, i.e. a ratio
// (width/height) roughly between 1.2 and 1.48 -- then download it --
// https://www.artic.edu/iiif/2/{image_id}/full/!1600,1200/0/default.jpg --
// into frame/images/art/{image_id}.jpg and add an entry below.

window.FRAME_ARTWORKS = [
    {
        image: "images/art/6644829f-f292-c5c4-a73c-0356a6fdbf0d.jpg",
        title: "The Bedroom",
        artist: "Vincent van Gogh",
        date: "1889"
    },
    {
        image: "images/art/2d484387-2509-5e8e-2c43-22f9981972eb.jpg",
        title: "A Sunday on La Grande Jatte — 1884",
        artist: "Georges Seurat",
        date: "1884–86, border added 1888–89"
    },
    {
        image: "images/art/8cd4328f-da34-dec3-00f5-5810a747c8e8.jpg",
        title: "A Witches' Sabbath",
        artist: "Cornelis Saftleven",
        date: "c. 1650"
    },
    {
        image: "images/art/52ac8996-3460-cf71-cb42-5c4d0aa29b74.jpg",
        title: "The Basket of Apples",
        artist: "Paul Cezanne",
        date: "c. 1893"
    },
    {
        image: "images/art/18092196-50ae-3ff1-9205-1b3110e966c3.jpg",
        title: "Distant View of Niagara Falls",
        artist: "Thomas Cole",
        date: "1830"
    },
    {
        image: "images/art/0cbe27e8-2fec-3445-bc48-ce40a8f2dc25.jpg",
        title: "Fish (Still Life)",
        artist: "Édouard Manet",
        date: "1864"
    },
    {
        image: "images/art/8641479e-c93e-f1a8-9925-19be061706da.jpg",
        title: "Fishing Boats with Hucksters Bargaining for Fish",
        artist: "Joseph Mallord William Turner",
        date: "1837–38"
    },
    {
        image: "images/art/3ef69544-a84c-dfa4-df6a-346b4b59c351.jpg",
        title: "October Day",
        artist: "Jean Charles Cazin",
        date: "1890–93"
    },
    {
        image: "images/art/aa870b0d-5a1b-660a-6dc6-56c12109cf6e.jpg",
        title: "Landscape with Saint John on Patmos",
        artist: "Nicolas Poussin",
        date: "1640"
    },
    {
        image: "images/art/1a1b74fe-ff2a-8991-0581-5d420f0b840e.jpg",
        title: "Lunch at the Restaurant Fournaise (The Rowers' Lunch)",
        artist: "Pierre-Auguste Renoir",
        date: "1875"
    },
    {
        image: "images/art/a4bef587-48a4-d186-813d-f297441b1ab3.jpg",
        title: "Mahana no atua (Day of the God)",
        artist: "Paul Gauguin",
        date: "1894"
    },
    {
        image: "images/art/fa96ef54-c3b1-8f4d-390a-219f7bc64c4a.jpg",
        title: "Man with Lance Riding through the Snow",
        artist: "Adolphe Schreyer",
        date: "c. 1880"
    },
    {
        image: "images/art/a45e5f55-d02b-ce98-8bab-3af549684f58.jpg",
        title: "Painting with Troika",
        artist: "Vasily Kandinsky",
        date: "January 18, 1911"
    },
    {
        image: "images/art/f8fd76e9-c396-5678-36ed-6a348c904d27.jpg",
        title: "Paris Street; Rainy Day",
        artist: "Gustave Caillebotte",
        date: "1877"
    },
    {
        image: "images/art/f2021182-1302-f76f-97f1-4e7850030e3b.jpg",
        title: "Still Life with Game Fowl",
        artist: "Juan Sánchez Cotán",
        date: "c. 1600–3"
    },
    {
        image: "images/art/8111acce-c8ce-2ef3-5f32-61cd63905c7d.jpg",
        title: "The Battle between the Gods and the Giants",
        artist: "Joachim Antonisz. Wtewael",
        date: "c. 1608"
    },
    {
        image: "images/art/237c25a2-6051-a8e7-1610-a01938d4deab.jpg",
        title: "The Watermill with the Great Red Roof",
        artist: "Meindert Hobbema",
        date: "c. 1665"
    },
    {
        image: "images/art/4a04138f-43d8-cd9f-5ac4-478cd8828210.jpg",
        title: "Trompe-l'Oeil Still Life with a Flower Garland and a Curtain",
        artist: "Adriaen van der Spelt",
        date: "1658"
    },
    {
        image: "images/art/78c80988-6524-cec7-c661-a4c0a706d06f.jpg",
        title: "Woman at Her Toilette",
        artist: "Berthe Morisot",
        date: "1875–80"
    },
    {
        image: "images/art/0f1cc0e0-e42e-be16-3f71-2022da38cb93.jpg",
        title: "Arrival of the Normandy Train, Gare Saint-Lazare",
        artist: "Claude Monet",
        date: "1877"
    },
    {
        image: "images/art/2e166f7c-a959-d686-eeb0-a63a52a4d368.jpg",
        title: "The Bathers",
        artist: "Paul Cezanne",
        date: "1899-1904"
    },
    {
        image: "images/art/0b0b5c15-0633-376b-278e-2660f09b582a.jpg",
        title: "The Wedding at Cana",
        artist: "Giuseppe Maria Crespi",
        date: "c. 1686"
    },
    {
        image: "images/art/12086520-2e48-cc75-df86-916bb801e61f.jpg",
        title: "Landscape with the Ruins of the Castle of Egmond",
        artist: "Jacob van Ruisdael",
        date: "1650–55"
    },
    {
        image: "images/art/0f076222-52b2-9bb4-4409-72fdf485d895.jpg",
        title: "A Turn in the Road",
        artist: "Alfred Sisley",
        date: "1873"
    },
    {
        image: "images/art/e0d8a305-15b0-bdcd-1e83-06d8594a2f7e.jpg",
        title: "On the Road",
        artist: "Jules Dupré",
        date: "1856"
    },
    {
        image: "images/art/479aff61-784e-e833-fd82-50ba8c819514.jpg",
        title: "Chrysanthemums",
        artist: "Pierre-Auguste Renoir",
        date: "1881–82"
    },
    {
        image: "images/art/1299b0e5-6a3d-8039-087b-35bf03caea1a.jpg",
        title: "Lion Hunt",
        artist: "Eugène Delacroix",
        date: "1860–61"
    },
    {
        image: "images/art/0ff20364-c795-c2ca-c1e8-e5a848f09554.jpg",
        title: "The Place du Havre, Paris",
        artist: "Camille Pissarro",
        date: "1893"
    },
    {
        image: "images/art/eaf98472-70cc-0005-c2c9-6109f549f24a.jpg",
        title: "Boats on the Beach at Étretat",
        artist: "Claude Monet",
        date: "1885"
    },
    {
        image: "images/art/8be90e71-83c3-3f98-a972-4acb9ce0e773.jpg",
        title: "Sea View, Calm Weather (Vue de mer, temps calme)",
        artist: "Édouard Manet",
        date: "1864"
    },
];
