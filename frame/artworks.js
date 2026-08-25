// Curated list of public-domain artworks, sourced from the Art Institute of
// Chicago's open API (api.artic.edu), filtered on two criteria: aspect
// ratio close to the frame's own 1600x1200 (roughly 10% cover-crop or
// less), and physical size within about 2x the frame's actual ~10.6x8in
// (27x20cm) footprint, so a piece isn't downscaled from something much
// larger than the display -- these are mostly smaller-format paintings,
// oil sketches, and prints rather than room-scale gallery canvases.
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
// width/height ratio within about 1.2-1.48 -- then download it --
// https://www.artic.edu/iiif/2/{image_id}/full/!1600,1200/0/default.jpg --
// into frame/images/art/{image_id}.jpg and add an entry below.

window.FRAME_ARTWORKS = [
    {
        image: "images/art/36ac482d-4de7-d595-72fd-abee3f56f22f.jpg",
        title: "A Study for the Card Players",
        artist: "Paul Cézanne",
        date: "1890–92"
    },
    {
        image: "images/art/58f58363-f567-0e49-7956-d49400721b1c.jpg",
        title: "St. Albert of Louvain",
        artist: "Peter Paul Rubens",
        date: "1620"
    },
    {
        image: "images/art/2b5a8e62-4ad6-8175-89df-da09dd3db992.jpg",
        title: "Landscape with Smokestacks",
        artist: "Edgar Degas",
        date: "c. 1890"
    },
    {
        image: "images/art/1d3a275d-45dd-6026-b6ed-d7d8df417a3d.jpg",
        title: "A Peasant Woman Digging in Front of Her Cottage",
        artist: "Vincent van Gogh",
        date: "c. 1885"
    },
    {
        image: "images/art/5d824d6a-ac34-2946-4884-a3131f748ac1.jpg",
        title: "A Bridge Near a Church in Venice",
        artist: "Canaletto",
        date: "c. 1720"
    },
    {
        image: "images/art/5d3d7ee4-268d-97dd-b557-35c99edbca31.jpg",
        title: "View of IJsselmonde Seen Across the New Maas",
        artist: "Aelbert Cuyp",
        date: "c. 1640"
    },
    {
        image: "images/art/813a7de0-60fc-8dfc-6bbd-8d93879e8778.jpg",
        title: "Beach at Low Tide (Mouth of the River)",
        artist: "Edgar Degas",
        date: "1869"
    },
    {
        image: "images/art/b0fa4234-a3a4-8db1-60e6-55b6fb046fac.jpg",
        title: "Geese in a Farmyard",
        artist: "Jean François Millet",
        date: "c. 1871"
    },
    {
        image: "images/art/ea1d1e32-31ee-a309-b039-5add2f10fb9f.jpg",
        title: "Study for The Feast of Love",
        artist: "Jean Antoine Watteau",
        date: "c. 1717"
    },
    {
        image: "images/art/f4d85da1-5c80-3c7b-38cc-bf324d6ce670.jpg",
        title: "The Cottage by the Roadside, Stormy Sky",
        artist: "Jules Dupré",
        date: "c. 1860"
    },
    {
        image: "images/art/f3f1109a-5ca6-7bba-0a79-ebfdba2e4b6b.jpg",
        title: "Landscape with Three Gabled Cottages Beside a Road",
        artist: "Rembrandt van Rijn",
        date: "1650"
    },
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
        image: "images/art/d424c734-f5c1-5f89-3bb8-d83e4e0287e3.jpg",
        title: "Flowers: Poppies and Daisies",
        artist: "Odilon Redon",
        date: "c. 1867"
    },
    {
        image: "images/art/65e58fc4-4dd1-7149-b76b-94547745bece.jpg",
        title: "Woman on Rose Divan",
        artist: "Henri Matisse",
        date: "1921"
    },
    {
        image: "images/art/a748474d-ba2f-d3e5-da04-05e525a3f37a.jpg",
        title: "Ship Building, Gloucester Harbor",
        artist: "Winslow Homer",
        date: "published October 11, 1873"
    },
    {
        image: "images/art/e59fd119-a554-81c8-0de2-30e0626f870f.jpg",
        title: "Landscape with Waterfalls and Bridges, Peasants in the Foreground",
        artist: "Nicolaes Berchem, the Elder",
        date: "c. 1670"
    },
    {
        image: "images/art/c14bc8b2-d156-05c5-358d-abb30d056da0.jpg",
        title: "The Approach to a Village",
        artist: "Simon de Vlieger",
        date: "n.d."
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
        image: "images/art/5bd2d27f-ad6f-2446-eefd-05ace768085e.jpg",
        title: "The Astronomers",
        artist: "Follower of Donato Creti",
        date: "1711"
    },
    {
        image: "images/art/bf4dfe53-5545-6f5e-5894-1e97753adb9a.jpg",
        title: "Two Women Resting and Two Satyrs Dancing",
        artist: "Claude Gillot",
        date: "c. 1700–15"
    },
    {
        image: "images/art/a8e72155-62cd-c0e0-d7f3-57b2532654d4.jpg",
        title: "Malta, Harbor of Valletta",
        artist: "Abraham Storck",
        date: "1695"
    },
    {
        image: "images/art/7abbfd97-fb03-2366-cfe5-b53738a3d93e.jpg",
        title: "Roses in a Bowl",
        artist: "Henri Fantin-Latour",
        date: "1881"
    },
    {
        image: "images/art/862608e5-8953-b1a3-53fd-ec009662516f.jpg",
        title: "Still Life",
        artist: "Hugo Charlemont",
        date: "1883"
    },
    {
        image: "images/art/14034324-d772-46f3-e736-3adea64e4beb.jpg",
        title: "Study of a Triton",
        artist: "François Boucher",
        date: "1748/53"
    },
    {
        image: "images/art/10c31086-2515-1348-2c37-ed41aaa7dc88.jpg",
        title: "Landscape",
        artist: "Théodore Rousseau",
        date: "c. 1835"
    },
];
