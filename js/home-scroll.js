// =====================================================
// NDAMBUKI ART LAB — HERO SCROLL CONTROLLER
// Scroll drives wrapper layers only. Individual hero words remain untouched.
// No 3D / paint tube behaviour.
// =====================================================
(function () {
  "use strict";

  const header = document.querySelector(".hero-header");
  const hero = document.querySelector(".hero-landing");
  const bio = document.querySelector(".artist-bio-scroll");
  let ticking = false;

  if (!hero) return;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function update() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const heroHeight = Math.max(hero.offsetHeight, 1);

    // 0 at the top, 1 after roughly half a hero of scrolling.
    // CSS applies this value only to wrapper layers, so the load reveal on
    // VOCAL / ENOUGH / LET ME JUST / PAINT IT never gets overwritten.
    const progress = clamp(y / (heroHeight * 0.58), 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    hero.style.setProperty("--hero-scroll", eased.toFixed(4));

    header?.classList.toggle("is-scrolled", y > 12);

    if (bio) {
      const rect = bio.getBoundingClientRect();
      bio.classList.toggle("in-view", rect.top < window.innerHeight * 0.84);
    }

    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
})();
