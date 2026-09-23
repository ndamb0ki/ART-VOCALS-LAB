// =====================================================
// NDAMBUKI ART LAB — HOMEPAGE CART
// =====================================================

(function () {
  "use strict";

  const CART_KEY = "ndambo-cart";

  const cartToggle =
    document.getElementById("homeCartToggle");

  const cartCount =
    document.getElementById("homeCartCount");

  const cartDrawer =
    document.getElementById("homeCartDrawer");

  const cartOverlay =
    document.getElementById("homeCartOverlay");

  const cartClose =
    document.getElementById("homeCartClose");

  const cartItems =
    document.getElementById("homeCartItems");

  const cartQuantity =
    document.getElementById("homeCartQuantity");


  // -----------------------------------------------------
  // GET CART
  // -----------------------------------------------------

  function getCart() {

    try {

      return JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      );

    } catch (error) {

      console.error(
        "Could not read Ndambuki cart:",
        error
      );

      return [];
    }
  }


  // -----------------------------------------------------
  // GET TOTAL QUANTITY
  // -----------------------------------------------------

  function getTotalQuantity(cart) {

    return cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 1),
      0
    );
  }


  // -----------------------------------------------------
  // UPDATE CART BADGE
  // -----------------------------------------------------

  function updateCartBadge() {

    const cart = getCart();

    const quantity =
      getTotalQuantity(cart);

    if (cartCount) {

      cartCount.textContent = quantity;

      cartCount.classList.toggle(
        "has-items",
        quantity > 0
      );
    }

    if (cartQuantity) {
      cartQuantity.textContent = quantity;
    }
  }


  // -----------------------------------------------------
  // RENDER HOMEPAGE CART
  // -----------------------------------------------------

  function renderCart() {

    const cart = getCart();

    updateCartBadge();

    if (!cartItems) return;


    if (!cart.length) {

      cartItems.innerHTML = `
        <div class="home-cart-empty-state">

          <span class="home-cart-empty-icon">
            ✦
          </span>

          <h3>Your cart is empty.</h3>

          <p>
            Find something worth hanging
            on your wall.
          </p>

          <a href="html/shop.html">
            EXPLORE THE WORK ↗
          </a>

        </div>
      `;

      return;
    }


    cartItems.innerHTML = `
      <div class="home-cart-summary">

        <span>
          YOU HAVE
        </span>

        <strong>
          ${getTotalQuantity(cart)}
          ${
            getTotalQuantity(cart) === 1
              ? "ARTWORK"
              : "ARTWORKS"
          }
        </strong>

        <p>
          Your selected artwork is waiting
          for you in the gallery.
        </p>

      </div>

      <a
        href="html/shop.html"
        class="home-cart-view-full"
      >
        VIEW FULL CART
        <span>↗</span>
      </a>
    `;
  }


  // -----------------------------------------------------
  // OPEN CART
  // -----------------------------------------------------

  function openCart() {

    renderCart();

    cartDrawer?.classList.add("open");
    cartOverlay?.classList.add("show");

    cartDrawer?.setAttribute(
      "aria-hidden",
      "false"
    );

    cartToggle?.setAttribute(
      "aria-expanded",
      "true"
    );

    document.body.classList.add(
      "cart-open"
    );
  }


  // -----------------------------------------------------
  // CLOSE CART
  // -----------------------------------------------------

  function closeCartDrawer() {

    cartDrawer?.classList.remove("open");
    cartOverlay?.classList.remove("show");

    cartDrawer?.setAttribute(
      "aria-hidden",
      "true"
    );

    cartToggle?.setAttribute(
      "aria-expanded",
      "false"
    );

    document.body.classList.remove(
      "cart-open"
    );
  }


  // -----------------------------------------------------
  // EVENTS
  // -----------------------------------------------------

  cartToggle?.addEventListener(
    "click",
    openCart
  );

  cartClose?.addEventListener(
    "click",
    closeCartDrawer
  );

  cartOverlay?.addEventListener(
    "click",
    closeCartDrawer
  );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {
        closeCartDrawer();
      }

    }
  );


  // Update when localStorage changes
  window.addEventListener(
    "storage",
    event => {

      if (event.key === CART_KEY) {
        renderCart();
      }

    }
  );


  // -----------------------------------------------------
  // INITIAL LOAD
  // -----------------------------------------------------

  renderCart();

})();
