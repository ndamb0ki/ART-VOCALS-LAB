// UI interactions: custom cursor, smooth scroll, reveal on scroll, animated heading

(function(){
  // Custom cursor
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Hover interactive elements
  const hoverTargets = document.querySelectorAll('a, button, .card');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
  });

  // Smooth scroll for internal links
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  });

  // Reveal on scroll (IntersectionObserver)
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, {threshold: 0.12});

  document.querySelectorAll('.card, .section-title, .hero-lead, .hero-heading').forEach(el => io.observe(el));

  // Heading reveal animation
  const headings = document.querySelectorAll('.hero-heading');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  headings.forEach(h => {
    const text = h.textContent.trim();
    if(reduceMotion){
      h.textContent = text;
      return;
    }

    h.innerHTML = '';
    const words = text.split(' ');
    words.forEach((w, wi) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.display = 'inline-block';
      span.style.animationDelay = `${wi * 0.12}s`;
      span.textContent = w + (wi < words.length - 1 ? ' ' : '');
      h.appendChild(span);
    });
  });

  // Make visual layers respond to mouse for subtle parallax
  const hero = document.querySelector('.hero-landing');
  if(hero){
    hero.addEventListener('mousemove', (e) => {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      const x = (e.clientX - hero.getBoundingClientRect().left) / w - 0.5;
      const y = (e.clientY - hero.getBoundingClientRect().top) / h - 0.5;
      document.querySelectorAll('.visual-layer').forEach((layer, i) => {
        const depth = (i+1) * 6;
        layer.style.transform = `translate(${x * depth}px, ${y * depth}px) scale(${1 + i*0.03})`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      document.querySelectorAll('.visual-layer').forEach((layer, i) => {
        layer.style.transform = '';
      });
    });
  }

  // Small accessibility: hide custom cursor for keyboard users
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Tab') cursor.style.display = 'none';
  });
})();

(function(){
  const container = document.getElementById('cta-3d-viewer');
  if(!container || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const resize = () => {
    const size = Math.max(72, container.clientWidth || 72);
    renderer.setSize(size, size);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  resize();
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.95);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(4, 5, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffb347, 0.7);
  rimLight.position.set(-5, -2, 4);
  scene.add(rimLight);

  const fallbackObject = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.05, 0.35, 140, 18),
    new THREE.MeshStandardMaterial({ color: 0xffd24d, emissive: 0x221100, roughness: 0.35, metalness: 0.55 })
  );
  fallbackObject.scale.setScalar(1.05);
  scene.add(fallbackObject);

  let currentObject = fallbackObject;

  const animate = () => {
    requestAnimationFrame(animate);
    if(currentObject){
      currentObject.rotation.y += 0.02;
      currentObject.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
    }
    renderer.render(scene, camera);
  };
  animate();

  window.addEventListener('resize', resize);

  if(typeof THREE.OBJLoader !== 'undefined'){
    const loader = new THREE.OBJLoader();
    loader.load(
      'images/Girl2.obj',
      (object) => {
        object.traverse((child) => {
          if(child.isMesh){
            child.material = new THREE.MeshStandardMaterial({ color: 0xf6e2df, roughness: 0.78, metalness: 0.14 });
          }
        });

        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        object.scale.setScalar(7.6 / Math.max(size, 1));
        scene.remove(fallbackObject);
        scene.add(object);
        currentObject = object;
      },
      undefined,
      () => {
        scene.remove(fallbackObject);
        scene.add(fallbackObject);
        currentObject = fallbackObject;
      }
    );
  }
})();

// Video visibility & reduced-motion handling
(function(){
  const video = document.getElementById('heroVideo');
  if(!video) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pauseIfHidden(){
    if(document.hidden || reduceMotion){
      video.pause();
    } else {
      // attempt to play; browsers require user gesture for unmuted video—video is muted so this should work
      const p = video.play();
      if(p && p.catch) p.catch(()=>{});
    }
  }

  document.addEventListener('visibilitychange', pauseIfHidden);
  // initial
  pauseIfHidden();
})();

