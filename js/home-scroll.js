// =====================================================
// NDAMBUKI ART LAB — HERO SCROLL CHOREOGRAPHY
// Typography only. No 3D / paint tube behaviour.
// =====================================================
(function () {
  "use strict";

  // Load final hero layout overrides after the legacy homepage stylesheet.
  // Keeping this separate lets us remove old hero rules safely later.
  if (!document.querySelector('link[data-hero-safe-layout]')) {
    const safeLayout = document.createElement("link");
    safeLayout.rel = "stylesheet";
    safeLayout.href = "css/hero-safe-layout.css";
    safeLayout.dataset.heroSafeLayout = "true";
    document.head.appendChild(safeLayout);
  }

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

    const mobile = window.innerWidth <= 700;
    const horizontal = mobile
      ? Math.min(window.innerWidth * 0.012, 5)
      : Math.min(window.innerWidth * 0.018, 24);
    const vertical = mobile
      ? Math.min(window.innerHeight * 0.018, 13)
      : Math.min(window.innerHeight * 0.032, 24);

    transform(vocal,  lerp(0, horizontal * 0.18, eased), lerp(0, -vertical * 0.20, eased), lerp(1, 0.985, eased), lerp(0, -0.2, eased));
    transform(enough, lerp(0, horizontal * 0.40, eased), lerp(0, -vertical * 0.05, eased), lerp(1, 0.99, eased), lerp(0, 0.15, eased));
    transform(letme,  lerp(0, horizontal * 0.10, eased), lerp(0, vertical * 0.18, eased), lerp(1, 0.995, eased), 0);
    transform(paint,  lerp(0, horizontal * 0.22, eased), lerp(0, vertical * 0.24, eased), lerp(1, 1.005, eased), lerp(0, -0.1, eased));

    if (dash) {
      dash.style.transform = `translate3d(${lerp(0, horizontal * 0.10, eased)}px, ${lerp(0, vertical * 0.18, eased)}px, 0)`;
      dash.style.opacity = String(lerp(1, 0.78, eased));
    }

    if (promise) {
      promise.style.transform = `translate3d(${lerp(0, horizontal * 0.15, eased)}px, ${lerp(0, vertical * 0.25, eased)}px, 0)`;
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
