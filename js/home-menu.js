// =====================================================
// NDAMBUKI ART LAB — FULL SCREEN MENU
// =====================================================

(function () {
  "use strict";

  const menuToggle =
    document.getElementById("homeMenuToggle");

  const menu =
    document.getElementById("homeMenuOverlay");

  const menuClose =
    document.getElementById("homeMenuClose");


  if (!menuToggle || !menu || !menuClose) {
    console.warn(
      "Ndambuki menu: required elements not found."
    );

    return;
  }


  // ---------------------------------------------------
  // OPEN
  // ---------------------------------------------------

  function openMenu() {

    menu.classList.add("open");

    menu.setAttribute(
      "aria-hidden",
      "false"
    );

    menuToggle.setAttribute(
      "aria-expanded",
      "true"
    );

    document.body.classList.add(
      "menu-open"
    );

  }


  // ---------------------------------------------------
  // CLOSE
  // ---------------------------------------------------

  function closeMenu() {

    menu.classList.remove("open");

    menu.setAttribute(
      "aria-hidden",
      "true"
    );

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    document.body.classList.remove(
      "menu-open"
    );

  }


  // ---------------------------------------------------
  // EVENTS
  // ---------------------------------------------------

  menuToggle.addEventListener(
    "click",
    openMenu
  );


  menuClose.addEventListener(
    "click",
    closeMenu
  );


  // Close when a menu link is selected

  menu
    .querySelectorAll(".home-menu-link")
    .forEach(link => {

      link.addEventListener(
        "click",
        closeMenu
      );

    });


  // ESC closes menu

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        menu.classList.contains("open")
      ) {
        closeMenu();
      }

    }
  );

})();
