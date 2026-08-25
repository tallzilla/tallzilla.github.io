// Content shown on /frame — the page rendered on the ReTerminal E1004 eink display.
//
// Edit the values below and commit/push to change what the frame shows.
// The device just re-fetches this page on its own schedule, so there's
// nothing else to redeploy.
//
//   title      — big headline at the top (keep it short, ~1 line). Leave as
//                null to auto-show today's date instead of typing one in
//                by hand — that's the frame's main piece of information at
//                a glance.
//   subtitle   — a single line under the title, used only as a fallback
//                when there's no artwork to show (i.e. image is set to a
//                specific path/URL rather than left null). When image is
//                left null, the two lines under the title are always the
//                picked artwork's artist, then its title and year — this
//                field is ignored in that case.
//   timeZone   — IANA timezone (e.g. "America/Los_Angeles") used for the
//                auto date above. Pinned explicitly rather than left to
//                the rendering device's own clock, since that's not
//                guaranteed to match yours. Leave as null to keep the
//                default (America/Los_Angeles).
//   image      — path (or full URL) to the image to display, relative to
//                this folder unless it starts with http. Leave as null to
//                show a random painting from frame/artworks.js instead (a
//                curated list of public-domain works from the Art
//                Institute of Chicago's API) — a different one each time
//                the page loads.
//   imageAlt   — alt text for the image (not shown on screen, just a11y).
//                Ignored when image is null; artworks.js supplies its own.
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
    subtitle: null,
    timeZone: null,
    image: null,
    imageAlt: null,
    body: null
};
