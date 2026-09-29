// =====================================================
// NDAMBUKI ART LAB — HERO SCROLL CONTROLLER
// Keep the hero composition stable while scrolling.
// No 3D / paint tube behaviour.
// =====================================================
(function () {
  "use strict";

  // Final hero layout overrides load after the legacy homepage stylesheet.
  if (!document.querySelector('link[data-hero-safe-layout]')) {
    const safeLayout = document.createElement("link");
    safeLayout.rel = "stylesheet";
    safeLayout.href = "css/hero-safe-layout.css";
    safeLayout.dataset.heroSafeLayout = "true";
    document.head.appendChild(safeLayout);
  }

  const header = document.querySelector(".hero-header");
  const bio = document.querySelector(".artist-bio-scroll");

  // IMPORTANT:
  // Do not write inline transforms to the hero words on scroll.
  // Their CSS reveal animation already uses transform/clip-path. Writing a
  // second transform from JavaScript caused the text to jump and clip as soon
  // as the first scroll event fired.
  function update() {
    const y = window.scrollY || document.documentElement.scrollTop;

    header?.classList.toggle("is-scrolled", y > 12);

    if (bio) {
      const rect = bio.getBoundingClientRect();
      bio.classList.toggle("in-view", rect.top < window.innerHeight * 0.84);
    }
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
