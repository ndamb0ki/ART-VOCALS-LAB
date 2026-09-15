(function () {
  'use strict';

  const artworkData = [
    {
      id: 1,
      name: 'Golden Horizon',
      category: 'Landscapes',
      medium: 'Oil Paintings',
      size: '60 × 90 cm',
      price: 18000,
      description: 'A luminous landscape with warm light and calm depth.',
      rating: 4.9,
      availability: 'In Stock',
      image: '../images/artwork3.jpg',
      date: '2026-07-20',
      popularity: 95
    },
    {
      id: 2,
      name: 'Midnight Portrait',
      category: 'Portraits',
      medium: 'Charcoal',
      size: '40 × 50 cm',
      price: 12500,
      description: 'A contemplative charcoal portrait with elegant contrast.',
      rating: 4.8,
      availability: 'Limited Edition',
      image: '../images/artwork2.jpg',
      date: '2026-06-18',
      popularity: 88
    },
    {
      id: 3,
      name: 'Studio Bloom',
      category: 'Abstract',
      medium: 'Acrylic Paintings',
      size: '50 × 70 cm',
      price: 15000,
      description: 'An abstract composition balancing softness and structure.',
      rating: 4.7,
      availability: 'In Stock',
      image: '../images/artwork1.jpg',
      date: '2026-08-01',
      popularity: 82
    },
    {
      id: 4,
      name: 'Cedar Study',
      category: 'Architecture',
      medium: 'Ink',
      size: '30 × 40 cm',
      price: 9500,
      description: 'Architectural ink work focused on rhythm and shadow.',
      rating: 4.6,
      availability: 'In Stock',
      image: '../images/artclass1.jpg',
      date: '2026-05-12',
      popularity: 76
    },
    {
      id: 5,
      name: 'Wild Echo',
      category: 'Wildlife',
      medium: 'Colored Pencil',
      size: '40 × 50 cm',
      price: 11000,
      description: 'A detailed wildlife piece with rich color layering.',
      rating: 4.9,
      availability: 'In Stock',
      image: '../images/trip1.jpg',
      date: '2026-07-05',
      popularity: 91
    },
    {
      id: 6,
      name: 'Quiet Memory',
      category: 'Pencil Drawings',
      medium: 'Pencil Drawings',
      size: '20 × 20 cm',
      price: 7000,
      description: 'A gentle graphite study with emotional clarity.',
      rating: 4.5,
      availability: 'Available',
      image: '../images/artclass3.jpg',
      date: '2026-04-22',
      popularity: 70
    }
  ];

  const state = {
    activeFilter: 'all',
    query: '',
    sort: 'newest',
    cart: JSON.parse(localStorage.getItem('ndambo-cart') || '[]'),
    favorites: JSON.parse(localStorage.getItem('ndambo-favorites') || '[]'),
    commissionStep: 1,
    commissionData: {},
    commissionImages: []
  };
  let commissionDraftTimer = null;

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

  function saveState() {
    localStorage.setItem('ndambo-cart', JSON.stringify(state.cart));
    localStorage.setItem('ndambo-favorites', JSON.stringify(state.favorites));
    localStorage.setItem('ndambo-commission', JSON.stringify(state.commissionData));
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }

  function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.1;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  function formatCurrency(value) {
    return `KES ${value.toLocaleString()}`;
  }

  function getFilteredArtworks() {
    const query = state.query.trim().toLowerCase();
    return artworkData
      .filter((item) => state.activeFilter === 'all' || item.category === state.activeFilter || item.medium === state.activeFilter)
      .filter((item) => {
        if (!query) return true;
        const haystack = `${item.name} ${item.category} ${item.medium} ${item.description}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        switch (state.sort) {
          case 'oldest': return new Date(a.date) - new Date(b.date);
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          case 'alpha': return a.name.localeCompare(b.name);
          case 'popular': return b.popularity - a.popularity;
          default: return new Date(b.date) - new Date(a.date);
        }
      });
  }

  function renderArtworks() {
    const items = getFilteredArtworks();
    const empty = items.length === 0;
    artworkGrid.innerHTML = empty
      ? '<div class="art-card" style="grid-column: 1 / -1; padding: 1.2rem;">No artworks match your search yet.</div>'
      : '';

    items.forEach((item) => {
      const isFavorite = state.favorites.includes(item.id);
      const card = document.createElement('article');
      card.className = 'art-card';
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="art-card__body">
          <div class="art-card__top">
            <h3>${item.name}</h3>
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${item.id}" type="button" aria-label="Favorite">♡</button>
          </div>
          <div class="meta">
            <span>${item.category}</span>
            <span>${item.medium}</span>
            <span>${item.size}</span>
          </div>
          <p>${item.description}</p>
          <div class="price-row">
            <span class="rating">★ ${item.rating.toFixed(1)}</span>
            <strong>${formatCurrency(item.price)}</strong>
          </div>
          <p class="meta"><span>${item.availability}</span></p>
          <div class="card-actions">
            <button class="btn btn-secondary quick-view" data-id="${item.id}" type="button">Quick View</button>
            <button class="btn btn-primary add-to-cart" data-id="${item.id}" type="button">Add to Cart</button>
          </div>
        </div>`;
      artworkGrid.appendChild(card);
    });
  }

  function renderCart() {
    cartItems.innerHTML = '';
    if (!state.cart.length) {
      cartItems.innerHTML = '<p style="color: var(--muted);">Your cart is empty.</p>';
      updateTotals();
      return;
    }

    state.cart.forEach((item) => {
      const art = artworkData.find((entry) => entry.id === item.id);
      if (!art) return;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${art.image}" alt="${art.name}">
        <div class="cart-item__meta">
          <strong>${art.name}</strong>
          <small>${formatCurrency(art.price)}</small>
          <div class="qty-controls">
            <button type="button" data-action="decrease" data-id="${art.id}">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="increase" data-id="${art.id}">+</button>
          </div>
        </div>
        <div>
          <strong>${formatCurrency(art.price * item.quantity)}</strong>
          <div style="margin-top: 0.35rem;"><button class="icon-btn" type="button" data-action="remove" data-id="${art.id}">✕</button></div>
        </div>`;
      cartItems.appendChild(row);
    });
    updateTotals();
  }

  function updateTotals() {
    const subtotal = state.cart.reduce((sum, item) => {
      const art = artworkData.find((entry) => entry.id === item.id);
      return sum + (art ? art.price * item.quantity : 0);
    }, 0);
    const shipping = subtotal > 0 ? 1500 : 0;
    const tax = Math.round(subtotal * 0.08);
    const grand = subtotal + shipping + tax;

    cartSubtotal.textContent = formatCurrency(subtotal);
    cartShipping.textContent = formatCurrency(shipping);
    cartTax.textContent = formatCurrency(tax);
    cartGrand.textContent = formatCurrency(grand);

    summarySubtotal.textContent = formatCurrency(subtotal);
    summaryShipping.textContent = formatCurrency(shipping);
    summaryTax.textContent = formatCurrency(tax);
    summaryGrand.textContent = formatCurrency(grand);
    cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function toggleCart(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !cartPanel.classList.contains('open');
    cartPanel.classList.toggle('open', shouldOpen);
    overlay.classList.toggle('show', shouldOpen);
  }

  function openModal(id) {
    const art = artworkData.find((item) => item.id === id);
    if (!art) return;
    modalBody.innerHTML = `
      <img src="${art.image}" alt="${art.name}">
      <div>
        <p class="eyebrow">Quick View</p>
        <h3>${art.name}</h3>
        <p><strong>Artist:</strong> Ndambo Arts</p>
        <p><strong>Medium:</strong> ${art.medium}</p>
        <p><strong>Description:</strong> ${art.description}</p>
        <p><strong>Dimensions:</strong> ${art.size}</p>
        <p><strong>Estimated Delivery:</strong> 5–10 business days</p>
        <p><strong>Availability:</strong> ${art.availability}</p>
        <p style="font-size: 1.2rem; font-weight: 700; margin-top: 0.7rem;">${formatCurrency(art.price)}</p>
        <button class="btn btn-primary add-to-cart" data-id="${art.id}" type="button">Add to Cart</button>
      </div>`;
    quickViewModal.classList.add('open');
    quickViewModal.setAttribute('aria-hidden', 'false');
  }

  function closeModalFn() {
    quickViewModal.classList.remove('open');
    quickViewModal.setAttribute('aria-hidden', 'true');
  }

  function addToCart(id) {
    const existing = state.cart.find((item) => item.id === id);
    if (existing) existing.quantity += 1; else state.cart.push({ id, quantity: 1 });
    saveState();
    renderCart();
    showToast('Added to Cart');
  }

  function toggleFavorite(id) {
    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter((item) => item !== id);
    } else {
      state.favorites.push(id);
    }
    saveState();
    renderArtworks();
    showToast(state.favorites.includes(id) ? 'Added to Favorites' : 'Removed from Favorites');
  }

  function updateCommissionProgress() {
    const totalSteps = commissionSteps.length;
    const progress = Math.round((state.commissionStep / totalSteps) * 100);
    progressBar.innerHTML = `<span style="width:${progress}%"></span>`;
    progressLabels.innerHTML = commissionSteps.map((label, index) => `<span>${index + 1}. ${label}</span>`).join('');
  }

  function renderCommissionSteps() {
    const panels = Array.from(document.querySelectorAll('.step-panel'));
    panels.forEach((panel) => panel.classList.toggle('active', Number(panel.dataset.step) === state.commissionStep));
    prevStep.classList.toggle('hidden', state.commissionStep === 1);
    nextStep.classList.toggle('hidden', state.commissionStep === commissionSteps.length);
    submitCommission.classList.toggle('hidden', state.commissionStep !== commissionSteps.length);
    updateCommissionProgress();
  }

  function handleStep(direction) {
    const nextStepIndex = state.commissionStep + direction;
    if (nextStepIndex < 1 || nextStepIndex > commissionSteps.length) return;
    state.commissionStep = nextStepIndex;
    renderCommissionSteps();
  }

  function estimateCommission() {
    const formData = new FormData(commissionForm);
    const sizeValue = formData.get('size') || '';
    const base = 5000;
    const sizeMultiplier = sizeValue.includes('A0') || sizeValue.includes('100 × 120') ? 2.2 : sizeValue.includes('A1') || sizeValue.includes('80 × 100') ? 1.9 : sizeValue.includes('A2') || sizeValue.includes('60 × 90') ? 1.5 : sizeValue.includes('A3') || sizeValue.includes('50 × 70') ? 1.2 : 1;
    const styleMultiplier = formData.get('style') === 'Realistic' ? 1.4 : formData.get('style') === 'Abstract' ? 1.1 : 1;
    const budgetMultiplier = formData.get('budget') && formData.get('budget').includes('50,000') ? 1.7 : formData.get('budget') && formData.get('budget').includes('20,000') ? 1.4 : 1;
    const estimate = Math.round(base * sizeMultiplier * styleMultiplier * budgetMultiplier);
    estimateValue.textContent = formatCurrency(estimate);
  }

  function saveCommissionDraft() {
    const formData = new FormData(commissionForm);
    const values = Object.fromEntries(formData.entries());
    state.commissionData = { ...state.commissionData, ...values, step: state.commissionStep };
    saveState();
    showToast('Commission Draft Saved');
  }

  function scheduleCommissionSave() {
    if (commissionDraftTimer) clearTimeout(commissionDraftTimer);
    commissionDraftTimer = setTimeout(() => {
      saveCommissionDraft();
    }, 700);
  }

  function populateCommissionFromStorage() {
    const stored = JSON.parse(localStorage.getItem('ndambo-commission') || '{}');
    if (!stored || Object.keys(stored).length === 0) return;
    Object.entries(stored).forEach(([key, value]) => {
      const input = commissionForm.elements.namedItem(key);
      if (!input) return;
      if (input.type === 'radio') {
        const radio = Array.from(commissionForm.querySelectorAll(`input[name="${key}"]`)).find((el) => el.value === value);
        if (radio) radio.checked = true;
      } else if (input.type === 'file') {
        return;
      } else {
        input.value = value;
      }
    });
    state.commissionStep = stored.step || 1;
    renderCommissionSteps();
    estimateCommission();
  }

  function buildCommissionEmail() {
    const formData = new FormData(commissionForm);
    const values = Object.fromEntries(formData.entries());
    const lines = [
      '--------------------------------------------------',
      'NEW COMMISSION REQUEST',
      '',
      'Customer Name:', values.customerName || '',
      'Email:', values.customerEmail || '',
      'Phone:', values.customerPhone || '',
      'Country:', values.customerCountry || '',
      'Artwork Type:', values.artworkType || '',
      'Medium:', values.artworkType || '',
      'Canvas Size:', values.size || '',
      'Orientation:', values.orientation || '',
      'Style:', values.style || '',
      'Background:', values.background || '',
      'Subjects:', values.subjects || '',
      'Colour Style:', values.colourStyle || '',
      'Budget:', values.budget || '',
      'Delivery Method:', values.delivery || '',
      'Deadline:', values.deadline || '',
      'Additional Notes:', values.notes || '',
      '',
      'Please contact me regarding this commission.',
      '--------------------------------------------------'
    ];
    return encodeURIComponent(lines.join('\n'));
  }

function parseBudget(budgetValue) {
  if (!budgetValue) return null;

  const number = parseFloat(
    budgetValue.replace(/[^0-9.]/g, '')
  );

  return Number.isFinite(number) ? number : null;
}

function getCurrentCommissionEstimate() {
  const text = estimateValue.textContent || '';

  const number = parseFloat(
    text.replace(/[^0-9.]/g, '')
  );

  return Number.isFinite(number) ? number : null;
}
  async function handleCommissionSubmit(event) {
  event.preventDefault();

  const formData = new FormData(commissionForm);
  const values = Object.fromEntries(formData.entries());

  const referenceFiles = Array.from(referenceImages.files || []);

  const commissionRequest = {
    name: values.customerName || '',
    email: values.customerEmail || '',
    phone: values.customerPhone || '',

    customer_country: values.customerCountry || '',

    artwork_type: values.artworkType || '',
    size: values.size || '',

    orientation: values.orientation || '',
    style: values.style || '',
    background: values.background || '',
    subjects: values.subjects || '',
    colour_style: values.colourStyle || '',

    budget: parseBudget(values.budget),
    currency: 'KES',

    delivery: values.delivery || '',
    deadline: values.deadline || '',

    description: values.notes || 'No additional notes provided.',

    estimated_price: getCurrentCommissionEstimate(),

    reference_image_names: referenceFiles
      .map(file => file.name)
      .join(', '),

    status: 'new'
  };

  submitCommission.disabled = true;
  submitCommission.textContent = 'Sending...';

  try {
  const { error } = await supabaseClient
  .from('commission_requests')
  .insert([commissionRequest]);

    if (error) {
      console.error('Supabase commission error:', error);
      throw error;
    }

    console.log('Commission request saved:', data);

    showToast('Commission request sent successfully!');

    localStorage.removeItem('ndambo-commission');

    setTimeout(() => {
      alert(
        'Thank you! Your commission request has been received. ' +
        'Stephen will contact you soon.'
      );
    }, 300);

  } catch (error) {
    console.error(error);

    showToast('Could not send request');

    alert(
      'Something went wrong while sending your commission request. ' +
      'Please try again.'
    );

  } finally {
    submitCommission.disabled = false;
    submitCommission.textContent = 'Submit Commission Request';
  }
}

  function handleCheckoutSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const values = Object.fromEntries(formData.entries());
    const itemLines = state.cart.map((item) => {
      const art = artworkData.find((entry) => entry.id === item.id);
      return `${art ? art.name : 'Artwork'} | Qty: ${item.quantity} | Price: ${formatCurrency(art ? art.price : 0)} | Subtotal: ${formatCurrency((art ? art.price : 0) * item.quantity)}`;
    }).join('\n');

    const subtotal = state.cart.reduce((sum, item) => {
      const art = artworkData.find((entry) => entry.id === item.id);
      return sum + (art ? art.price * item.quantity : 0);
    }, 0);
    const shipping = subtotal > 0 ? 1500 : 0;
    const tax = Math.round(subtotal * 0.08);
    const grand = subtotal + shipping + tax;

    const emailBody = [
      'NEW ARTWORK PURCHASE',
      '',
      'Customer Information',
      'Name:', values.fullName || '',
      'Email:', values.email || '',
      'Phone:', values.phone || '',
      'Country:', values.country || '',
      'City:', values.city || '',
      'Delivery Address:', values.address || '',
      '',
      'Purchased Items',
      itemLines || 'No items selected',
      '',
      'Subtotal:', formatCurrency(subtotal),
      'Shipping:', formatCurrency(shipping),
      'Tax:', formatCurrency(tax),
      'Grand Total:', formatCurrency(grand),
      '',
      'Special Instructions:', values.instructions || '',
      '',
      'Please contact me regarding this order.'
    ].join('\n');

    const subject = `New Artwork Purchase - ${values.fullName || 'Customer'}`;
    window.location.href = `mailto:sndambuki155@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    showToast('Order email opened');
  }

  function initEvents() {
    searchInput.addEventListener('input', (event) => {
      state.query = event.target.value;
      renderArtworks();
    });

    sortSelect.addEventListener('change', (event) => {
      state.sort = event.target.value;
      renderArtworks();
    });

    filterBar.addEventListener('click', (event) => {
      const button = event.target.closest('.filter-chip');
      if (!button) return;
      document.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.remove('active'));
      button.classList.add('active');
      state.activeFilter = button.dataset.filter;
      renderArtworks();
    });

    cartToggle.addEventListener('click', () => toggleCart(true));
    closeCart.addEventListener('click', () => toggleCart(false));
    overlay.addEventListener('click', () => toggleCart(false));
    closeModal.addEventListener('click', closeModalFn);
    quickViewModal.addEventListener('click', (event) => {
      if (event.target === quickViewModal) closeModalFn();
    });

    document.addEventListener('click', (event) => {
      const interactive = event.target.closest('.btn, .filter-chip, .icon-btn, .cart-trigger, .favorite-btn');
      if (interactive) {
        createRipple({ currentTarget: interactive, clientX: event.clientX, clientY: event.clientY });
      }

      const favoriteButton = event.target.closest('.favorite-btn');
      if (favoriteButton) {
        event.preventDefault();
        favoriteButton.classList.add('animating');
        setTimeout(() => favoriteButton.classList.remove('animating'), 280);
        toggleFavorite(Number(favoriteButton.dataset.id));
        return;
      }
      const quickViewButton = event.target.closest('.quick-view');
      if (quickViewButton) {
        openModal(Number(quickViewButton.dataset.id));
        return;
      }
      const addToCartButton = event.target.closest('.add-to-cart');
      if (addToCartButton) {
        addToCart(Number(addToCartButton.dataset.id));
        return;
      }
      const cartActionButton = event.target.closest('[data-action]');
      if (cartActionButton) {
        const action = cartActionButton.dataset.action;
        const id = Number(cartActionButton.dataset.id);
        const target = state.cart.find((item) => item.id === id);
        if (!target) return;
        if (action === 'increase') {
          target.quantity += 1;
        } else if (action === 'decrease') {
          target.quantity = Math.max(1, target.quantity - 1);
        } else if (action === 'remove') {
          state.cart = state.cart.filter((item) => item.id !== id);
        }
        saveState();
        renderCart();
        return;
      }
    });

    prevStep.addEventListener('click', () => handleStep(-1));
    nextStep.addEventListener('click', () => handleStep(1));
    commissionForm.addEventListener('input', () => {
      estimateCommission();
      scheduleCommissionSave();
    });
    commissionForm.addEventListener('change', () => {
      estimateCommission();
      scheduleCommissionSave();
    });
    commissionForm.addEventListener('submit', handleCommissionSubmit);
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);

    referenceImages.addEventListener('change', (event) => {
      const files = Array.from(event.target.files || []);
      state.commissionImages = files;
      previewHolder.innerHTML = '';
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const img = document.createElement('img');
        img.src = url;
        previewHolder.appendChild(img);
      });
    });

    document.getElementById('sizeSelect').addEventListener('change', (event) => {
      customSizeFields.classList.toggle('show', event.target.value === 'Custom Size');
    });

    document.querySelector('.nav-toggle').addEventListener('click', () => {
      const links = document.querySelector('.nav-links');
      links.classList.toggle('active');
    });
  }

  function init() {
    renderArtworks();
    renderCart();
    updateTotals();
    renderCommissionSteps();
    populateCommissionFromStorage();
    initEvents();
    updateCommissionProgress();
  }

  init();
})();
