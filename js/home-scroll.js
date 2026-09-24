// =====================================================
// NDAMBUKI ART LAB — SCROLL CHOREOGRAPHY
// =====================================================
(function () {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector(".hero-header");
  const hero = document.querySelector(".hero-landing");
  const bio = document.querySelector(".artist-bio-scroll");
  const explore = document.querySelector("#explore");
  const back = document.querySelector(".hero-type-back");
  const front = document.querySelector(".hero-type-front");

  if (!hero) return;

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  let ticking = false;

  function update() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const heroH = Math.max(hero.offsetHeight, 1);
    const bioH = Math.max(bio?.offsetHeight || window.innerHeight, 1);

    // Typography separates during the hero scroll.
    const heroProgress = clamp(y / (heroH * 0.82), 0, 1);

    // One continuous 3D timeline from the hero into Explore the Lab.
    // Use document coordinates so the model does not jump when section heights change.
    const exploreTop = explore
      ? explore.getBoundingClientRect().top + y
      : heroH + bioH;
    const travelEnd = Math.max(heroH, exploreTop + window.innerHeight * 0.18);
    const tubeProgress = clamp(y / Math.max(travelEnd, 1), 0, 1);

    // CSS keeps this for compatibility; Three.js reads the numeric target directly.
    root.style.setProperty("--hero-scroll-progress", heroProgress.toFixed(4));
    root.style.setProperty("--tube-scroll-progress", tubeProgress.toFixed(4));
    window.__ndambukiTubeTarget = tubeProgress;

    const spread = heroProgress * Math.min(112, window.innerHeight * 0.13);
    back?.style.setProperty("--hero-spread", `${spread}px`);
    front?.style.setProperty("--hero-spread", `${spread}px`);

    header?.classList.toggle("is-scrolled", y > 12);

    if (bio) {
      const br = bio.getBoundingClientRect();
      bio.classList.toggle("in-view", br.top < window.innerHeight * 0.84);
    }

    if (explore) {
      const er = explore.getBoundingClientRect();
      // Once the green section reaches the tube, send the 3D canvas behind it.
      document.body.classList.toggle("tube-behind", er.top < window.innerHeight * 0.88);
    }

    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  addEventListener("scroll", requestUpdate, { passive: true });
  addEventListener("resize", requestUpdate);
  update();
})();
