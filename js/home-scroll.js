// =====================================================
// NDAMBUKI ART LAB — HERO SCROLL CHOREOGRAPHY
// Typography only. No 3D / paint tube behaviour.
// =====================================================
(function () {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector(".hero-header");
  const hero = document.querySelector(".hero-landing");
  const bio = document.querySelector(".artist-bio-scroll");

  const vocal = document.querySelector(".hero-vocal");
  const enough = document.querySelector(".hero-enough");
  const letme = document.querySelector(".hero-letme");
  const paint = document.querySelector(".hero-paint-it");
  const dash = document.querySelector(".hero-dash-track");
  const promise = document.querySelector(".hero-promise");

  if (!hero) return;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (start, end, progress) => start + (end - start) * progress;
  let ticking = false;

  function transform(el, x, y, scale, rotate) {
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`;
  }

  function update() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const heroHeight = Math.max(hero.offsetHeight, 1);
    const progress = clamp(y / (heroHeight * 0.72), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    root.style.setProperty("--hero-scroll-progress", eased.toFixed(4));

    // Keep the animation safely inside the hero's padded content area.
    // On small screens movement is intentionally much tighter.
    const mobile = window.innerWidth <= 700;
    const horizontal = mobile
      ? Math.min(window.innerWidth * 0.018, 7)
      : Math.min(window.innerWidth * 0.025, 34);
    const vertical = mobile
      ? Math.min(window.innerHeight * 0.028, 20)
      : Math.min(window.innerHeight * 0.05, 38);

    // Do not push left-aligned words farther left — that was clipping VOCAL.
    transform(vocal,  lerp(0, horizontal * 0.22, eased), lerp(0, -vertical * 0.28, eased), lerp(1, 0.975, eased), lerp(0, -0.35, eased));
    transform(enough, lerp(0, horizontal * 0.62, eased), lerp(0, -vertical * 0.08, eased), lerp(1, 0.985, eased), lerp(0, 0.3, eased));
    transform(letme,  lerp(0, horizontal * 0.12, eased), lerp(0, vertical * 0.25, eased), lerp(1, 0.99, eased), 0);
    transform(paint,  lerp(0, horizontal * 0.38, eased), lerp(0, vertical * 0.42, eased), lerp(1, 1.01, eased), lerp(0, -0.2, eased));

    if (dash) {
      dash.style.transform = `translate3d(${lerp(0, horizontal * 0.16, eased)}px, ${lerp(0, vertical * 0.30, eased)}px, 0)`;
      dash.style.opacity = String(lerp(1, 0.72, eased));
    }

    if (promise) {
      promise.style.transform = `translate3d(${lerp(0, horizontal * 0.25, eased)}px, ${lerp(0, vertical * 0.46, eased)}px, 0)`;
      promise.style.letterSpacing = `${lerp(0, mobile ? 0.012 : 0.03, eased)}em`;
    }

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
