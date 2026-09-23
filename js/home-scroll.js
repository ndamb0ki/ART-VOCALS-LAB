// =====================================================
// NDAMBUKI ART LAB — SCROLL CHOREOGRAPHY
// =====================================================
(function () {
  "use strict";
  const header = document.querySelector(".hero-header");
  const hero = document.querySelector(".hero-landing");
  const bio = document.querySelector(".artist-bio-scroll");
  const back = document.querySelector(".hero-type-back");
  const front = document.querySelector(".hero-type-front");
  if (!hero) return;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  let ticking = false;
  function update() {
    const heroHeight = Math.max(hero.offsetHeight, 1);
    const y = window.scrollY || document.documentElement.scrollTop;
    const progress = clamp(y / (heroHeight * 0.92), 0, 1);
    document.documentElement.style.setProperty("--hero-scroll-progress", progress.toFixed(4));
    const spread = progress * Math.min(80, window.innerHeight * 0.09);
    back?.style.setProperty("--hero-spread", `${spread}px`);
    front?.style.setProperty("--hero-spread", `${spread}px`);
    header?.classList.toggle("is-scrolled", progress > 0.035);
    if (bio) {
      const r = bio.getBoundingClientRect();
      bio.classList.toggle("in-view", r.top < window.innerHeight * 0.78);
    }
    ticking = false;
  }
  function requestUpdate() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
})();
