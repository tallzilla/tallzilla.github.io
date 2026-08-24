// Populates the frame markup from window.FRAME_DATA (set in data.js, which
// is loaded as a plain <script src> before this file so the data is already
// available synchronously — no fetch()/async race to worry about before a
// screenshot/capture pipeline grabs the page).
(function () {
    var data = window.FRAME_DATA || {};

    function todayFormatted() {
        var d = new Date();
        return d.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    var titleEl = document.getElementById("frame-title");
    var subtitleEl = document.getElementById("frame-subtitle");
    var imageEl = document.getElementById("frame-image");
    var bodyEl = document.getElementById("frame-body");

    titleEl.textContent = data.title || "";
    subtitleEl.textContent = data.subtitle || todayFormatted();

    if (data.image) {
        imageEl.src = data.image;
        imageEl.alt = data.imageAlt || "";
        imageEl.style.display = "";
    } else {
        imageEl.style.display = "none";
    }

    bodyEl.textContent = data.body || "";
})();
