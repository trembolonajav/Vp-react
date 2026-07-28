(() => {
  "use strict";

  const modal = document.querySelector("#support-modal");
  const openButton = document.querySelector("[data-open-support]");
  const closeButton = modal?.querySelector("[data-close-support]");

  if (!modal || !openButton) return;

  openButton.addEventListener("click", () => {
    if (!modal.open) modal.showModal();
  });

  closeButton?.addEventListener("click", () => modal.close());

  modal.addEventListener("click", event => {
    if (event.target === modal) modal.close();
  });

  modal.addEventListener("cancel", event => {
    event.preventDefault();
    modal.close();
  });
})();
