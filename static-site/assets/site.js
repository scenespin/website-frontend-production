document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector("[data-mobile-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  var videoPreviews = document.querySelectorAll("[data-youtube-id]");
  videoPreviews.forEach(function (preview) {
    preview.addEventListener("click", function () {
      var videoId = preview.getAttribute("data-youtube-id");
      if (!videoId) return;

      var frame = preview.closest(".video-frame");
      if (!frame) return;

      var iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube.com/embed/" +
        videoId +
        "?rel=0&modestbranding=1&playsinline=1&autoplay=1";
      iframe.title = "Wryda workflow demo video";
      iframe.loading = "lazy";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;

      frame.innerHTML = "";
      frame.appendChild(iframe);
    });
  });
});
