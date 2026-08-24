// Content shown on /frame — the page rendered on the ReTerminal E1004 eink display.
//
// Edit the values below and commit/push to change what the frame shows.
// The device just re-fetches this page on its own schedule, so there's
// nothing else to redeploy.
//
//   title      — big headline at the top (keep it short, ~1 line). Leave as
//                null to auto-show a time-of-day greeting ("Good Morning,
//                Bill" / "Good Afternoon, Bill" / "Good Evening, Bill",
//                based on the hour where timeZone below points) instead of
//                typing one in by hand.
//   name       — name used in the auto greeting above. Leave as null to
//                default to "Bill". Ignored if title is set.
//   subtitle   — small line under the title. Leave as null to auto-show
//                today's date instead of typing one in by hand.
//   timeZone   — IANA timezone (e.g. "America/Los_Angeles") used for the
//                auto date above. Pinned explicitly rather than left to
//                the rendering device's own clock, since that's not
//                guaranteed to match yours. Leave as null to keep the
//                default (America/Los_Angeles).
//   image      — path (or full URL) to the image to display, relative to
//                this folder unless it starts with http
//   imageAlt   — alt text for the image (not shown on screen, just a11y)
//   dither     — set to false to show the image as-is (plain browser
//                downscaling) instead of quantizing/dithering it to the
//                display's 6-color Spectra palette (see dither.js). Leave
//                true/unset to keep dithering on — it's what makes photos
//                and shaded art look right on a 6-color panel instead of
//                banding, and is a no-op if something downstream
//                re-quantizes the page anyway.
//   body       — caption / message shown under the image. Leave as null to
//                auto-show a live weather description for Berkeley, CA
//                (fetched from open-meteo.com, no API key needed) instead
//                of typing one in by hand. Set it to a string to pin a
//                fixed caption instead — see render.js for the weather
//                fetch/location if you want to point it elsewhere.

window.FRAME_DATA = {
    title: null,
    name: null,
    subtitle: null,
    timeZone: null,
    image: "https://static.wikia.nocookie.net/marveldatabase/images/e/e0/Peter_Parker_%28Earth-616%29_from_Amazing_Fantasy_Vol_1_15_003.jpg/revision/latest/scale-to-height-down/1200?cb=20260612035534",
    imageAlt: "Peter Parker becomes Spider-Man, Amazing Fantasy Vol 1 15",
    body: null
};
