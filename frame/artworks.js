// Curated list of public-domain artworks from the Art Institute of Chicago's
// open API (api.artic.edu), pre-filtered to landscape-ish aspect ratios (close
// to the frame's own 1600x1200) so nothing gets heavily pillarboxed. render.js
// picks one at random on every page load when data.js's "image" is left null.
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
        imageAlt: "The Bedroom, Vincent van Gogh (Dutch, 1853–1890), 1889"
    },
    {
        image: "https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/!1600,1200/0/default.jpg",
        imageAlt: "A Sunday on La Grande Jatte — 1884, Georges Seurat (French, 1859–1891), 1884–86, border added 1888–89"
    },
    {
        image: "https://www.artic.edu/iiif/2/8cd4328f-da34-dec3-00f5-5810a747c8e8/full/!1600,1200/0/default.jpg",
        imageAlt: "A Witches' Sabbath, Cornelis Saftleven (Dutch, 1607–1681), c. 1650"
    },
    {
        image: "https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/!1600,1200/0/default.jpg",
        imageAlt: "Water Lilies, Claude Monet (French, 1840–1926), 1906"
    },
    {
        image: "https://www.artic.edu/iiif/2/defb4004-b500-218d-3d9b-9a02423f097d/full/!1600,1200/0/default.jpg",
        imageAlt: "At the Moulin Rouge, Henri de Toulouse-Lautrec (French, 1864–1901), 1892–95"
    },
    {
        image: "https://www.artic.edu/iiif/2/52ac8996-3460-cf71-cb42-5c4d0aa29b74/full/!1600,1200/0/default.jpg",
        imageAlt: "The Basket of Apples, Paul Cezanne (French, 1839–1906), c. 1893"
    },
    {
        image: "https://www.artic.edu/iiif/2/80df29cd-493f-23c0-3e51-4ddc38b3f34f/full/!1600,1200/0/default.jpg",
        imageAlt: "Barks Fleeing Before the Storm, Jules Dupré (French, 1811–1889), 1870–75"
    },
    {
        image: "https://www.artic.edu/iiif/2/18092196-50ae-3ff1-9205-1b3110e966c3/full/!1600,1200/0/default.jpg",
        imageAlt: "Distant View of Niagara Falls, Thomas Cole (American, born England, 1801–1848), 1830"
    },
    {
        image: "https://www.artic.edu/iiif/2/0cbe27e8-2fec-3445-bc48-ce40a8f2dc25/full/!1600,1200/0/default.jpg",
        imageAlt: "Fish (Still Life), Édouard Manet (French, 1832–1883), 1864"
    },
    {
        image: "https://www.artic.edu/iiif/2/8641479e-c93e-f1a8-9925-19be061706da/full/!1600,1200/0/default.jpg",
        imageAlt: "Fishing Boats with Hucksters Bargaining for Fish, Joseph Mallord William Turner (English, 1775–1851), 1837–38"
    },
    {
        image: "https://www.artic.edu/iiif/2/3ef69544-a84c-dfa4-df6a-346b4b59c351/full/!1600,1200/0/default.jpg",
        imageAlt: "October Day, Jean Charles Cazin (French, 1841–1901), 1890–93"
    },
    {
        image: "https://www.artic.edu/iiif/2/aa870b0d-5a1b-660a-6dc6-56c12109cf6e/full/!1600,1200/0/default.jpg",
        imageAlt: "Landscape with Saint John on Patmos, Nicolas Poussin (French, 1594–1665), 1640"
    },
    {
        image: "https://www.artic.edu/iiif/2/1a1b74fe-ff2a-8991-0581-5d420f0b840e/full/!1600,1200/0/default.jpg",
        imageAlt: "Lunch at the Restaurant Fournaise (The Rowers' Lunch), Pierre-Auguste Renoir (French, 1841–1919), 1875"
    },
    {
        image: "https://www.artic.edu/iiif/2/a4bef587-48a4-d186-813d-f297441b1ab3/full/!1600,1200/0/default.jpg",
        imageAlt: "Mahana no atua (Day of the God), Paul Gauguin (French, 1848–1903), 1894"
    },
    {
        image: "https://www.artic.edu/iiif/2/fa96ef54-c3b1-8f4d-390a-219f7bc64c4a/full/!1600,1200/0/default.jpg",
        imageAlt: "Man with Lance Riding through the Snow, Adolphe Schreyer (German, 1828–1899), c. 1880"
    },
    {
        image: "https://www.artic.edu/iiif/2/a45e5f55-d02b-ce98-8bab-3af549684f58/full/!1600,1200/0/default.jpg",
        imageAlt: "Painting with Troika, Vasily Kandinsky, January 18, 1911"
    },
    {
        image: "https://www.artic.edu/iiif/2/3fa3855e-d7e7-d2a4-0f95-a38268026bad/full/!1600,1200/0/default.jpg",
        imageAlt: "Pardon in Brittany, Gaston La Touche (French, 1854–1913), 1896"
    },
    {
        image: "https://www.artic.edu/iiif/2/f8fd76e9-c396-5678-36ed-6a348c904d27/full/!1600,1200/0/default.jpg",
        imageAlt: "Paris Street; Rainy Day, Gustave Caillebotte (French, 1848–1894), 1877"
    },
    {
        image: "https://www.artic.edu/iiif/2/a34d9d72-c4ec-0750-389e-a01215c9aab0/full/!1600,1200/0/default.jpg",
        imageAlt: "Pastoral Landscape with Ruins, Adriaen van de Velde (Dutch, 1636–1672), 1664"
    },
    {
        image: "https://www.artic.edu/iiif/2/d9bde524-38b2-4262-3338-e4d06a50746d/full/!1600,1200/0/default.jpg",
        imageAlt: "Still Life with Dead Game, Fruits, and Vegetables in a Market, Frans Snyders (Flemish, 1579-1657), 1614"
    },
    {
        image: "https://www.artic.edu/iiif/2/f2021182-1302-f76f-97f1-4e7850030e3b/full/!1600,1200/0/default.jpg",
        imageAlt: "Still Life with Game Fowl, Juan Sánchez Cotán (Spanish, 1560–1627), c. 1600–3"
    },
    {
        image: "https://www.artic.edu/iiif/2/8111acce-c8ce-2ef3-5f32-61cd63905c7d/full/!1600,1200/0/default.jpg",
        imageAlt: "The Battle between the Gods and the Giants, Joachim Antonisz. Wtewael (Dutch, c. 1566–1638), c. 1608"
    },
    {
        image: "https://www.artic.edu/iiif/2/7f1ea423-7538-3bc7-3d4a-0766522ab62f/full/!1600,1200/0/default.jpg",
        imageAlt: "The Family Concert, Jan Steen (Dutch, 1626–1679), 1666"
    },
    {
        image: "https://www.artic.edu/iiif/2/6f513908-03cc-b974-633b-adfce56b7936/full/!1600,1200/0/default.jpg",
        imageAlt: "The Millinery Shop, Edgar Degas (French, 1834–1917), 1879-86"
    },
    {
        image: "https://www.artic.edu/iiif/2/237c25a2-6051-a8e7-1610-a01938d4deab/full/!1600,1200/0/default.jpg",
        imageAlt: "The Watermill with the Great Red Roof, Meindert Hobbema (Dutch, 1638–1709), c. 1665"
    },
    {
        image: "https://www.artic.edu/iiif/2/4a04138f-43d8-cd9f-5ac4-478cd8828210/full/!1600,1200/0/default.jpg",
        imageAlt: "Trompe-l'Oeil Still Life with a Flower Garland and a Curtain, Adriaen van der Spelt (Dutch, 1630–1673), 1658"
    },
    {
        image: "https://www.artic.edu/iiif/2/78c80988-6524-cec7-c661-a4c0a706d06f/full/!1600,1200/0/default.jpg",
        imageAlt: "Woman at Her Toilette, Berthe Morisot (French, 1841–1895), 1875–80"
    },
    {
        image: "https://www.artic.edu/iiif/2/0f1cc0e0-e42e-be16-3f71-2022da38cb93/full/!1600,1200/0/default.jpg",
        imageAlt: "Arrival of the Normandy Train, Gare Saint-Lazare, Claude Monet (French, 1840–1926), 1877"
    },
    {
        image: "https://www.artic.edu/iiif/2/db94c894-a24c-c2e0-9db9-0506567a0152/full/!1600,1200/0/default.jpg",
        imageAlt: "Poppy Field (Giverny), Claude Monet (French, 1840–1926), 1890–91"
    },
    {
        image: "https://www.artic.edu/iiif/2/03930df3-1e6c-eeca-8660-c0b22ca477ff/full/!1600,1200/0/default.jpg",
        imageAlt: "Houses of Parliament, London, Claude Monet (French, 1840–1926), 1900–1"
    },
];
