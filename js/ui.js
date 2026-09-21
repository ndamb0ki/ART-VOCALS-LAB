// =====================================================
// NDAMBUKI ART LAB — UI INTERACTIONS
// Custom cursor removed
// =====================================================


// =====================================================
// SMOOTH SCROLL
// =====================================================

(function () {

  document.addEventListener('click', (e) => {

    const a = e.target.closest('a[href^="#"]');

    if (!a) return;

    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);

    if (target) {

      e.preventDefault();

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }

  });

})();


// =====================================================
// REVEAL ON SCROLL
// =====================================================

(function () {

  const io = new IntersectionObserver(
    entries => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {

          entry.target.classList.add('in-view');

        }

      });

    },
    {
      threshold: 0.12
    }
  );


  document
    .querySelectorAll(
      '.card, .section-title, .hero-lead, .hero-heading'
    )
    .forEach(el => {

      io.observe(el);

    });

})();


// =====================================================
// HERO HEADING ANIMATION
// =====================================================

(function () {

  const headings =
    document.querySelectorAll('.hero-heading');

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  headings.forEach(h => {

    const text = h.textContent.trim();


    if (reduceMotion) {

      h.textContent = text;

      return;

    }


    h.innerHTML = '';


    const words = text.split(' ');


    words.forEach((word, index) => {

      const span =
        document.createElement('span');

      span.className = 'word';

      span.style.display = 'inline-block';

      span.style.animationDelay =
        `${index * 0.12}s`;

      span.textContent =
        word +
        (index < words.length - 1 ? ' ' : '');

      h.appendChild(span);

    });

  });

})();


// =====================================================
// HERO PARALLAX
// =====================================================

(function () {

  const hero =
    document.querySelector('.hero-landing');

  if (!hero) return;


  hero.addEventListener('mousemove', (e) => {

    const width = hero.clientWidth;
    const height = hero.clientHeight;

    const rect =
      hero.getBoundingClientRect();


    const x =
      (e.clientX - rect.left) /
      width -
      0.5;


    const y =
      (e.clientY - rect.top) /
      height -
      0.5;


    document
      .querySelectorAll('.visual-layer')
      .forEach((layer, index) => {

        const depth =
          (index + 1) * 6;

        layer.style.transform =
          `translate(${x * depth}px, ${y * depth}px) scale(${1 + index * 0.03})`;

      });

  });


  hero.addEventListener('mouseleave', () => {

    document
      .querySelectorAll('.visual-layer')
      .forEach(layer => {

        layer.style.transform = '';

      });

  });

})();


// =====================================================
// 3D CTA VIEWER
// =====================================================