// Support button mail composer
(function(){
  const supportButtons = Array.from(document.querySelectorAll('.nav-cta')).filter((button) => button.textContent.trim().toLowerCase() === 'support');
  if(!supportButtons.length) return;

  const modal = document.createElement('div');
  modal.className = 'support-modal';
  modal.innerHTML = `
    <div class="support-backdrop" data-close-support></div>
    <div class="support-dialog" role="dialog" aria-modal="true" aria-labelledby="supportDialogTitle">
      <button class="support-close" type="button" aria-label="Close support form" data-close-support>×</button>
      <h3 id="supportDialogTitle">Support the Art Classes Program</h3>
      <p>Enter your email address and we will open your mail app with a support message about the art classes program.</p>
      <form class="support-form">
        <label for="supportEmail">Email address</label>
        <input id="supportEmail" name="supportEmail" type="email" placeholder="you@example.com" required>
        <button class="btn btn-primary" type="submit">Send Support Message</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const backdrop = modal.querySelector('.support-backdrop');
  const dialog = modal.querySelector('.support-dialog');
  const form = modal.querySelector('.support-form');
  const emailInput = modal.querySelector('#supportEmail');

  function closeModal(){
    modal.classList.remove('open');
    document.body.classList.remove('support-modal-open');
  }

  function openModal(){
    modal.classList.add('open');
    document.body.classList.add('support-modal-open');
    emailInput.focus();
  }

  backdrop.addEventListener('click', closeModal);
  modal.querySelectorAll('[data-close-support]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.focus();
      return;
    }

    const subject = 'Support Request for the Art Classes Program';
    const body = [
      'Hello Ndambuki Art Lab,',
      '',
      'I would like to support the Art Classes Program and learn more about how I can contribute.',
      '',
      `My email address: ${email}`,
      '',
      'Thank you for the work you do for the community.',
      '',
      'Kind regards'
    ].join('\n');

    const mailtoLink = `mailto:sndambuki155@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape') closeModal();
  });

  supportButtons.forEach((button) => {
    button.addEventListener('click', openModal);
  });
})();

// Mobile nav toggle behavior
(function(){
  const toggles = document.querySelectorAll('.nav-toggle');
  if(!toggles.length) return;

  toggles.forEach(t => {
    t.addEventListener('click', () => {
      const header = t.closest('.site-header');
      const expanded = t.getAttribute('aria-expanded') === 'true';
      t.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('menu-open', !expanded);
    });
  });

  // close when clicking a nav link
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      const header = a.closest('.site-header');
      if(header){ header.classList.remove('menu-open');
        const t = header.querySelector('.nav-toggle'); if(t) t.setAttribute('aria-expanded','false'); }
    });
  });
})();

// Hide header on scroll down, show on scroll up
(function(){
  const header = document.querySelector('.site-header');
  if(!header) return;
  let lastY = window.scrollY;
  let ticking = false;
  const HIDE_DELTA = 24; // pixels scrolled down before hiding
  const REVEAL_DELAY_MS = 120; // delay before showing on scroll-up
  let revealTimer = null;

  function setHeaderVisible(visible){
    if(visible){ header.classList.remove('hidden'); header.classList.add('header-visible'); }
    else { header.classList.add('hidden'); header.classList.remove('header-visible'); }
  }

  function onScroll(){
    const y = window.scrollY;
    if(y < 80){ setHeaderVisible(true); lastY = y; ticking = false; return; }

    if(y > lastY && (y - lastY) > HIDE_DELTA){ // scrolling down enough
      // hide immediately
      if(revealTimer) { clearTimeout(revealTimer); revealTimer = null; }
      setHeaderVisible(false);
    } else if(y < lastY){
      // scrolling up - reveal after a short delay for smoothness
      if(revealTimer) clearTimeout(revealTimer);
      revealTimer = setTimeout(() => { setHeaderVisible(true); revealTimer = null; }, REVEAL_DELAY_MS);
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if(!ticking){ window.requestAnimationFrame(onScroll); ticking = true; }
  }, {passive:true});

  // When menu opened keep header visible
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.nav-toggle');
    if(t){ const expanded = t.getAttribute('aria-expanded') === 'true'; if(expanded) setHeaderVisible(true); }
  });
})();
