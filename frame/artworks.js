// Curated list of public-domain artworks from the Art Institute of Chicago's
// open API (api.artic.edu), pre-filtered to landscape-ish aspect ratios (close
// to the frame's own 1600x1200) so nothing gets heavily pillarboxed. render.js
// picks one at random on every page load when data.js's "image" is left null,
// and uses title/artist/date to build the header text.
//
// Images are hotlinked directly from AIC's IIIF server (permissive CORS —
// Access-Control-Allow-Origin: * — confirmed working for dithering, unlike the
// earlier hdqwalls.com/wikia.nocookie.net sources that needed self-hosting).
// The "!1600,1200" IIIF size request means "fit within this box, preserving
// aspect ratio" — not a distorting crop/stretch.
//
// To add more: search https://api.artic.edu/api/v1/artworks/search with
// query[term][is_public_domain]=true, then check each candidate's real pixel
// dimensions at https://www.artic.edu/iiif/2/{image_id}/info.json before adding
// it here, keeping width/height reasonably close to 4:3.

window.FRAME_ARTWORKS = [
    {
        image: "https://www.artic.edu/iiif/2/6644829f-f292-c5c4-a73c-0356a6fdbf0d/full/!1600,1200/0/default.jpg",
        title: "The Bedroom",
        artist: "Vincent van Gogh",
        date: "1889"
    },
    {
        image: "https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/!1600,1200/0/default.jpg",
        title: "A Sunday on La Grande Jatte — 1884",
        artist: "Georges Seurat",
        date: "1884–86, border added 1888–89"
    },
    {
        image: "https://www.artic.edu/iiif/2/8cd4328f-da34-dec3-00f5-5810a747c8e8/full/!1600,1200/0/default.jpg",
        title: "A Witches' Sabbath",
        artist: "Cornelis Saftleven",
        date: "c. 1650"
    },
    {
        image: "https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/!1600,1200/0/default.jpg",
        title: "Water Lilies",
        artist: "Claude Monet",
        date: "1906"
    },
    {
        image: "https://www.artic.edu/iiif/2/defb4004-b500-218d-3d9b-9a02423f097d/full/!1600,1200/0/default.jpg",
        title: "At the Moulin Rouge",
        artist: "Henri de Toulouse-Lautrec",
        date: "1892–95"
    },
    {
        image: "https://www.artic.edu/iiif/2/52ac8996-3460-cf71-cb42-5c4d0aa29b74/full/!1600,1200/0/default.jpg",
        title: "The Basket of Apples",
        artist: "Paul Cezanne",
        date: "c. 1893"
    },
    {
        image: "https://www.artic.edu/iiif/2/80df29cd-493f-23c0-3e51-4ddc38b3f34f/full/!1600,1200/0/default.jpg",
        title: "Barks Fleeing Before the Storm",
        artist: "Jules Dupré",
        date: "1870–75"
    },
    {
        image: "https://www.artic.edu/iiif/2/18092196-50ae-3ff1-9205-1b3110e966c3/full/!1600,1200/0/default.jpg",
        title: "Distant View of Niagara Falls",
        artist: "Thomas Cole",
        date: "1830"
    },
    {
        image: "https://www.artic.edu/iiif/2/0cbe27e8-2fec-3445-bc48-ce40a8f2dc25/full/!1600,1200/0/default.jpg",
        title: "Fish (Still Life)",
        artist: "Édouard Manet",
        date: "1864"
    },
    {
        image: "https://www.artic.edu/iiif/2/8641479e-c93e-f1a8-9925-19be061706da/full/!1600,1200/0/default.jpg",
        title: "Fishing Boats with Hucksters Bargaining for Fish",
        artist: "Joseph Mallord William Turner",
        date: "1837–38"
    },
    {
        image: "https://www.artic.edu/iiif/2/3ef69544-a84c-dfa4-df6a-346b4b59c351/full/!1600,1200/0/default.jpg",
        title: "October Day",
        artist: "Jean Charles Cazin",
        date: "1890–93"
    },
    {
        image: "https://www.artic.edu/iiif/2/aa870b0d-5a1b-660a-6dc6-56c12109cf6e/full/!1600,1200/0/default.jpg",
        title: "Landscape with Saint John on Patmos",
        artist: "Nicolas Poussin",
        date: "1640"
    },
    {
        image: "https://www.artic.edu/iiif/2/1a1b74fe-ff2a-8991-0581-5d420f0b840e/full/!1600,1200/0/default.jpg",
        title: "Lunch at the Restaurant Fournaise (The Rowers' Lunch)",
        artist: "Pierre-Auguste Renoir",
        date: "1875"
    },
    {
        image: "https://www.artic.edu/iiif/2/a4bef587-48a4-d186-813d-f297441b1ab3/full/!1600,1200/0/default.jpg",
        title: "Mahana no atua (Day of the God)",
        artist: "Paul Gauguin",
        date: "1894"
    },
    {
        image: "https://www.artic.edu/iiif/2/fa96ef54-c3b1-8f4d-390a-219f7bc64c4a/full/!1600,1200/0/default.jpg",
        title: "Man with Lance Riding through the Snow",
        artist: "Adolphe Schreyer",
        date: "c. 1880"
    },
    {
        image: "https://www.artic.edu/iiif/2/a45e5f55-d02b-ce98-8bab-3af549684f58/full/!1600,1200/0/default.jpg",
        title: "Painting with Troika",
        artist: "Vasily Kandinsky",
        date: "January 18, 1911"
    },
    {
        image: "https://www.artic.edu/iiif/2/3fa3855e-d7e7-d2a4-0f95-a38268026bad/full/!1600,1200/0/default.jpg",
        title: "Pardon in Brittany",
        artist: "Gaston La Touche",
        date: "1896"
    },
    {
        image: "https://www.artic.edu/iiif/2/f8fd76e9-c396-5678-36ed-6a348c904d27/full/!1600,1200/0/default.jpg",
        title: "Paris Street; Rainy Day",
        artist: "Gustave Caillebotte",
        date: "1877"
    },
    {
        image: "https://www.artic.edu/iiif/2/a34d9d72-c4ec-0750-389e-a01215c9aab0/full/!1600,1200/0/default.jpg",
        title: "Pastoral Landscape with Ruins",
        artist: "Adriaen van de Velde",
        date: "1664"
    },
    {
        image: "https://www.artic.edu/iiif/2/d9bde524-38b2-4262-3338-e4d06a50746d/full/!1600,1200/0/default.jpg",
        title: "Still Life with Dead Game, Fruits, and Vegetables in a Market",
        artist: "Frans Snyders",
        date: "1614"
    },
    {
        image: "https://www.artic.edu/iiif/2/f2021182-1302-f76f-97f1-4e7850030e3b/full/!1600,1200/0/default.jpg",
        title: "Still Life with Game Fowl",
        artist: "Juan Sánchez Cotán",
        date: "c. 1600–3"
    },
    {
        image: "https://www.artic.edu/iiif/2/8111acce-c8ce-2ef3-5f32-61cd63905c7d/full/!1600,1200/0/default.jpg",
        title: "The Battle between the Gods and the Giants",
        artist: "Joachim Antonisz. Wtewael",
        date: "c. 1608"
    },
    {
        image: "https://www.artic.edu/iiif/2/7f1ea423-7538-3bc7-3d4a-0766522ab62f/full/!1600,1200/0/default.jpg",
        title: "The Family Concert",
        artist: "Jan Steen",
        date: "1666"
    },
    {
        image: "https://www.artic.edu/iiif/2/6f513908-03cc-b974-633b-adfce56b7936/full/!1600,1200/0/default.jpg",
        title: "The Millinery Shop",
        artist: "Edgar Degas",
        date: "1879-86"
    },
    {
        image: "https://www.artic.edu/iiif/2/237c25a2-6051-a8e7-1610-a01938d4deab/full/!1600,1200/0/default.jpg",
        title: "The Watermill with the Great Red Roof",
        artist: "Meindert Hobbema",
        date: "c. 1665"
    },
    {
        image: "https://www.artic.edu/iiif/2/4a04138f-43d8-cd9f-5ac4-478cd8828210/full/!1600,1200/0/default.jpg",
        title: "Trompe-l'Oeil Still Life with a Flower Garland and a Curtain",
        artist: "Adriaen van der Spelt",
        date: "1658"
    },
    {
        image: "https://www.artic.edu/iiif/2/78c80988-6524-cec7-c661-a4c0a706d06f/full/!1600,1200/0/default.jpg",
        title: "Woman at Her Toilette",
        artist: "Berthe Morisot",
        date: "1875–80"
    },
    {
        image: "https://www.artic.edu/iiif/2/0f1cc0e0-e42e-be16-3f71-2022da38cb93/full/!1600,1200/0/default.jpg",
        title: "Arrival of the Normandy Train, Gare Saint-Lazare",
        artist: "Claude Monet",
        date: "1877"
    },
    {
        image: "https://www.artic.edu/iiif/2/db94c894-a24c-c2e0-9db9-0506567a0152/full/!1600,1200/0/default.jpg",
        title: "Poppy Field (Giverny)",
        artist: "Claude Monet",
        date: "1890–91"
    },
    {
        image: "https://www.artic.edu/iiif/2/03930df3-1e6c-eeca-8660-c0b22ca477ff/full/!1600,1200/0/default.jpg",
        title: "Houses of Parliament, London",
        artist: "Claude Monet",
        date: "1900–1"
    },
];