(function () {

  const container =
    document.getElementById('cta-3d-viewer');

  if (
    !container ||
    typeof THREE === 'undefined'
  ) {
    return;
  }


  const scene =
    new THREE.Scene();

  scene.background = null;


  const camera =
    new THREE.PerspectiveCamera(
      30,
      1,
      0.1,
      1000
    );

  camera.position.set(
    0,
    0,
    10
  );


  const renderer =
    new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      2
    )
  );


  renderer.setClearColor(
    0x000000,
    0
  );


  const resize = () => {

    const size =
      Math.max(
        72,
        container.clientWidth || 72
      );

    renderer.setSize(
      size,
      size
    );

    camera.aspect = 1;

    camera.updateProjectionMatrix();

  };


  resize();

  container.appendChild(
    renderer.domElement
  );


  // Ambient light

  const ambient =
    new THREE.AmbientLight(
      0xffffff,
      0.95
    );

  scene.add(ambient);


  // Key light

  const keyLight =
    new THREE.DirectionalLight(
      0xffffff,
      1.2
    );

  keyLight.position.set(
    4,
    5,
    8
  );

  scene.add(keyLight);


  // Rim light

  const rimLight =
    new THREE.DirectionalLight(
      0xffb347,
      0.7
    );

  rimLight.position.set(
    -5,
    -2,
    4
  );

  scene.add(rimLight);


  // Fallback object

  const fallbackObject =
    new THREE.Mesh(
      new THREE.TorusKnotGeometry(
        1.05,
        0.35,
        140,
        18
      ),
      new THREE.MeshStandardMaterial({
        color: 0xffd24d,
        emissive: 0x221100,
        roughness: 0.35,
        metalness: 0.55
      })
    );


  fallbackObject.scale.setScalar(
    1.05
  );


  scene.add(
    fallbackObject
  );


  let currentObject =
    fallbackObject;


  // Animation

  const animate = () => {

    requestAnimationFrame(
      animate
    );


    if (currentObject) {

      currentObject.rotation.y +=
        0.02;

      currentObject.rotation.x =
        Math.sin(
          Date.now() * 0.001
        ) * 0.15;

    }


    renderer.render(
      scene,
      camera
    );

  };


  animate();


  window.addEventListener(
    'resize',
    resize
  );


  // OBJ loader

  if (
    typeof THREE.OBJLoader !==
    'undefined'
  ) {

    const loader =
      new THREE.OBJLoader();


    loader.load(

      'images/Girl2.obj',

      (object) => {

        object.traverse(
          (child) => {

            if (child.isMesh) {

              child.material =
                new THREE.MeshStandardMaterial({
                  color: 0xf6e2df,
                  roughness: 0.78,
                  metalness: 0.14
                });

            }

          }
        );


        const box =
          new THREE.Box3()
            .setFromObject(object);


        const size =
          box.getSize(
            new THREE.Vector3()
          ).length();


        const center =
          box.getCenter(
            new THREE.Vector3()
          );


        object.position.sub(
          center
        );


        object.scale.setScalar(
          7.6 /
          Math.max(size, 1)
        );


        scene.remove(
          fallbackObject
        );


        scene.add(
          object
        );


        currentObject =
          object;

      },

      undefined,

      () => {

        scene.remove(
          fallbackObject
        );

        scene.add(
          fallbackObject
        );

        currentObject =
          fallbackObject;

      }

    );

  }

})();


// =====================================================
// HERO VIDEO
// =====================================================

(function () {

  const video =
    document.getElementById(
      'heroVideo'
    );

  if (!video) return;


  const reduceMotion =
    window.matchMedia &&
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;


  function pauseIfHidden() {

    if (
      document.hidden ||
      reduceMotion
    ) {

      video.pause();

    } else {

      const promise =
        video.play();

      if (
        promise &&
        promise.catch
      ) {

        promise.catch(() => {});

      }

    }

  }


  document.addEventListener(
    'visibilitychange',
    pauseIfHidden
  );


  pauseIfHidden();

})();


// =====================================================
// SUPPORT BUTTON
// =====================================================

(function () {

  const supportButtons =
    Array.from(
      document.querySelectorAll(
        '.nav-cta'
      )
    ).filter(
      button =>
        button.textContent
          .trim()
          .toLowerCase() ===
        'support'
    );


  if (!supportButtons.length) {
    return;
  }


  const modal =
    document.createElement('div');


  modal.className =
    'support-modal';


  modal.innerHTML = `

    <div
      class="support-backdrop"
      data-close-support
    ></div>

    <div
      class="support-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supportDialogTitle"
    >

      <button
        class="support-close"
        type="button"
        aria-label="Close support form"
        data-close-support
      >
        ×
      </button>

      <h3 id="supportDialogTitle">
        Support the Art Classes Program
      </h3>

      <p>
        Enter your email address and we will open
        your mail app with a support message about
        the art classes program.
      </p>

      <form class="support-form">

        <label for="supportEmail">
          Email address
        </label>

        <input
          id="supportEmail"
          name="supportEmail"
          type="email"
          placeholder="you@example.com"
          required
        >

        <button
          class="btn btn-primary"
          type="submit"
        >
          Send Support Message
        </button>

      </form>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  const backdrop =
    modal.querySelector(
      '.support-backdrop'
    );


  const form =
    modal.querySelector(
      '.support-form'
    );


  const emailInput =
    modal.querySelector(
      '#supportEmail'
    );


  function closeModal() {

    modal.classList.remove(
      'open'
    );

    document.body.classList.remove(
      'support-modal-open'
    );

  }


  function openModal() {

    modal.classList.add(
      'open'
    );

    document.body.classList.add(
      'support-modal-open'
    );

    emailInput.focus();

  }


  backdrop.addEventListener(
    'click',
    closeModal
  );


  modal
    .querySelectorAll(
      '[data-close-support]'
    )
    .forEach(el => {

      el.addEventListener(
        'click',
        closeModal
      );

    });


  form.addEventListener(
    'submit',
    (event) => {

      event.preventDefault();


      const email =
        emailInput.value.trim();


      if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(email)
      ) {

        emailInput.focus();

        return;

      }


      const subject =
        'Support Request for the Art Classes Program';


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


      const mailtoLink =
        `mailto:sndambuki155@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;


      window.location.href =
        mailtoLink;


      closeModal();

    }
  );


  document.addEventListener(
    'keydown',
    (event) => {

      if (
        event.key === 'Escape'
      ) {

        closeModal();

      }

    }
  );


  supportButtons.forEach(
    button => {

      button.addEventListener(
        'click',
        openModal
      );

    }
  );

})();


