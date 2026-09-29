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

    // Starts almost immediately after the entrance reveal and completes
    // before the next section fully takes over. Because everything is
    // calculated from scroll position, scrolling upward reverses it exactly.
    const progress = clamp(y / (heroHeight * 0.72), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    root.style.setProperty("--hero-scroll-progress", eased.toFixed(4));

    const horizontal = Math.min(window.innerWidth * 0.075, 92);
    const vertical = Math.min(window.innerHeight * 0.075, 62);

    transform(vocal,  lerp(0, -horizontal, eased), lerp(0, -vertical * 0.35, eased), lerp(1, 0.96, eased), lerp(0, -1.2, eased));
    transform(enough, lerp(0, horizontal * 0.72, eased), lerp(0, -vertical * 0.10, eased), lerp(1, 0.98, eased), lerp(0, 0.8, eased));
    transform(letme,  lerp(0, -horizontal * 0.38, eased), lerp(0, vertical * 0.30, eased), lerp(1, 0.985, eased), 0);
    transform(paint,  lerp(0, horizontal * 0.46, eased), lerp(0, vertical * 0.58, eased), lerp(1, 1.025, eased), lerp(0, -0.5, eased));

    if (dash) {
      dash.style.transform = `translate3d(${lerp(0, horizontal * 0.18, eased)}px, ${lerp(0, vertical * 0.42, eased)}px, 0)`;
      dash.style.opacity = String(lerp(1, 0.62, eased));
    }

    if (promise) {
      promise.style.transform = `translate3d(${lerp(0, horizontal * 0.34, eased)}px, ${lerp(0, vertical * 0.72, eased)}px, 0)`;
      promise.style.letterSpacing = `${lerp(0, 0.055, eased)}em`;
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
