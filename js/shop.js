(function () {
  'use strict';

  // =========================================================
  // ARTWORK DATA
  // =========================================================

  let artworkData = [];

  // =========================================================
  // STATE
  // =========================================================

  const state = {
    activeFilter: 'all',
    query: '',
    sort: 'newest',

    cart: JSON.parse(
      localStorage.getItem('ndambo-cart') || '[]'
    ),

    favorites: JSON.parse(
      localStorage.getItem('ndambo-favorites') || '[]'
    ),

    commissionStep: 1,
    commissionData: {},
    commissionImages: []
  };

  let commissionDraftTimer = null;

  // =========================================================
  // DOM ELEMENTS
  // =========================================================

  const artworkGrid = document.getElementById('artworkGrid');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const filterBar = document.getElementById('filterBar');

  const cartToggle = document.getElementById('cartToggle');
  const cartPanel = document.getElementById('cartPanel');
  const closeCart = document.getElementById('closeCart');
  const overlay = document.getElementById('overlay');

  const quickViewModal = document.getElementById('quickViewModal');
  const modalBody = document.getElementById('modalBody');
  const closeModal = document.getElementById('closeModal');

  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartShipping = document.getElementById('cartShipping');
  const cartTax = document.getElementById('cartTax');
  const cartGrand = document.getElementById('cartGrand');

  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryShipping = document.getElementById('summaryShipping');
  const summaryTax = document.getElementById('summaryTax');
  const summaryGrand = document.getElementById('summaryGrand');

  const estimateValue = document.getElementById('estimateValue');
  const commissionForm = document.getElementById('commissionForm');

  const progressBar = document.getElementById('progressBar');
  const progressLabels = document.getElementById('progressLabels');
  const prevStep = document.getElementById('prevStep');
  const nextStep = document.getElementById('nextStep');
  const submitCommission = document.getElementById('submitCommission');

  const customSizeFields = document.getElementById('customSizeFields');
  const referenceImages = document.getElementById('referenceImages');
  const previewHolder = document.getElementById('previewHolder');
  const toastStack = document.getElementById('toastStack');

  // =========================================================
  // COMMISSION STEPS
  // =========================================================

  const commissionSteps = [
    'Artwork Type',
    'Reference Images',
    'Size',
    'Orientation',
    'Style',
    'Background',
    'Subjects',
    'Colour Style',
    'Budget',
    'Delivery',
    'Deadline',
    'Notes',
    'Customer Info'
  ];

  // =========================================================
  // SAVE STATE
  // =========================================================

  function saveState() {
    localStorage.setItem(
      'ndambo-cart',
      JSON.stringify(state.cart)
    );

    localStorage.setItem(
      'ndambo-favorites',
      JSON.stringify(state.favorites)
    );

    localStorage.setItem(
      'ndambo-commission',
      JSON.stringify(state.commissionData)
    );
  }

  // =========================================================
  // TOAST
  // =========================================================

  function showToast(message) {
    if (!toastStack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    toastStack.appendChild(toast);

    setTimeout(() => toast.remove(), 2400);
  }

  // =========================================================
  // BUTTON RIPPLE
  // =========================================================

  function createRipple(event) {
    const button = event.currentTarget;
    if (!button) return;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();

    const size =
      Math.max(rect.width, rect.height) * 1.1;

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left =
      `${event.clientX - rect.left}px`;
    ripple.style.top =
      `${event.clientY - rect.top}px`;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  // =========================================================
  // CURRENCY
  // =========================================================

  function formatCurrency(value) {
    const number = Number(value) || 0;
    return `KES ${number.toLocaleString()}`;
  }

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  function escapeHTML(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================
  // NORMALIZE STATUS
  // =========================================================

  function normalizeStatus(status) {
    const value =
      String(status || 'available')
        .trim()
        .toLowerCase();

    if (
      value === 'sold' ||
      value === 'unavailable' ||
      value === 'unavailable.'
    ) {
      return 'sold';
    }

    return 'available';
  }

  // =========================================================
  // LOAD ARTWORKS FROM SUPABASE
  // =========================================================

  async function loadArtworks() {
    if (!artworkGrid) return;

    artworkGrid.innerHTML = `
      <div
        class="art-card"
        style="
          grid-column:1 / -1;
          padding:2rem;
          text-align:center;
        "
      >
        Loading artworks...
      </div>
    `;

    if (typeof supabaseClient === 'undefined') {
      console.error('Supabase client is not available.');

      artworkGrid.innerHTML = `
        <div
          class="art-card"
          style="
            grid-column:1 / -1;
            padding:2rem;
            text-align:center;
          "
        >
          The shop could not connect to the artwork gallery.
        </div>
      `;

      return;
    }

    try {
      const {
        data,
        error
      } = await supabaseClient
        .from('artworks')
        .select('*')
        .order('created_at', {
          ascending: false
        });

      if (error) {
        console.error(
          'Artwork loading error:',
          error
        );

        artworkGrid.innerHTML = `
          <div
            class="art-card"
            style="
              grid-column:1 / -1;
              padding:2rem;
              text-align:center;
            "
          >
            Could not load artworks right now.
          </div>
        `;

        return;
      }

      artworkData = (data || []).map(item => {
        const status =
          normalizeStatus(item.status);

        return {
          id: item.id,

          name:
            item.title ||
            'Untitled Artwork',

          category:
            item.category ||
            'Artworks',

          medium:
            item.category ||
            'Original Artwork',

          size:
            item.size ||
            'Custom',

          price:
            Number(item.price) || 0,

          description:
            item.description ||
            'Original artwork by Stephen Ndambuki.',

          rating: 5,

          // IMPORTANT:
          // Always store the real normalized status.
          status: status,

          availability:
            status === 'sold'
              ? 'SOLD'
              : 'Available',

          image:
            item.image_url,

          date:
            item.created_at,

          popularity:
            item.featured ? 100 : 50
        };
      });

      console.log(
        'ALL ARTWORKS LOADED FROM SUPABASE:',
        artworkData
      );

      console.log(
        'Available artworks:',
        artworkData.filter(
          item => item.status === 'available'
        )
      );

      console.log(
        'Sold artworks:',
        artworkData.filter(
          item => item.status === 'sold'
        )
      );

      /*
       * Remove sold items that may still be sitting
       * in an old customer's localStorage cart.
       */
      const validCart = state.cart.filter(cartItem => {
        const artwork =
          artworkData.find(
            item => item.id === cartItem.id
          );

        return (
          artwork &&
          artwork.status === 'available'
        );
      });

      if (
        validCart.length !==
        state.cart.length
      ) {
        state.cart = validCart;
        saveState();

        showToast(
          'Unavailable artwork was removed from your cart.'
        );
      }

      renderArtworks();
      renderCart();
      updateTotals();

    } catch (error) {
      console.error(
        'Unexpected artwork loading error:',
        error
      );

      artworkGrid.innerHTML = `
        <div
          class="art-card"
          style="
            grid-column:1 / -1;
            padding:2rem;
            text-align:center;
          "
        >
          Could not load artworks right now.
        </div>
      `;
    }
  }

  // =========================================================
  // FILTER ARTWORKS
  // =========================================================

  function getFilteredArtworks() {
    const query =
      state.query
        .trim()
        .toLowerCase();

    return artworkData

      .filter(item => {
        /*
         * "all" MUST show BOTH available and sold artwork.
         */
        if (
          !state.activeFilter ||
          state.activeFilter === 'all'
        ) {
          return true;
        }

        return (
          item.category === state.activeFilter ||
          item.medium === state.activeFilter
        );
      })

      .filter(item => {
        if (!query) return true;

        const haystack =
          `${item.name} ${item.category} ${item.medium} ${item.description} ${item.status}`
            .toLowerCase();

        return haystack.includes(query);
      })

      .sort((a, b) => {
        switch (state.sort) {
          case 'oldest':
            return (
              new Date(a.date) -
              new Date(b.date)
            );

          case 'price-asc':
            return a.price - b.price;

          case 'price-desc':
            return b.price - a.price;

          case 'alpha':
            return a.name.localeCompare(b.name);

          case 'popular':
            return b.popularity - a.popularity;

          default:
            return (
              new Date(b.date) -
              new Date(a.date)
            );
        }
      });
  }

  // =========================================================
  // RENDER ARTWORKS
  // =========================================================

  function renderArtworks() {
    if (!artworkGrid) return;

    const items =
      getFilteredArtworks();

    console.log(
      'RENDERING ARTWORKS:',
      items
    );

    artworkGrid.innerHTML = '';

    if (!items.length) {
      artworkGrid.innerHTML = `
        <div
          class="art-card"
          style="
            grid-column:1 / -1;
            padding:1.2rem;
          "
        >
          No artworks match your search yet.
        </div>
      `;

      return;
    }

    items.forEach(item => {
      const isFavorite =
        state.favorites.includes(item.id);

      const isSold =
        item.status === 'sold';

      const card =
        document.createElement('article');

      card.className =
        'art-card';

      /*
       * Add a class to sold cards so you can style
       * them later in CSS if desired.
       */
      if (isSold) {
        card.classList.add('sold-artwork');
      }

      card.innerHTML = `
        <div style="position:relative;">

          <img
            src="${escapeHTML(
              item.image ||
              '../images/artwork1.jpg'
            )}"
            alt="${escapeHTML(item.name)}"
          >

          ${
            isSold
              ? `
                <div
                  class="sold-badge"
                  style="
                    position:absolute;
                    top:12px;
                    left:12px;
                    z-index:2;
                    background:#111;
                    color:#fff;
                    padding:7px 12px;
                    border-radius:6px;
                    font-size:.75rem;
                    font-weight:800;
                    letter-spacing:.08em;
                  "
                >
                  SOLD
                </div>
              `
              : ''
          }

        </div>

        <div class="art-card__body">

          <div class="art-card__top">

            <h3>
              ${escapeHTML(item.name)}
            </h3>

            <button
              class="favorite-btn ${
                isFavorite ? 'active' : ''
              }"
              data-id="${item.id}"
              type="button"
              aria-label="Favorite"
            >
              ♡
            </button>

          </div>

          <div class="meta">

            <span>
              ${escapeHTML(item.category)}
            </span>

            <span>
              ${escapeHTML(item.medium)}
            </span>

            <span>
              ${escapeHTML(item.size)}
            </span>

          </div>

          <p>
            ${escapeHTML(item.description)}
          </p>

          <div class="price-row">

            <span class="rating">
              ★ ${Number(item.rating).toFixed(1)}
            </span>

            <strong>
              ${formatCurrency(item.price)}
            </strong>

          </div>

          <p class="meta">

            <span
              ${
                isSold
                  ? `
                    style="
                      color:#b42318;
                      font-weight:800;
                    "
                  `
                  : ''
              }
            >
              ${
                isSold
                  ? 'SOLD'
                  : 'Available'
              }
            </span>

          </p>

          <div class="card-actions">

            <button
              class="btn btn-secondary quick-view"
              data-id="${item.id}"
              type="button"
            >
              Quick View
            </button>

            ${
              isSold
                ? `
                  <button
                    class="btn btn-secondary"
                    type="button"
                    disabled
                    style="
                      opacity:.65;
                      cursor:not-allowed;
                    "
                  >
                    SOLD
                  </button>
                `
                : `
                  <button
                    class="btn btn-primary add-to-cart"
                    data-id="${item.id}"
                    type="button"
                  >
                    Add to Cart
                  </button>
                `
            }

          </div>

        </div>
      `;

      artworkGrid.appendChild(card);
    });
  }

  // =========================================================
  // CART
  // =========================================================

  function renderCart() {
    if (!cartItems) return;

    cartItems.innerHTML = '';

    if (!state.cart.length) {
      cartItems.innerHTML =
        '<p style="color:var(--muted);">Your cart is empty.</p>';

      updateTotals();
      return;
    }

    state.cart.forEach(item => {
      const art =
        artworkData.find(
          entry => entry.id === item.id
        );

      if (
        !art ||
        art.status !== 'available'
      ) {
        return;
      }

      const row =
        document.createElement('div');

      row.className =
        'cart-item';

      row.innerHTML = `
        <img
          src="${escapeHTML(
            art.image ||
            '../images/artwork1.jpg'
          )}"
          alt="${escapeHTML(art.name)}"
        >

        <div class="cart-item__meta">

          <strong>
            ${escapeHTML(art.name)}
          </strong>

          <small>
            ${formatCurrency(art.price)}
          </small>

          <div class="qty-controls">

            <button
              type="button"
              data-action="decrease"
              data-id="${art.id}"
            >
              −
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              type="button"
              data-action="increase"
              data-id="${art.id}"
            >
              +
            </button>

          </div>

        </div>

        <div>

          <strong>
            ${formatCurrency(
              art.price *
              item.quantity
            )}
          </strong>

          <div style="margin-top:.35rem;">

            <button
              class="icon-btn"
              type="button"
              data-action="remove"
              data-id="${art.id}"
            >
              ✕
            </button>

          </div>

        </div>
      `;

      cartItems.appendChild(row);
    });

    if (!cartItems.children.length) {
      cartItems.innerHTML =
        '<p style="color:var(--muted);">Your cart is empty.</p>';
    }

    updateTotals();
  }

  // =========================================================
  // CART TOTALS
  // =========================================================

  function updateTotals() {
    const subtotal =
      state.cart.reduce(
        (sum, item) => {
          const art =
            artworkData.find(
              entry => entry.id === item.id
            );

          if (
            !art ||
            art.status !== 'available'
          ) {
            return sum;
          }

          return (
            sum +
            art.price *
            Number(item.quantity || 0)
          );
        },
        0
      );

    const shipping =
      subtotal > 0
        ? 1500
        : 0;

    const tax =
      Math.round(
        subtotal * 0.08
      );

    const grand =
      subtotal +
      shipping +
      tax;

    if (cartSubtotal)
      cartSubtotal.textContent =
        formatCurrency(subtotal);

    if (cartShipping)
      cartShipping.textContent =
        formatCurrency(shipping);

    if (cartTax)
      cartTax.textContent =
        formatCurrency(tax);

    if (cartGrand)
      cartGrand.textContent =
        formatCurrency(grand);

    if (summarySubtotal)
      summarySubtotal.textContent =
        formatCurrency(subtotal);

    if (summaryShipping)
      summaryShipping.textContent =
        formatCurrency(shipping);

    if (summaryTax)
      summaryTax.textContent =
        formatCurrency(tax);

    if (summaryGrand)
      summaryGrand.textContent =
        formatCurrency(grand);

    if (cartCount) {
      cartCount.textContent =
        state.cart.reduce(
          (sum, item) =>
            sum +
            Number(item.quantity || 0),
          0
        );
    }
  }

  // =========================================================
  // CART TOGGLE
  // =========================================================

  function toggleCart(force) {
    if (!cartPanel || !overlay) return;

    const shouldOpen =
      typeof force === 'boolean'
        ? force
        : !cartPanel.classList.contains('open');

    cartPanel.classList.toggle(
      'open',
      shouldOpen
    );

    overlay.classList.toggle(
      'show',
      shouldOpen
    );
  }

  // =========================================================
  // QUICK VIEW
  // =========================================================

  function openModal(id) {
    const art =
      artworkData.find(
        item => item.id === id
      );

    if (
      !art ||
      !modalBody ||
      !quickViewModal
    ) {
      return;
    }

    const isSold =
      art.status === 'sold';

    modalBody.innerHTML = `
      <img
        src="${escapeHTML(
          art.image ||
          '../images/artwork1.jpg'
        )}"
        alt="${escapeHTML(art.name)}"
      >

      <div>

        <p class="eyebrow">
          Quick View
        </p>

        <h3>
          ${escapeHTML(art.name)}
        </h3>

        <p>
          <strong>Artist:</strong>
          Stephen Ndambuki
        </p>

        <p>
          <strong>Medium:</strong>
          ${escapeHTML(art.medium)}
        </p>

        <p>
          <strong>Description:</strong>
          ${escapeHTML(art.description)}
        </p>

        <p>
          <strong>Dimensions:</strong>
          ${escapeHTML(art.size)}
        </p>

        <p>
          <strong>Estimated Delivery:</strong>
          5–10 business days
        </p>

        <p>
          <strong>Availability:</strong>

          <span
            ${
              isSold
                ? `
                  style="
                    color:#b42318;
                    font-weight:800;
                  "
                `
                : ''
            }
          >
            ${
              isSold
                ? 'SOLD'
                : 'Available'
            }
          </span>
        </p>

        <p
          style="
            font-size:1.2rem;
            font-weight:700;
            margin-top:.7rem;
          "
        >
          ${formatCurrency(art.price)}
        </p>

        ${
          isSold
            ? `
              <button
                class="btn btn-secondary"
                type="button"
                disabled
                style="
                  opacity:.65;
                  cursor:not-allowed;
                "
              >
                SOLD
              </button>
            `
            : `
              <button
                class="btn btn-primary add-to-cart"
                data-id="${art.id}"
                type="button"
              >
                Add to Cart
              </button>
            `
        }

      </div>
    `;

    quickViewModal.classList.add('open');

    quickViewModal.setAttribute(
      'aria-hidden',
      'false'
    );
  }

  function closeModalFn() {
    if (!quickViewModal) return;

    quickViewModal.classList.remove('open');

    quickViewModal.setAttribute(
      'aria-hidden',
      'true'
    );
  }

  // =========================================================
  // ADD TO CART
  // =========================================================

  function addToCart(id) {
    const artwork =
      artworkData.find(
        item => item.id === id
      );

    if (!artwork) {
      showToast(
        'Artwork could not be found.'
      );

      return;
    }

    /*
     * IMPORTANT:
     * Sold artwork can never enter the cart.
     */
    if (
      artwork.status !== 'available'
    ) {
      showToast(
        'This artwork has already been sold.'
      );

      return;
    }

    const existing =
      state.cart.find(
        item => item.id === id
      );

    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        id,
        quantity: 1
      });
    }

    saveState();
    renderCart();

    showToast('Added to Cart');
  }

  // =========================================================
  // FAVORITES
  // =========================================================

  function toggleFavorite(id) {
    if (
      state.favorites.includes(id)
    ) {
      state.favorites =
        state.favorites.filter(
          item => item !== id
        );
    } else {
      state.favorites.push(id);
    }

    saveState();
    renderArtworks();

    showToast(
      state.favorites.includes(id)
        ? 'Added to Favorites'
        : 'Removed from Favorites'
    );
  }

  // =========================================================
  // COMMISSION PROGRESS
  // =========================================================

  function updateCommissionProgress() {
    if (
      !progressBar ||
      !progressLabels
    ) {
      return;
    }

    const totalSteps =
      commissionSteps.length;

    const progress =
      Math.round(
        (
          state.commissionStep /
          totalSteps
        ) * 100
      );

    progressBar.innerHTML =
      `<span style="width:${progress}%"></span>`;

    progressLabels.innerHTML =
      commissionSteps
        .map(
          (label, index) =>
            `<span>${index + 1}. ${label}</span>`
        )
        .join('');
  }

  // =========================================================
  // COMMISSION STEPS
  // =========================================================

  function renderCommissionSteps() {
    const panels =
      document.querySelectorAll(
        '.step-panel'
      );

    panels.forEach(panel => {
      const stepNumber =
        Number(panel.dataset.step);

      panel.classList.toggle(
        'active',
        stepNumber ===
        Number(state.commissionStep)
      );
    });

    updateCommissionProgress();

    if (prevStep) {
      prevStep.disabled =
        state.commissionStep === 1;
    }

    if (
      nextStep &&
      submitCommission
    ) {
      if (
        state.commissionStep ===
        commissionSteps.length
      ) {
        nextStep.classList.add('hidden');
        submitCommission.classList.remove('hidden');
      } else {
        nextStep.classList.remove('hidden');
        submitCommission.classList.add('hidden');
      }
    }
  }

  // =========================================================
  // COMMISSION NAVIGATION
  // =========================================================

  function handleStep(direction) {
    const nextStepIndex =
      Number(state.commissionStep) +
      direction;

    if (
      nextStepIndex < 1 ||
      nextStepIndex >
        commissionSteps.length
    ) {
      return;
    }

    state.commissionStep =
      nextStepIndex;

    renderCommissionSteps();
    saveCommissionDraft();

    const commissionSection =
      document.getElementById(
        'commission'
      );

    if (commissionSection) {
      commissionSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  // =========================================================
  // COMMISSION ESTIMATE
  // =========================================================

  function estimateCommission() {
    if (
      !commissionForm ||
      !estimateValue
    ) {
      return;
    }

    const formData =
      new FormData(
        commissionForm
      );

    const sizeValue =
      formData.get('size') || '';

    const base = 5000;

    let sizeMultiplier = 1;

    if (
      sizeValue.includes('A0') ||
      sizeValue.includes('100 × 120')
    ) {
      sizeMultiplier = 2.2;
    } else if (
      sizeValue.includes('A1') ||
      sizeValue.includes('80 × 100')
    ) {
      sizeMultiplier = 1.9;
    } else if (
      sizeValue.includes('A2') ||
      sizeValue.includes('60 × 90')
    ) {
      sizeMultiplier = 1.5;
    } else if (
      sizeValue.includes('A3') ||
      sizeValue.includes('50 × 70')
    ) {
      sizeMultiplier = 1.2;
    }

    const style =
      formData.get('style');

    let styleMultiplier = 1;

    if (style === 'Realistic') {
      styleMultiplier = 1.4;
    } else if (style === 'Abstract') {
      styleMultiplier = 1.1;
    }

    const budget =
      formData.get('budget') || '';

    let budgetMultiplier = 1;

    if (
      budget.includes('50,000') ||
      budget.includes('100,000')
    ) {
      budgetMultiplier = 1.7;
    } else if (
      budget.includes('20,000')
    ) {
      budgetMultiplier = 1.4;
    }

    const estimate =
      Math.round(
        base *
        sizeMultiplier *
        styleMultiplier *
        budgetMultiplier
      );

    estimateValue.textContent =
      formatCurrency(estimate);
  }

  // =========================================================
  // SAVE COMMISSION DRAFT
  // =========================================================

  function saveCommissionDraft() {
    if (!commissionForm) return;

    const formData =
      new FormData(
        commissionForm
      );

    const values =
      Object.fromEntries(
        formData.entries()
      );

    state.commissionData = {
      ...state.commissionData,
      ...values,
      step: state.commissionStep
    };

    saveState();
  }

  function scheduleCommissionSave() {
    if (commissionDraftTimer) {
      clearTimeout(
        commissionDraftTimer
      );
    }

    commissionDraftTimer =
      setTimeout(
        saveCommissionDraft,
        700
      );
  }

  // =========================================================
  // RESTORE COMMISSION DRAFT
  // =========================================================

  function populateCommissionFromStorage() {
    if (!commissionForm) return;

    const stored =
      JSON.parse(
        localStorage.getItem(
          'ndambo-commission'
        ) || '{}'
      );

    if (
      !stored ||
      Object.keys(stored).length === 0
    ) {
      return;
    }

    Object.entries(stored).forEach(
      ([key, value]) => {
        if (key === 'step') return;

        const inputs =
          commissionForm.querySelectorAll(
            `[name="${key}"]`
          );

        if (!inputs.length) return;

        const firstInput =
          inputs[0];

        if (
          firstInput.type === 'radio'
        ) {
          inputs.forEach(input => {
            input.checked =
              input.value === value;
          });
        } else if (
          firstInput.type !== 'file'
        ) {
          firstInput.value = value;
        }
      }
    );

    state.commissionStep =
      Number(stored.step) || 1;

    renderCommissionSteps();
    estimateCommission();
  }

  // =========================================================
  // COMMISSION EMAIL
  // =========================================================

  function buildCommissionEmail() {
    if (!commissionForm) return '';

    const formData =
      new FormData(
        commissionForm
      );

    const values =
      Object.fromEntries(
        formData.entries()
      );

    const lines = [
      '--------------------------------------------------',
      'NEW COMMISSION REQUEST',
      '',
      'Customer Name:',
      values.customerName || '',
      'Email:',
      values.customerEmail || '',
      'Phone:',
      values.customerPhone || '',
      'Country:',
      values.customerCountry || '',
      'Artwork Type:',
      values.artworkType || '',
      'Medium:',
      values.artworkType || '',
      'Canvas Size:',
      values.size || '',
      'Orientation:',
      values.orientation || '',
      'Style:',
      values.style || '',
      'Background:',
      values.background || '',
      'Subjects:',
      values.subjects || '',
      'Colour Style:',
      values.colourStyle || '',
      'Budget:',
      values.budget || '',
      'Delivery Method:',
      values.delivery || '',
      'Deadline:',
      values.deadline || '',
      'Additional Notes:',
      values.notes || '',
      '',
      'Please contact me regarding this commission.',
      '--------------------------------------------------'
    ];

    return encodeURIComponent(
      lines.join('\n')
    );
  }

  // =========================================================
  // PARSE BUDGET
  // =========================================================

  function parseBudget(budgetValue) {
    if (!budgetValue) return null;

    const matches =
      String(budgetValue).match(
        /\d[\d,]*/g
      );

    if (
      !matches ||
      !matches.length
    ) {
      return null;
    }

    const numbers =
      matches.map(
        value =>
          Number(
            value.replace(/,/g, '')
          )
      );

    const validNumbers =
      numbers.filter(
        number =>
          Number.isFinite(number)
      );

    if (!validNumbers.length) {
      return null;
    }

    return validNumbers[0];
  }

  // =========================================================
  // CURRENT COMMISSION ESTIMATE
  // =========================================================

  function getCurrentCommissionEstimate() {
    if (!estimateValue) return null;

    const text =
      estimateValue.textContent || '';

    const matches =
      text.match(
        /[\d,]+(?:\.\d+)?/
      );

    if (!matches) return null;

    const number =
      Number(
        matches[0].replace(/,/g, '')
      );

    return Number.isFinite(number)
      ? number
      : null;
  }

  // =========================================================
  // SUBMIT COMMISSION
  // =========================================================

  async function handleCommissionSubmit(event) {
    event.preventDefault();

    if (!commissionForm) return;

    const formData =
      new FormData(
        commissionForm
      );

    const values =
      Object.fromEntries(
        formData.entries()
      );

    const referenceFiles =
      referenceImages
        ? Array.from(
            referenceImages.files || []
          )
        : [];

    const commissionRequest = {
      name:
        values.customerName || '',

      email:
        values.customerEmail || '',

      phone:
        values.customerPhone || '',

      customer_country:
        values.customerCountry || '',

      artwork_type:
        values.artworkType || '',

      size:
        values.size || '',

      orientation:
        values.orientation || '',

      style:
        values.style || '',

      background:
        values.background || '',

      subjects:
        values.subjects || '',

      colour_style:
        values.colourStyle || '',

      budget:
        parseBudget(values.budget),

      currency: 'KES',

      delivery:
        values.delivery || '',

      deadline:
        values.deadline || '',

      description:
        values.notes ||
        'No additional notes provided.',

      estimated_price:
        getCurrentCommissionEstimate(),

      reference_image_names:
        referenceFiles
          .map(file => file.name)
          .join(', ')
    };

    if (submitCommission) {
      submitCommission.disabled = true;
      submitCommission.textContent = 'Sending...';
    }

    try {
      if (
        typeof supabaseClient ===
        'undefined'
      ) {
        throw new Error(
          'Supabase client is not available.'
        );
      }

      const { error } =
        await supabaseClient
          .from('commission_requests')
          .insert([
            commissionRequest
          ]);

      if (error) {
        console.error(
          'Supabase commission error:',
          error
        );

        throw error;
      }

      showToast(
        'Commission request sent successfully!'
      );

      localStorage.removeItem(
        'ndambo-commission'
      );

      state.commissionData = {};

      setTimeout(() => {
        alert(
          'Thank you! Your commission request has been received. Stephen will contact you soon.'
        );
      }, 300);

    } catch (error) {
      console.error(
        'Commission submission failed:',
        error
      );

      showToast(
        'Could not send request'
      );

      alert(
        'Something went wrong while sending your commission request. Please try again.'
      );

    } finally {
      if (submitCommission) {
        submitCommission.disabled = false;
        submitCommission.textContent =
          'Request My Commission';
      }
    }
  }

  // =========================================================
  // CHECKOUT
  // =========================================================

  async function handleCheckoutSubmit(event) {
    event.preventDefault();

    const formData =
      new FormData(
        event.target
      );

    const values =
      Object.fromEntries(
        formData.entries()
      );

    if (!state.cart.length) {
      showToast(
        'Your cart is empty.'
      );

      return;
    }

    /*
     * IMPORTANT:
     * Re-check every item against the current artwork
     * data before creating an order.
     */
    const unavailableItems =
      state.cart.filter(cartItem => {
        const artwork =
          artworkData.find(
            item =>
              item.id === cartItem.id
          );

        return (
          !artwork ||
          artwork.status !== 'available'
        );
      });

    if (unavailableItems.length) {
      state.cart =
        state.cart.filter(cartItem => {
          const artwork =
            artworkData.find(
              item =>
                item.id === cartItem.id
            );

          return (
            artwork &&
            artwork.status === 'available'
          );
        });

      saveState();
      renderCart();
      updateTotals();

      showToast(
        'One or more artworks are no longer available.'
      );

      return;
    }

    const subtotal =
      state.cart.reduce(
        (sum, item) => {
          const art =
            artworkData.find(
              entry =>
                entry.id === item.id
            );

          return (
            sum +
            (
              art
                ? art.price *
                  item.quantity
                : 0
            )
          );
        },
        0
      );

    const shipping =
      subtotal > 0
        ? 1500
        : 0;

    const tax =
      Math.round(
        subtotal * 0.08
      );

    const grand =
      subtotal +
      shipping +
      tax;

    if (
      typeof supabaseClient ===
      'undefined'
    ) {
      showToast(
        'Supabase connection is not available.'
      );

      return;
    }

    const orderNumber =
      'NAL-' +
      Date.now()
        .toString()
        .slice(-8);

    const orderId =
      crypto.randomUUID();

    console.log(
      'Creating order:',
      orderNumber
    );

    const {
      error: orderError
    } =
      await supabaseClient
        .from('orders')
        .insert([
          {
            id: orderId,

            order_number:
              orderNumber,

            customer_name:
              values.fullName || '',

            customer_email:
              values.email || '',

            customer_phone:
              values.phone || '',

            delivery_address:
              `${values.address || ''}, ${values.city || ''}, ${values.country || ''}`,

            subtotal:
              subtotal,

            delivery_fee:
              shipping,

            total:
              grand,

            currency:
              'KES',

            payment_status:
              'pending',

            order_status:
              'pending',

            notes:
              values.instructions ||
              null
          }
        ]);

    if (orderError) {
      console.error(
        'ORDER CREATION ERROR:',
        orderError
      );

      showToast(
        'There was a problem submitting your order.'
      );

      alert(
        'There was a problem submitting your order. Please check again.'
      );

      return;
    }

    const orderItems =
      state.cart
        .map(cartItem => {
          const artwork =
            artworkData.find(
              item =>
                item.id ===
                cartItem.id
            );

          if (!artwork) {
            return null;
          }

          return {
            order_id:
              orderId,

            artwork_id:
              artwork.id,

            title_snapshot:
              artwork.name,

            quantity:
              Number(
                cartItem.quantity
              ),

            unit_price:
              Number(
                artwork.price
              )
          };
        })
        .filter(Boolean);

    if (!orderItems.length) {
      showToast(
        'No artwork items were found.'
      );

      return;
    }

    const {
      error: itemsError
    } =
      await supabaseClient
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
      console.error(
        'ORDER ITEMS ERROR:',
        itemsError
      );

      showToast(
        'The order was created, but the artwork items could not be saved.'
      );

      alert(
        'The order was created, but the artwork information could not be saved. Please contact the administrator.'
      );

      return;
    }

    state.cart = [];

    saveState();

    renderCart();
    updateTotals();

    showToast(
      `Order ${orderNumber} received successfully!`
    );

    alert(
      `Thank you! Your order ${orderNumber} has been received. We will contact you shortly.`
    );

    console.log(
      'ORDER COMPLETED SUCCESSFULLY:',
      orderNumber
    );
  }

  // =========================================================
  // EVENTS
  // =========================================================

  function initEvents() {

    // SEARCH
    if (searchInput) {
      searchInput.addEventListener(
        'input',
        event => {
          state.query =
            event.target.value;

          renderArtworks();
        }
      );
    }

    // SORT
    if (sortSelect) {
      sortSelect.addEventListener(
        'change',
        event => {
          state.sort =
            event.target.value;

          renderArtworks();
        }
      );
    }

    // FILTER
    if (filterBar) {
      filterBar.addEventListener(
        'click',
        event => {
          const button =
            event.target.closest(
              '.filter-chip'
            );

          if (!button) return;

          document
            .querySelectorAll(
              '.filter-chip'
            )
            .forEach(chip =>
              chip.classList.remove(
                'active'
              )
            );

          button.classList.add(
            'active'
          );

          state.activeFilter =
            button.dataset.filter ||
            'all';

          renderArtworks();
        }
      );
    }

    // CART
    if (cartToggle) {
      cartToggle.addEventListener(
        'click',
        () => toggleCart(true)
      );
    }

    if (closeCart) {
      closeCart.addEventListener(
        'click',
        () => toggleCart(false)
      );
    }

    if (overlay) {
      overlay.addEventListener(
        'click',
        () => toggleCart(false)
      );
    }

    // MODAL
    if (closeModal) {
      closeModal.addEventListener(
        'click',
        closeModalFn
      );
    }

    if (quickViewModal) {
      quickViewModal.addEventListener(
        'click',
        event => {
          if (
            event.target ===
            quickViewModal
          ) {
            closeModalFn();
          }
        }
      );
    }

    // GLOBAL BUTTON ACTIONS
    document.addEventListener(
      'click',
      event => {

        const interactive =
          event.target.closest(
            '.btn, .filter-chip, .icon-btn, .cart-trigger, .favorite-btn'
          );

        if (interactive) {
          createRipple({
            currentTarget:
              interactive,

            clientX:
              event.clientX,

            clientY:
              event.clientY
          });
        }

        // FAVORITE
        const favoriteButton =
          event.target.closest(
            '.favorite-btn'
          );

        if (favoriteButton) {
          event.preventDefault();

          favoriteButton.classList.add(
            'animating'
          );

          setTimeout(
            () =>
              favoriteButton.classList.remove(
                'animating'
              ),
            280
          );

          toggleFavorite(
            favoriteButton.dataset.id
          );

          return;
        }

        // QUICK VIEW
        const quickViewButton =
          event.target.closest(
            '.quick-view'
          );

        if (quickViewButton) {
          openModal(
            quickViewButton.dataset.id
          );

          return;
        }

        // ADD TO CART
        const addToCartButton =
          event.target.closest(
            '.add-to-cart'
          );

        if (addToCartButton) {
          addToCart(
            addToCartButton.dataset.id
          );

          return;
        }

        // CART ACTION
        const cartActionButton =
          event.target.closest(
            '[data-action]'
          );

        if (cartActionButton) {
          const action =
            cartActionButton.dataset.action;

          const id =
            cartActionButton.dataset.id;

          const target =
            state.cart.find(
              item =>
                item.id === id
            );

          if (!target) return;

          if (action === 'increase') {
            target.quantity += 1;
          }

          else if (
            action === 'decrease'
          ) {
            target.quantity =
              Math.max(
                1,
                target.quantity - 1
              );
          }

          else if (
            action === 'remove'
          ) {
            state.cart =
              state.cart.filter(
                item =>
                  item.id !== id
              );
          }

          saveState();
          renderCart();
        }
      }
    );

    // COMMISSION NAVIGATION
    if (prevStep) {
      prevStep.addEventListener(
        'click',
        () => handleStep(-1)
      );
    }

    if (nextStep) {
      nextStep.addEventListener(
        'click',
        () => handleStep(1)
      );
    }

    // COMMISSION FORM
    if (commissionForm) {

      commissionForm.addEventListener(
        'input',
        () => {
          estimateCommission();
          scheduleCommissionSave();
        }
      );

      commissionForm.addEventListener(
        'change',
        () => {
          estimateCommission();
          scheduleCommissionSave();
        }
      );

      commissionForm.addEventListener(
        'submit',
        handleCommissionSubmit
      );
    }

    // CHECKOUT
    const checkoutForm =
      document.getElementById(
        'checkoutForm'
      );

    if (checkoutForm) {
      checkoutForm.addEventListener(
        'submit',
        handleCheckoutSubmit
      );
    }

    // REFERENCE IMAGES
    if (
      referenceImages &&
      previewHolder
    ) {
      referenceImages.addEventListener(
        'change',
        event => {
          const files =
            Array.from(
              event.target.files || []
            );

          state.commissionImages =
            files;

          previewHolder.innerHTML = '';

          files.forEach(file => {
            const url =
              URL.createObjectURL(
                file
              );

            const img =
              document.createElement(
                'img'
              );

            img.src = url;
            img.alt = file.name;

            previewHolder.appendChild(
              img
            );
          });
        }
      );
    }

    // SIZE
    const sizeSelect =
      document.getElementById(
        'sizeSelect'
      );

    if (
      sizeSelect &&
      customSizeFields
    ) {
      sizeSelect.addEventListener(
        'change',
        event => {
          customSizeFields.classList.toggle(
            'show',
            event.target.value ===
            'Custom Size'
          );
        }
      );
    }

    // MOBILE NAVIGATION
    const navToggle =
      document.querySelector(
        '.nav-toggle'
      );

    const navLinks =
      document.querySelector(
        '.nav-links'
      );

    if (
      navToggle &&
      navLinks
    ) {
      navToggle.addEventListener(
        'click',
        () => {
          navLinks.classList.toggle(
            'active'
          );
        }
      );
    }
  }

  // =========================================================
  // INITIALIZE
  // =========================================================

  function init() {

    /*
     * Start with ALL artwork.
     * This includes both AVAILABLE and SOLD artwork.
     */
    state.activeFilter = 'all';

    // Make sure the "All" filter visually agrees
    // with the JavaScript state.
    const allFilter =
      document.querySelector(
        '.filter-chip[data-filter="all"]'
      );

    if (allFilter) {
      document
        .querySelectorAll('.filter-chip')
        .forEach(chip =>
          chip.classList.remove(
            'active'
          )
        );

      allFilter.classList.add(
        'active'
      );
    }

    loadArtworks();

    renderCart();
    updateTotals();

    renderCommissionSteps();
    populateCommissionFromStorage();

    initEvents();

    updateCommissionProgress();
    estimateCommission();
  }

  // =========================================================
  // START
  // =========================================================

  init();

})();