// =====================================================
// MOBILE NAVIGATION
// =====================================================

(function () {

  const toggles =
    document.querySelectorAll(
      '.nav-toggle'
    );


  if (!toggles.length) {
    return;
  }


  toggles.forEach(toggle => {

    toggle.addEventListener(
      'click',
      () => {

        const header =
          toggle.closest(
            '.site-header'
          );


        const expanded =
          toggle.getAttribute(
            'aria-expanded'
          ) === 'true';


        toggle.setAttribute(
          'aria-expanded',
          String(!expanded)
        );


        header.classList.toggle(
          'menu-open',
          !expanded
        );

      }
    );

  });


  document
    .querySelectorAll(
      '.nav-links a'
    )
    .forEach(link => {

      link.addEventListener(
        'click',
        () => {

          const header =
            link.closest(
              '.site-header'
            );


          if (header) {

            header.classList.remove(
              'menu-open'
            );


            const toggle =
              header.querySelector(
                '.nav-toggle'
              );


            if (toggle) {

              toggle.setAttribute(
                'aria-expanded',
                'false'
              );

            }

          }

        }
      );

    });

})();


// =====================================================
// HIDE HEADER ON SCROLL
// =====================================================

(function () {

  const header =
    document.querySelector(
      '.site-header'
    );


  if (!header) {
    return;
  }


  let lastY =
    window.scrollY;


  let ticking =
    false;


  const HIDE_DELTA =
    24;


  const REVEAL_DELAY_MS =
    120;


  let revealTimer =
    null;


  function setHeaderVisible(
    visible
  ) {

    if (visible) {

      header.classList.remove(
        'hidden'
      );

      header.classList.add(
        'header-visible'
      );

    } else {

      header.classList.add(
        'hidden'
      );

      header.classList.remove(
        'header-visible'
      );

    }

  }


  function onScroll() {

    const y =
      window.scrollY;


    if (y < 80) {

      setHeaderVisible(
        true
      );

      lastY = y;

      ticking = false;

      return;

    }


    if (
      y > lastY &&
      y - lastY >
        HIDE_DELTA
    ) {

      if (revealTimer) {

        clearTimeout(
          revealTimer
        );

        revealTimer =
          null;

      }


      setHeaderVisible(
        false
      );

    }

    else if (
      y < lastY
    ) {

      if (revealTimer) {

        clearTimeout(
          revealTimer
        );

      }


      revealTimer =
        setTimeout(
          () => {

            setHeaderVisible(
              true
            );

            revealTimer =
              null;

          },
          REVEAL_DELAY_MS
        );

    }


    lastY =
      y;


    ticking =
      false;

  }


  window.addEventListener(
    'scroll',
    () => {

      if (!ticking) {

        window.requestAnimationFrame(
          onScroll
        );

        ticking = true;

      }

    },
    {
      passive: true
    }
  );


  document.addEventListener(
    'click',
    (e) => {

      const toggle =
        e.target.closest(
          '.nav-toggle'
        );


      if (toggle) {

        const expanded =
          toggle.getAttribute(
            'aria-expanded'
          ) === 'true';


        if (expanded) {

          setHeaderVisible(
            true
          );

        }

      }

    }
  );

})();
