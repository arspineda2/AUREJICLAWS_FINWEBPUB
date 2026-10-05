/* =========================================================
  ANGEL TEMPORARY SCRIPT.JS | 10-05-26 

AUREJI CLAWS — Shop + Cart + Checkout Modal (front-end only)

   This file is front-end only — no real database yet. Cart items
   live in a plain JS array (lost on page refresh). Every place
   that should eventually talk to the database is marked with a
   "BACKEND HOOK" comment, and the data shape used there matches
   your ERD field names (PressOn, OrderSummary, OrderItems,
   OrderPayments) so your friend can wire it up directly.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     STATE
     cart items use ProductID (matches PressOn.ProductID) as id.
  --------------------------------------------------------- */
  let cart = [];              // { ProductID, ProductName, Price, img, Quantity }
  let selectedProduct = null; // the single product currently in the checkout modal
  let selectedCartIndex = null;

  /* ---------------------------------------------------------
     ELEMENT REFERENCES
  --------------------------------------------------------- */
  const cartIconBtn    = document.getElementById('cartIconBtn');
  const cartPanel       = document.getElementById('cartPanel');
  const cartItemsEl     = document.getElementById('cartItems');
  const cartCountEl     = document.getElementById('cartCount');
  const cartRemoveBtn   = document.getElementById('cartRemoveBtn');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

  const filterBtn   = document.getElementById('filterBtn');
  const filterMenu  = document.getElementById('filterMenu');
  const productGrid = document.getElementById('productGrid');

  const modal         = document.getElementById('checkoutModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const stepLabels    = document.querySelectorAll('.step-label');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');

  const orderItemPreview = document.getElementById('orderItemPreview');
  const addressForm = document.getElementById('addressForm');
  const paymentForm = document.getElementById('paymentForm');

  /* ---------------------------------------------------------
     Helper: read a product's data straight off its card
     (stand-in for a real PressOn row until the DB exists)
  --------------------------------------------------------- */
  function getProductFromCard(card) {
    return {
      ProductID: card.dataset.id,
      ProductName: card.dataset.name,
      Price: Number(card.dataset.price),
      img: card.querySelector('img').getAttribute('src'),
    };
  }

  /* ---------------------------------------------------------
     "ADD TO CART" ICON (small button beside Buy Now)
     Adds the item to the cart array WITHOUT opening the modal.
  --------------------------------------------------------- */
  document.querySelectorAll('.cart-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const product = getProductFromCard(card);
      addToCart(product);

      // small visual confirmation
      btn.classList.add('just-added');
      setTimeout(() => btn.classList.remove('just-added'), 600);
    });
  });

  function addToCart(product) {
    const existing = cart.find(i => i.ProductID === product.ProductID);
    if (existing) {
      existing.Quantity += 1;
    } else {
      cart.push({ ...product, Quantity: 1 });
    }
    renderCart();
  }

  /* ---------------------------------------------------------
     "BUY NOW" — skips the cart entirely and opens the
     checkout modal directly with just this one product.
  --------------------------------------------------------- */
  document.querySelectorAll('.buy-now-overlay').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const product = getProductFromCard(card);
      selectedProduct = { ...product, Quantity: 1 };
      selectedCartIndex = null; // not from the cart, so nothing to remove on place-order
      openModal();
    });
  });

  /* ---------------------------------------------------------
     CART ICON (header) — toggles the dropdown panel
  --------------------------------------------------------- */
  cartIconBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cartPanel.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!cartPanel.contains(e.target) && e.target !== cartIconBtn) {
      cartPanel.classList.add('hidden');
    }
    if (!filterMenu.contains(e.target) && e.target !== filterBtn) {
      filterMenu.classList.add('hidden');
    }
  });

  /* ---------------------------------------------------------
     FILTER / SORT DROPDOWN
     NOTE: "Best Selling" sorting needs real order data from the
     database (count of OrderItems per ProductID) — the shuffle
     below is just a visual placeholder until that exists.
  --------------------------------------------------------- */
  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    filterMenu.classList.toggle('hidden');
  });

  document.querySelectorAll('.filter-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const sortType = opt.dataset.sort;
      const cards = Array.from(productGrid.children);

      if (sortType === 'latest') {
        // assumes cards are already latest-first in the HTML
      } else if (sortType === 'bestselling') {
        // BACKEND HOOK: replace with real sales-count sorting
        // (e.g. COUNT(OrderItems.OrderItemID) GROUP BY ProductID)
        cards.sort(() => Math.random() - 0.5); // placeholder
      } else if (sortType === 'availability') {
        cards.sort((a, b) => {
          const aSold = a.classList.contains('sold-out') ? 1 : 0;
          const bSold = b.classList.contains('sold-out') ? 1 : 0;
          return aSold - bSold;
        });
      }

      cards.forEach(c => productGrid.appendChild(c));
      filterMenu.classList.add('hidden');
    });
  });

  /* ---------------------------------------------------------
     CART RENDERING
  --------------------------------------------------------- */
  function renderCart() {
    cartItemsEl.innerHTML = '';

    if (cart.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty-state">
          <i class="ti ti-shopping-bag-x"></i>
          <p class="cart-empty-msg">Your cart is empty.</p>
          <p class="cart-empty-submsg">Add your favorites now!</p>
        </div>
      `;
      cartRemoveBtn.disabled = true;
      cartCheckoutBtn.disabled = true;
      cartCountEl.textContent = '0';
      return;
    }

    cart.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.dataset.index = index;
      row.innerHTML = `
        <img src="${item.img}" alt="${item.ProductName}">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.ProductName}</p>
          <p class="cart-item-price">₱${item.Price} <span class="cart-item-qty">x${item.Quantity}</span></p>
        </div>
      `;
      row.addEventListener('click', () => {
        selectedCartIndex = index;
        document.querySelectorAll('.cart-item-row').forEach(r => r.style.background = '');
        row.style.background = '#FFD1E0';
        cartRemoveBtn.disabled = false;
        cartCheckoutBtn.disabled = false;
      });
      cartItemsEl.appendChild(row);
    });

    const totalQty = cart.reduce((sum, i) => sum + i.Quantity, 0);
    cartCountEl.textContent = totalQty;
  }

  cartRemoveBtn.addEventListener('click', () => {
    if (selectedCartIndex !== null) {
      cart.splice(selectedCartIndex, 1);
      selectedCartIndex = null;
      renderCart();
    }
  });

  // "Check Out" in the cart panel -> opens the checkout modal
  // for the currently selected cart item.
  cartCheckoutBtn.addEventListener('click', () => {
    if (selectedCartIndex !== null) {
      selectedProduct = cart[selectedCartIndex];
      cartPanel.classList.add('hidden');
      openModal();
    }
  });

  renderCart(); // initial render -> shows the empty state

  /* ---------------------------------------------------------
     CHECKOUT MODAL — STEP NAVIGATION
     This is a separate overlay container. It only becomes
     visible when openModal() runs (Buy Now, or cart Check Out).
  --------------------------------------------------------- */
  function openModal() {
    if (!selectedProduct) return;

    orderItemPreview.innerHTML = `
      <img src="${selectedProduct.img}" alt="${selectedProduct.ProductName}">
      <div>
        <p class="oi-name">${selectedProduct.ProductName}</p>
        <p class="oi-price">₱${selectedProduct.Price}</p>
        <p class="oi-meta">1pc set</p>
      </div>
    `;

    goToStep(1);
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
    addressForm.reset();
    paymentForm.reset();
    selectedProduct = null;
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  function goToStep(stepNum) {
    [step1, step2, step3].forEach(s => s.classList.add('hidden'));
    document.getElementById('step' + stepNum).classList.remove('hidden');

    stepLabels.forEach(label => {
      label.classList.toggle('active', Number(label.dataset.step) === stepNum);
    });
  }

  /* ---------------------------------------------------------
     STEP 1 -> STEP 2  (Address form submit)
     Builds the OrderSummary + OrderItems payload shape.
  --------------------------------------------------------- */
  let pendingOrder = null; // holds order data between step 1 and step 2

  addressForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const consentChecked = document.getElementById('consentCheckbox').checked;
    if (!consentChecked) {
      alert('Please agree to the data collection notice before proceeding.');
      return;
    }

    // Shape matches your OrderSummary + OrderItems tables.
    // OrderID / OrderToken / Status / CreatedAt are DB-generated,
    // so they're left out here and would come back from the server.
    pendingOrder = {
      orderSummary: {
        FullName: document.getElementById('fullName').value,
        Email: document.getElementById('email').value,
        ContactNo: document.getElementById('contactNo').value,
        Address: document.getElementById('address').value,
        Notes: document.getElementById('notes1').value,
        // Status: will default to "Pending Payment" server-side
      },
      orderItems: [
        {
          ProductID: selectedProduct.ProductID,
          Quantity: selectedProduct.Quantity || 1,
          PriceAtOrder: selectedProduct.Price,
        }
      ]
    };

    // BACKEND HOOK:
    // This is a good point to create the OrderSummary + OrderItems
    // rows (Status = "Pending Payment"), so you have an OrderID to
    // attach the payment proof to in Step 2.
    // Example:
    // const res = await fetch('/api/orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(pendingOrder)
    // });
    // const { OrderID, OrderToken } = await res.json();
    // pendingOrder.OrderID = OrderID;

    console.log('Order summary + items (replace with real backend call):', pendingOrder);

    goToStep(2);
  });

  /* ---------------------------------------------------------
     STEP 2 -> STEP 3  (Payment proof form submit)
     Builds the OrderPayments payload shape.
  --------------------------------------------------------- */
  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const orderPayment = {
      // OrderID: pendingOrder.OrderID  (once the backend returns it from Step 1)
      ReferenceNumber: document.getElementById('refNumber').value,
      DateSent: document.getElementById('dateSent').value,
      TimeSent: document.getElementById('timeSent').value,
      UploadedScreenshot: document.getElementById('proofUpload').files[0] || null,
      Notes: document.getElementById('notes2').value,
      // Status: defaults to "Pending" until verified by the team
    };

    // BACKEND HOOK:
    // This is the real "place order" moment — send the payment
    // proof tied to the OrderID created in Step 1. Since there's
    // a file upload, this needs FormData rather than plain JSON.
    // Example:
    // const formData = new FormData();
    // formData.append('OrderID', pendingOrder.OrderID);
    // formData.append('ReferenceNumber', orderPayment.ReferenceNumber);
    // formData.append('DateSent', orderPayment.DateSent);
    // formData.append('TimeSent', orderPayment.TimeSent);
    // formData.append('UploadedScreenshot', orderPayment.UploadedScreenshot);
    // formData.append('Notes', orderPayment.Notes);
    // fetch('/api/orders/payment', { method: 'POST', body: formData });

    console.log('Order payment (replace with real backend call):', orderPayment);

    // If this order came from the cart, remove that item now that
    // the order has been placed.
    if (selectedCartIndex !== null) {
      cart.splice(selectedCartIndex, 1);
      selectedCartIndex = null;
      renderCart();
    }

    pendingOrder = null;
    goToStep(3);
  });

});