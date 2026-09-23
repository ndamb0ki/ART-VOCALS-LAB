// Dim and hover effect for all bento cards
const bentoCards = document.querySelectorAll('.bento-card');

bentoCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    bentoCards.forEach(c => {
      c.style.filter = (c === card) ? 'brightness(1)' : 'brightness(0.6)';
    });
  });

  card.addEventListener('mouseleave', () => {
    bentoCards.forEach(c => c.style.filter = 'brightness(1)');
  });
});

// Animate bento cards sequentially on page load
document.addEventListener('DOMContentLoaded', () => {
  const allBentoSections = document.querySelectorAll('.bento');

  allBentoSections.forEach(section => {
    const cards = section.querySelectorAll('.bento-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('show'); // ensure your CSS has .show animation
      }, index * 300); // delay per card
    });
  });
});

/* Hero slider implementation */
function initHeroSlider(){
  const slider = document.getElementById('heroSlider');
  if(!slider) return;

  const slides = Array.from(slider.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('sliderDots');
  const prevBtn = slider.querySelector('.slider-arrow.prev');
  const nextBtn = slider.querySelector('.slider-arrow.next');
  let current = 0;
  let autoplayId = null;
  const AUTOPLAY_DELAY = 5000;
  let paused = false;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // set background images from data attribute
  slides.forEach(s => {
    const bg = s.getAttribute('data-bg');
    if(bg) s.style.backgroundImage = `url('${bg}')`;
  });

  // build dots
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Slide ${i+1}`);
    b.addEventListener('click', () => { goTo(i); resetAutoplay(); });
    dotsWrap.appendChild(b);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('button'));

  function update(){
    slides.forEach((s, i) => s.classList.toggle('show', i === current));
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    // accessibility: mark hidden and focusability
    slides.forEach((s, i) => {
      const inner = s.querySelector('.slide-inner');
      if(i === current){
        s.setAttribute('aria-hidden', 'false');
        if(inner) inner.tabIndex = 0;
      } else {
        s.setAttribute('aria-hidden', 'true');
        if(inner) inner.tabIndex = -1;
      }
    });
  }

  function goTo(i){ current = (i + slides.length) % slides.length; update(); }
  function next(){ goTo(current + 1); }
  function prev(){ goTo(current - 1); }

  nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });
  prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });

  function startAutoplay(){ autoplayId = setInterval(next, AUTOPLAY_DELAY); }
  function stopAutoplay(){ clearInterval(autoplayId); autoplayId = null; }
  function resetAutoplay(){ stopAutoplay(); startAutoplay(); }

  // keyboard navigation
  slider.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowRight') { next(); resetAutoplay(); }
    if(e.key === 'ArrowLeft') { prev(); resetAutoplay(); }
    if(e.key === ' ' || e.key === 'Spacebar') { // space to toggle pause
      e.preventDefault();
      if(paused){ startAutoplay(); paused = false; }
      else { stopAutoplay(); paused = true; }
    }
  });

  // focus/pause behaviour
  slider.addEventListener('focusin', () => { stopAutoplay(); });
  slider.addEventListener('focusout', () => { if(!reduceMotion && !paused) startAutoplay(); });

  // touch / swipe support
  let touchStartX = 0;
  let touchDeltaX = 0;
  slider.addEventListener('touchstart', (e) => {
    if(e.touches && e.touches.length === 1) touchStartX = e.touches[0].clientX;
  }, {passive: true});

  slider.addEventListener('touchmove', (e) => {
    if(!touchStartX || !e.touches || e.touches.length !== 1) return;
    touchDeltaX = e.touches[0].clientX - touchStartX;
  }, {passive: true});

  slider.addEventListener('touchend', () => {
    if(Math.abs(touchDeltaX) > 40){
      if(touchDeltaX < 0) next(); else prev();
      resetAutoplay();
    }
    touchStartX = 0; touchDeltaX = 0;
  });

  // pointer fallback for desktops
  let pointerDownX = null;
  slider.addEventListener('pointerdown', (e) => { pointerDownX = e.clientX; slider.setPointerCapture?.(e.pointerId); });
  slider.addEventListener('pointerup', (e) => {
    if(pointerDownX !== null){
      const d = e.clientX - pointerDownX;
      if(Math.abs(d) > 40){ if(d < 0) next(); else prev(); resetAutoplay(); }
    }
    pointerDownX = null;
  });

  // respect reduced motion: stop autoplay and remove transforms
  if(reduceMotion){ stopAutoplay(); slider.classList.add('reduced-motion'); }

  // parallax interaction
  slider.addEventListener('mousemove', (e) => {
    const rect = slider.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    slides.forEach((s, i) => {
      const inner = s.querySelector('.slide-inner');
      if(!inner) return;
      const depth = i === current ? 12 : 4;
      inner.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  });

  slider.addEventListener('mouseleave', () => {
    slides.forEach(s => {
      const inner = s.querySelector('.slide-inner');
      if(inner) inner.style.transform = '';
    });
  });

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', () => { startAutoplay(); });

  // init
  update();
  if(!reduceMotion) startAutoplay();
}

document.addEventListener('DOMContentLoaded', initHeroSlider);
