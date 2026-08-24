// Content shown on /frame — the page rendered on the ReTerminal E1004 eink display.
//
// Edit the values below and commit/push to change what the frame shows.
// The device just re-fetches this page on its own schedule, so there's
// nothing else to redeploy.
//
//   title      — big headline at the top (keep it short, ~1 line)
//   subtitle   — small line under the title. Leave as null to auto-show
//                today's date instead of typing one in by hand.
//   image      — path (or full URL) to the image to display, relative to
//                this folder unless it starts with http
//   imageAlt   — alt text for the image (not shown on screen, just a11y)
//   body       — caption / message shown under the image

window.FRAME_DATA = {
    title: "Good Morning, Bill",
    subtitle: null,
    image: "placeholder.svg",
    imageAlt: "Placeholder image — swap this out in frame/data.js",
    body: "This is placeholder caption text. Edit frame/data.js to change the title, image, and this message."
};
