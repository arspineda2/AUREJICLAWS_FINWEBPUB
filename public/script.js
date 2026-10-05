/* =========================================================
   AUREJI CLAWS | PRESS-ON CART AND CHECKOUT

   This file runs in the browser. It sends checkout form data to
   the Express API, but never connects directly to MongoDB Atlas.
========================================================= */

document.addEventListener("components:loaded", initializeCheckout, { once: true });

function initializeCheckout() {
  const productGrid = document.getElementById("productGrid");
  const modal = document.getElementById("checkoutModal");
  const addressForm = document.getElementById("addressForm");
  const paymentForm = document.getElementById("paymentForm");

  if (!productGrid || !modal || !addressForm || !paymentForm) {
    console.error("Checkout could not start: required product or modal elements are missing.");
    return;
  }

  const cartIconBtn = document.getElementById("cartIconBtn");
  const cartPanel = document.getElementById("cartPanel");
  const cartItemsEl = document.getElementById("cartItems");
  const cartCountEl = document.getElementById("cartCount");
  const cartRemoveBtn = document.getElementById("cartRemoveBtn");
  const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
  const filterBtn = document.getElementById("filterBtn");
  const filterMenu = document.getElementById("filterMenu");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const stepLabels = [...document.querySelectorAll(".step-label")];
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const orderItemPreview = document.getElementById("orderItemPreview");
  const confirmationBox = document.getElementById("orderConfirmationDetails");
  const fileInput = document.getElementById("proofUpload");
  const fileNameDisplay = document.getElementById("fileNameDisplay");

  if ([cartIconBtn, cartPanel, cartItemsEl, cartCountEl, cartRemoveBtn, cartCheckoutBtn,
    filterBtn, filterMenu, modalCloseBtn, step1, step2, step3, orderItemPreview,
    confirmationBox, fileInput, fileNameDisplay].some((element) => !element)) {
    console.error("Checkout could not start: one or more required cart or checkout elements are missing.");
    return;
  }

  // Cart state exists in this browser tab only; the server receives it at checkout.
  let cart = [];
  let selectedProduct = null;
  let selectedCartIndex = null;

  function readProduct(card) {
    return {
      productId: card.dataset.id,
      productName: card.dataset.name,
      price: Number(card.dataset.price),
      image: card.querySelector(".product-img-wrap > img").getAttribute("src")
    };
  }

  function renderCart() {
    cartItemsEl.replaceChildren();
    cartCountEl.textContent = String(cart.reduce((count, item) => count + item.quantity, 0));
    cartRemoveBtn.disabled = selectedCartIndex === null;
    cartCheckoutBtn.disabled = selectedCartIndex === null;

    if (cart.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "cart-empty-msg";
      emptyMessage.textContent = "Your cart is empty.";
      cartItemsEl.appendChild(emptyMessage);
      return;
    }

    cart.forEach((item, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "cart-item-row";
      row.setAttribute("aria-pressed", String(index === selectedCartIndex));

      const image = document.createElement("img");
      image.src = item.image;
      image.alt = "";

      const details = document.createElement("span");
      details.className = "cart-item-info";
      const name = document.createElement("span");
      name.className = "cart-item-name";
      name.textContent = item.productName;
      const price = document.createElement("span");
      price.className = "cart-item-price";
      price.textContent = `₱${item.price} × ${item.quantity}`;
      details.append(name, price);
      row.append(image, details);

      if (index === selectedCartIndex) row.style.background = "#FFD1E0";
      row.addEventListener("click", () => {
        selectedCartIndex = index;
        renderCart();
      });
      cartItemsEl.appendChild(row);
    });
  }

  function addToCart(product) {
    const existingItem = cart.find((item) => item.productId === product.productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    renderCart();
  }

  // Add-to-cart changes only the temporary cart; Buy Now opens checkout directly.
  productGrid.querySelectorAll(".cart-add-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      if (card) addToCart(readProduct(card));
    });
  });

  productGrid.querySelectorAll(".buy-now-overlay").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      if (!card) return;
      selectedProduct = { ...readProduct(card), quantity: 1 };
      selectedCartIndex = null;
      openCheckout();
    });
  });

  cartIconBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    cartPanel.classList.toggle("hidden");
  });

  cartPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  cartRemoveBtn.addEventListener("click", () => {
    if (selectedCartIndex === null) return;
    cart.splice(selectedCartIndex, 1);
    selectedCartIndex = null;
    renderCart();
  });

  cartCheckoutBtn.addEventListener("click", () => {
    if (selectedCartIndex === null || !cart[selectedCartIndex]) return;
    selectedProduct = { ...cart[selectedCartIndex] };
    cartPanel.classList.add("hidden");
    openCheckout();
  });

  // Close popovers when clicking outside them.
  document.addEventListener("click", (event) => {
    if (!cartPanel.contains(event.target) && !cartIconBtn.contains(event.target)) {
      cartPanel.classList.add("hidden");
    }
    if (!filterMenu.contains(event.target) && !filterBtn.contains(event.target)) {
      filterMenu.classList.add("hidden");
    }
  });

  filterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    filterMenu.classList.toggle("hidden");
  });

  // Sort the displayed cards. Best-selling order needs real sales analytics,
  // so until that exists it keeps the page's current order.
  document.querySelectorAll(".filter-option").forEach((option) => {
    option.addEventListener("click", () => {
      const cards = [...productGrid.children];
      if (option.dataset.sort === "availability") {
        cards.sort((first, second) => Number(first.classList.contains("sold-out"))
          - Number(second.classList.contains("sold-out")));
      }
      cards.forEach((card) => productGrid.appendChild(card));
      filterMenu.classList.add("hidden");
    });
  });

  function openCheckout() {
    addressForm.reset();
    paymentForm.reset();
    confirmationBox.replaceChildren();
    fileNameDisplay.textContent = "No file chosen";
    step1.classList.remove("hidden");
    step2.classList.add("hidden");
    step3.classList.add("hidden");
    updateStepIndicators(1);

    const lineItems = selectedProduct ? [selectedProduct] : cart;
    orderItemPreview.replaceChildren();
    lineItems.forEach((item) => {
      const line = document.createElement("p");
      line.textContent = `${item.productName} × ${item.quantity} — ₱${item.price * item.quantity}`;
      orderItemPreview.appendChild(line);
    });
    modal.classList.remove("hidden");
  }

  function closeCheckout() {
    modal.classList.add("hidden");
    addressForm.reset();
    paymentForm.reset();
    selectedProduct = null;
    selectedCartIndex = null;
    renderCart();
  }

  modalCloseBtn.addEventListener("click", closeCheckout);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeCheckout();
  });

  function updateStepIndicators(activeStep) {
    stepLabels.forEach((label, index) => {
      const isActive = index + 1 === activeStep;
      label.classList.toggle("active", isActive);
      label.setAttribute("aria-current", isActive ? "step" : "false");
    });
  }

  // Keep the address step in the browser until payment is submitted.
  // No customer data is sent to Atlas until the final checkout request.
  addressForm.addEventListener("submit", (event) => {
    event.preventDefault();
    step1.classList.add("hidden");
    step2.classList.remove("hidden");
    updateStepIndicators(2);
  });

  fileInput.addEventListener("change", () => {
    fileNameDisplay.textContent = fileInput.files[0]?.name || "No file chosen";
  });

  // Send both forms' values and the image in one multipart request.
  // The backend rechecks the product IDs and prices before saving to Atlas.
  paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedProduct) {
      alert("Choose a product or select a cart item before checking out.");
      return;
    }

    const paymentButton = paymentForm.querySelector('[type="submit"]');
    paymentButton.disabled = true;

    const formData = new FormData(paymentForm);
    for (const [name, value] of new FormData(addressForm)) {
      formData.append(name, value);
    }
    formData.append("items", JSON.stringify([{
      productId: selectedProduct.productId,
      quantity: selectedProduct.quantity
    }]));

    try {
      const response = await fetch("/api/orders/place-order", {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The order could not be saved.");
      }

      // Use text nodes rather than HTML strings for server/customer-provided values.
      const orderIdLine = document.createElement("p");
      orderIdLine.textContent = `Order ID: ${result.orderId}`;
      const totalLine = document.createElement("p");
      totalLine.textContent = `Order total: ₱${result.totalAmount}`;
      confirmationBox.replaceChildren(orderIdLine, totalLine);

      step2.classList.add("hidden");
      step3.classList.remove("hidden");
      updateStepIndicators(3);

      if (selectedCartIndex !== null) {
        cart.splice(selectedCartIndex, 1);
      }
      selectedCartIndex = null;
      selectedProduct = null;
      renderCart();
    } catch (error) {
      console.error("Checkout submission failed:", error);
      alert(error.message);
    } finally {
      paymentButton.disabled = false;
    }
  });

  renderCart();
}
