/* =========================================================
   A. AUTHENTICATION & SESSION GATE LOGIC
   ========================================================= */
function initAdminPage() {
  document.getElementById("dashboardApp").style.display = "flex";
  initDashboardComponents();
}

document.addEventListener("DOMContentLoaded", initAdminPage);

async function handlePortalLogout() {
  try {
    const res = await fetch('/admin/logout', { method: 'POST' });
    const data = await res.json();
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }
  } catch (err) {
    console.error('Logout failed:', err);
  }
}

/* =========================================================
   DASHBOARD STATE & DATA CONTROLS
   ========================================================= */
const defaultData = {
  heroSlides: [
    {
      title: "Amethyst Fang",
      description: "Inspired by the deep sea and its untamed beauty, Amethyst Fang blends deep ocean blues with dreamy amethyst purples for a set that feels both mysterious and enchanting. Delicate butterfly accents flutter across a shark-inspired edge, capturing the perfect balance of soft and fierce.",
      buttonText: "Shop Now",
      photo: "photos/herosecimg.png"
    },
    {
      title: "Bring Aureji Claws to Your Next Event",
      description: "Whether it's a campus fair, a pop-up market, or a brand collaboration, we'd love to set up shop at your event. Contact us or send an email to book Aureji Claws for your next booth.",
      buttonText: "Get in Touch",
      photo: "photos/herosecimg2.png"
    },
    {
      title: "Made by Hand. Made for You.",
      description: "Each set is crafted just for you — sized, styled, and ready to slay.",
      buttonText: "",
      photo: "photos/herosecimg3.png"
    }
  ],
  instagramPosts: [
    { id: 1, type: "reel", tag: "View Reel", link: "https://instagram.com/aurejiclaws", photo: "photos/reel.png" },
    { id: 2, type: "post", tag: "View Post", link: "https://www.instagram.com/p/DXel9ykkcB5/?u", photo: "photos/igpost-one.png" },
    { id: 3, type: "post", tag: "View Post", link: "https://www.instagram.com/p/DdE-oU_5Emh/?i", photo: "photos/igpost-two.png" },
    { id: 4, type: "post", tag: "View Post", link: "https://www.instagram.com/p/DXel9ykkcB5/?u", photo: "photos/igpost-three.png" },
    { id: 5, type: "post", tag: "View Post", link: "https://instagram.com/aurejiclaws", photo: "photos/igpost-four.png" },
    { id: 6, type: "post", tag: "View Post", link: "https://instagram.com/aurejiclaws", photo: "photos/igpost-five.png" }
  ],
  products: [
    { id: "presson-one", name: "Amethyst Fang", price: 1000, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", photo: "photos/presson-one.png", status: "available" },
    { id: "presson-two", name: "Starlit Nails", price: 500, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", photo: "photos/presson-two.png", status: "available" },
    { id: "presson-three", name: "Deep Sea", price: 600, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", photo: "photos/presson-three.png", status: "available" },
    { id: "presson-four", name: "Lush Green By Ersa", price: 1000, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", photo: "photos/presson-four.png", status: "sold-out" },
    { id: "presson-five", name: "Mocha Muse", price: 500, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", photo: "photos/presson-five.png", status: "available" },
    { id: "presson-six", name: "Cat Eye Nails", price: 400, description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.", photo: "photos/presson-six.png", status: "available" }
  ],
  orders: []
};

let appState = { ...defaultData };
let currentHeroIndex = 0;
let selectedIgIndex = 0;

//Order Management
async function renderOrders() {
  const container = document.getElementById('ordersContent');
  if (!container) return;

  container.textContent = 'Loading orders...';

  try {
    const response = await fetch('/api/orders');
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.orders)) {
      throw new Error(data.message || 'The orders could not be loaded.');
    }

    if (data.orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <h3 class="empty-title">No orders placed yet</h3>
          <p class="empty-desc">Orders submitted at checkout will appear here.</p>
        </div>
      `;
      return;
    }

    const list = document.createElement('div');
    list.className = 'admin-orders-list';

    data.orders.forEach((order) => {
      const card = document.createElement('article');
      card.className = 'admin-order-card';

      const header = document.createElement('div');
      header.className = 'admin-order-header';
      const title = document.createElement('h3');
      title.textContent = `Order #${order._id}`;
      
      const status = document.createElement('span');
      status.className = 'admin-order-status';
      status.textContent = order.status || 'Pending';
      header.append(title, status);

      const details = document.createElement('div');
      details.className = 'admin-order-details';
      const addDetail = (label, value) => {
        const line = document.createElement('p');
        const labelNode = document.createElement('strong');
        labelNode.textContent = `${label}: `;
        line.append(labelNode, document.createTextNode(value || '—'));
        details.appendChild(line);
      };

      addDetail('Customer', `${order.customerName || 'Customer'} (${order.customerEmail || 'No email'})`);
      addDetail('Contact', order.contactNo);
      addDetail('Address', order.address);
      addDetail('GCash reference', order.gcashRefNumber);

      const itemsHeading = document.createElement('strong');
      itemsHeading.textContent = 'Items';
      const itemsList = document.createElement('ul');
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const itemLine = document.createElement('li');
        itemLine.textContent = `${item.productName} × ${item.quantity} — ₱${item.unitPrice * item.quantity}`;
        itemsList.appendChild(itemLine);
      });
      details.append(itemsHeading, itemsList);
      addDetail('Total', `₱${order.totalAmount}`);
      if (order.createdAt) {
        addDetail('Placed', new Date(order.createdAt).toLocaleString());
      }

      const content = document.createElement('div');
      content.className = 'admin-order-content';
      content.appendChild(details);

      if (order.paymentScreenshot) {
        const proof = document.createElement('a');
        proof.className = 'admin-order-proof';
        proof.href = order.paymentScreenshot;
        proof.target = '_blank';
        proof.rel = 'noopener noreferrer';
        proof.setAttribute('aria-label', 'Open GCash payment screenshot');
        const image = document.createElement('img');
        image.src = order.paymentScreenshot;
        image.alt = 'GCash payment screenshot';
        proof.appendChild(image);
        content.appendChild(proof);
      }

      card.append(header, content);

      // Render both Approve and Reject buttons if the order status is Pending
      if (order.status === 'Pending') {
        const actions = document.createElement('div');
        actions.className = 'admin-order-actions';
        
        // Approve Button
        const approveButton = document.createElement('button');
        approveButton.type = 'button';
        approveButton.className = 'btn-approve';
        approveButton.textContent = 'Approve Payment';
        approveButton.addEventListener('click', () => approvePayment(order._id, approveButton));

        // Reject Button
        const rejectButton = document.createElement('button');
        rejectButton.type = 'button';
        rejectButton.className = 'btn-reject';
        rejectButton.textContent = 'Reject';
        rejectButton.style.backgroundColor = '#d9534f';
        rejectButton.style.color = '#fff';
        rejectButton.style.marginLeft = '8px';
        rejectButton.addEventListener('click', () => rejectPayment(order._id, rejectButton));

        actions.append(approveButton, rejectButton);
        card.appendChild(actions);
      }

      list.appendChild(card);
    });

    container.replaceChildren(list);
  } catch (error) {
    console.error('Failed to load admin orders:', error);
    const message = document.createElement('p');
    message.className = 'admin-orders-error';
    message.textContent = error.message || 'The orders could not be loaded.';
    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'btn-update';
    retryButton.textContent = 'Retry';
    retryButton.addEventListener('click', renderOrders);
    container.replaceChildren(message, retryButton);
  }
}

let syncBroadcast;
try {
  syncBroadcast = new BroadcastChannel('aureji_claws_sync_channel');
  syncBroadcast.onmessage = (event) => {
    if (event.data && event.data.type === 'NEW_ORDER') {
      appState.orders.unshift(event.data.order);
      saveState();
      renderOrders();
      showToast('New customer order received!');
    }
  };
} catch (e) {
  console.warn('BroadcastChannel not available in this browser');
}

function initDashboardComponents() {
  loadState();
  loadHeroSlide(0);
  renderAdminIgGrid();
  loadIgForm(0);
  renderProductCards();
  loadProductForm("presson-one");
  renderOrders();
  renderClientView();
}

/* Sidebar controls */
function toggleSidebarGroup(sublistId, btn) {
  const sublist = document.getElementById(sublistId);
  const arrow = btn.querySelector('.sidebar-arrow');
  if (sublist.style.display === 'none' || sublist.style.display === '') {
    sublist.style.display = 'flex';
    arrow.classList.add('open');
  } else {
    sublist.style.display = 'none';
    arrow.classList.remove('open');
  }
}

function switchPage(pageKey) {
  const panels = ['panelHero', 'panelInstagram', 'panelProducts', 'panelOrders', 'panelBookings', 'panelPlaceholder'];
  panels.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = 'none';
  });

  document.querySelectorAll('.sidebar-subitem').forEach(item => item.classList.remove('active'));

  if (pageKey === 'hero') {
    document.getElementById('panelHero').style.display = 'block';
    document.getElementById('subitem-hero').classList.add('active');
  } else if (pageKey === 'instagram') {
    document.getElementById('panelInstagram').style.display = 'block';
    document.getElementById('subitem-ig').classList.add('active');
    renderAdminIgGrid();
  } else if (pageKey === 'products') {
    document.getElementById('panelProducts').style.display = 'block';
    document.getElementById('subitem-products').classList.add('active');
    renderProductCards();
  } else if (pageKey === 'orders') {
    document.getElementById('panelOrders').style.display = 'block';
    document.getElementById('subitem-orders').classList.add('active');
    renderOrders();
  } else if (pageKey === 'bookings') {
    document.getElementById('panelBookings').style.display = 'block';
    document.getElementById('subitem-bookings').classList.add('active');
    renderBookings();
  }
}

function showEmptyNotice(title) {
  const panels = ['panelHero', 'panelInstagram', 'panelProducts', 'panelOrders'];
  panels.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = 'none';
  });
  document.querySelectorAll('.sidebar-subitem').forEach(item => item.classList.remove('active'));

  const ph = document.getElementById('panelPlaceholder');
  ph.style.display = 'block';
  document.getElementById('placeholderTitle').textContent = title;
  document.getElementById('placeholderMsg').textContent = `No ${title} entries yet`;
}

function applyImgFallback(img, label) {
  img.onerror = null;
  img.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect fill='%23EDE8DE' width='300' height='300'/><text fill='%237B88B4' font-family='serif' font-size='16' font-weight='600' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'>${encodeURIComponent(label)}</text></svg>`;
}

/* Hero Management */
function selectHeroSlide(idx) {
  currentHeroIndex = idx;
  [0, 1, 2].forEach(i => {
    const chip = document.getElementById(`slideChip${i}`);
    if (chip) chip.className = (i === idx) ? 'hero-slide-chip active' : 'hero-slide-chip';
  });
  loadHeroSlide(idx);
}

function loadHeroSlide(idx) {
  const slide = appState.heroSlides[idx] || defaultData.heroSlides[idx];
  document.getElementById('heroTitleInput').value = slide.title || '';
  document.getElementById('heroBtnTextInput').value = slide.buttonText || '';
  document.getElementById('heroDescInput').value = slide.description || '';
  document.getElementById('heroPhotoInput').value = slide.photo || '';
  updateHeroPreview(slide);
}

function updateHeroPreview(slide) {
  document.getElementById('previewHeroTitle').textContent = slide.title || 'Amethyst Fang';
  document.getElementById('previewHeroDesc').textContent = slide.description || '';
  
  const btn = document.getElementById('previewHeroBtn');
  const btnWrap = document.getElementById('previewHeroBtnWrap');
  if (slide.buttonText && slide.buttonText.trim()) {
    btn.textContent = slide.buttonText;
    btnWrap.style.display = 'block';
  } else {
    btnWrap.style.display = 'none';
  }

  const plate = document.getElementById('heroPlate');
  plate.style.backgroundImage = `url('${slide.photo}')`;
}

function handleHeroLocalFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('heroPhotoInput').value = e.target.result;
      document.getElementById('heroPlate').style.backgroundImage = `url('${e.target.result}')`;
    };
    reader.readAsDataURL(file);
  }
}

function handleHeroUpdate(event) {
  event.preventDefault();
  const updated = {
    title: document.getElementById('heroTitleInput').value.trim(),
    buttonText: document.getElementById('heroBtnTextInput').value.trim(),
    description: document.getElementById('heroDescInput').value.trim(),
    photo: document.getElementById('heroPhotoInput').value.trim() || 'photos/herosecimg.png'
  };

  appState.heroSlides[currentHeroIndex] = updated;
  updateHeroPreview(updated);
  saveState();
  renderClientView();
  showToast('Hero page updated successfully!');
}

/* Instagram Management */
function renderAdminIgGrid() {
  const container = document.getElementById('igGridContainer');
  container.innerHTML = '';

  appState.instagramPosts.forEach((post, index) => {
    const card = document.createElement('div');
    card.className = `ig-card ${index === selectedIgIndex ? 'active' : ''}`;
    card.onclick = () => selectIgCard(index);
    card.innerHTML = `
      <img src="${post.photo}" alt="Post ${index + 1}" onerror="applyImgFallback(this, 'Post ${index + 1}')" />
      <div class="ig-card-badge">Slot ${index + 1}</div>
    `;
    container.appendChild(card);
  });
}

function selectIgCard(index) {
  selectedIgIndex = index;
  loadIgForm(index);
  renderAdminIgGrid();
}

function loadIgForm(index) {
  const post = appState.instagramPosts[index] || defaultData.instagramPosts[index];
  document.getElementById('igLinkInput').value = post.link || '';
  document.getElementById('igPhotoInput').value = post.photo || '';
}

function handleIgLocalFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      showToast('Could not load the selected image.');
      return;
    }
    document.getElementById('igPhotoInput').value = reader.result;
    showToast('Image selected. Click Update to save this post slot.');
  };
  reader.onerror = () => showToast('Could not load the selected image.');
  reader.readAsDataURL(file);
}

function handleIgUpdate(event) {
  event.preventDefault();
  const updatedPost = {
    ...appState.instagramPosts[selectedIgIndex],
    link: document.getElementById('igLinkInput').value.trim(),
    photo: document.getElementById('igPhotoInput').value.trim()
  };

  appState.instagramPosts[selectedIgIndex] = updatedPost;
  saveState();
  renderAdminIgGrid();
  renderClientView();
  showToast('Instagram post updated successfully!');
}

/* Products Management */
function renderProductCards() {
  const container = document.getElementById('productGridContainer');
  container.innerHTML = '';

  appState.products.forEach(prod => {
    const isSoldOut = prod.status === 'sold-out';
    const card = document.createElement('div');
    const isActive = document.getElementById('prodIdInput').value === prod.id;
    card.className = `admin-prod-card ${isActive ? 'active' : ''}`;
    card.onclick = (e) => {
      if (!e.target.closest('.admin-prod-stock-toggle')) {
        loadProductForm(prod.id);
      }
    };

    card.innerHTML = `
      <div class="admin-prod-img-wrap">
        <img src="${prod.photo}" alt="${prod.name}" onerror="applyImgFallback(this, '${prod.name}')" />
        ${isSoldOut ? '<div class="admin-prod-sold-badge">SOLD</div>' : ''}
      </div>
      <div class="admin-prod-info">
        <h4 class="admin-prod-name">${prod.name}</h4>
        <div class="admin-prod-price">₱${prod.price}</div>
        <p class="admin-prod-desc">${prod.description}</p>
        <div class="admin-prod-stock-toggle">
          <span style="font-size: 0.75rem; color: var(--text-muted);">${isSoldOut ? 'Sold Out' : 'Available'}</span>
          <button type="button" onclick="toggleStockStatus('${prod.id}')" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border-soft); background: #FAF9F5; cursor: pointer;">
            Toggle Status
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function loadProductForm(id) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;

  document.getElementById('prodIdInput').value = prod.id;
  document.getElementById('prodNameInput').value = prod.name;
  document.getElementById('prodPriceInput').value = prod.price;
  document.getElementById('prodPhotoInput').value = prod.photo;
  document.getElementById('prodDescInput').value = prod.description;
  document.getElementById('prodSoldOutInput').checked = (prod.status === 'sold-out');
  document.getElementById('productFormHeading').textContent = `Editing: ${prod.name}`;

  renderProductCards();
}

function resetProductForm() {
  const newId = 'presson-' + Date.now();
  document.getElementById('prodIdInput').value = newId;
  document.getElementById('prodNameInput').value = '';
  document.getElementById('prodPriceInput').value = '';
  document.getElementById('prodPhotoInput').value = 'photos/presson-one.png';
  document.getElementById('prodDescInput').value = '';
  document.getElementById('prodSoldOutInput').checked = false;
  document.getElementById('productFormHeading').textContent = 'Add New Press-on Set';
}

function handleProductUpdate(event) {
  event.preventDefault();
  const id = document.getElementById('prodIdInput').value;
  const name = document.getElementById('prodNameInput').value.trim();
  const price = parseFloat(document.getElementById('prodPriceInput').value) || 0;
  const photo = document.getElementById('prodPhotoInput').value.trim() || 'photos/presson-one.png';
  const description = document.getElementById('prodDescInput').value.trim();
  const status = document.getElementById('prodSoldOutInput').checked ? 'sold-out' : 'available';

  const existingIndex = appState.products.findIndex(p => p.id === id);
  if (existingIndex > -1) {
    appState.products[existingIndex] = { id, name, price, photo, description, status };
  } else {
    appState.products.push({ id, name, price, photo, description, status });
  }

  saveState();
  renderProductCards();
  renderClientView();
  showToast('Product catalog updated!');
}

function toggleStockStatus(id) {
  const prod = appState.products.find(p => p.id === id);
  if (!prod) return;
  prod.status = (prod.status === 'sold-out') ? 'available' : 'sold-out';
  
  if (document.getElementById('prodIdInput').value === id) {
    document.getElementById('prodSoldOutInput').checked = (prod.status === 'sold-out');
  }

  saveState();
  renderProductCards();
  renderClientView();
  showToast(`Status updated to ${prod.status.toUpperCase()}`);
}

/* Live User View Modal */
function openClientModal() {
  renderClientView();
  document.getElementById('clientModal').classList.add('open');
}

function closeClientModal() {
  document.getElementById('clientModal').classList.remove('open');
}

function closeClientModalOnBackdrop(event) {
  if (event.target === document.getElementById('clientModal')) {
    closeClientModal();
  }
}

function switchClientTab(tab) {
  const homeTabBtn = document.getElementById('tabClientHome');
  const shopTabBtn = document.getElementById('tabClientShop');
  const homeSec = document.getElementById('cvHomeSection');
  const shopSec = document.getElementById('cvShopSection');

  if (tab === 'home') {
    homeTabBtn.classList.add('active');
    shopTabBtn.classList.remove('active');
    homeSec.style.display = 'block';
    shopSec.style.display = 'none';
  } else {
    homeTabBtn.classList.remove('active');
    shopTabBtn.classList.add('active');
    homeSec.style.display = 'none';
    shopSec.style.display = 'block';
  }
}

function renderClientView() {
  const activeSlide = appState.heroSlides[0] || defaultData.heroSlides[0];
  const cvHero = document.getElementById('cvHeroSec');
  cvHero.style.backgroundImage = `url('${activeSlide.photo}')`;
  document.getElementById('cvHeroTitle').textContent = activeSlide.title;
  document.getElementById('cvHeroDesc').textContent = activeSlide.description;

  const cvBtnWrap = document.getElementById('cvHeroBtnWrap');
  if (activeSlide.buttonText && activeSlide.buttonText.trim()) {
    document.getElementById('cvHeroBtn').textContent = activeSlide.buttonText;
    cvBtnWrap.style.display = 'block';
  } else {
    cvBtnWrap.style.display = 'none';
  }

  const igGrid = document.getElementById('cvIgGrid');
  igGrid.innerHTML = '';
  appState.instagramPosts.forEach((post, i) => {
    const isReel = (i === 0);
    const item = document.createElement('div');
    item.className = isReel ? 'cv-reel-item' : 'cv-post-item';
    item.innerHTML = `<img src="${post.photo}" alt="Claw Club ${i + 1}" onerror="applyImgFallback(this, 'Post ${i + 1}')" />`;
    igGrid.appendChild(item);
  });

  const shopGrid = document.getElementById('cvShopGrid');
  shopGrid.innerHTML = '';
  appState.products.forEach(prod => {
    const isSold = prod.status === 'sold-out';
    const card = document.createElement('div');
    card.className = 'cv-product-card';
    card.innerHTML = `
      <div class="cv-prod-img-wrap">
        <img src="${prod.photo}" alt="${prod.name}" onerror="applyImgFallback(this, '${prod.name}')" />
        ${isSold ? '<div class="cv-prod-sold">SOLD</div>' : ''}
      </div>
      <h4 class="cv-prod-name">${prod.name}</h4>
      <div class="cv-prod-price">₱${prod.price}</div>
      <p class="cv-prod-desc">${prod.description}</p>
    `;
    shopGrid.appendChild(card);
  });
}

//Bookings Management
async function renderBookings() {
  const container = document.getElementById('bookingsContent');
  if (!container) return;

  container.textContent = 'Loading bookings...';

  try {
    const response = await fetch('/api/bookings');
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.bookings)) {
      throw new Error(data.message || 'The bookings could not be loaded.');
    }

    if (data.bookings.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <h3 class="empty-title">No bookings submitted yet</h3>
          <p class="empty-desc">Customer appointment requests will appear here automatically.</p>
        </div>
      `;
      return;
    }

    const list = document.createElement('div');
    list.className = 'admin-orders-list';

    data.bookings.forEach((booking) => {
      const card = document.createElement('article');
      card.className = 'admin-order-card';

      const header = document.createElement('div');
      header.className = 'admin-order-header';
      const title = document.createElement('h3');
      title.textContent = `${booking.serviceType} — ${booking.name}`;
      
      const status = document.createElement('span');
      status.className = 'admin-order-status';
      status.textContent = booking.status || 'Pending';
      if (booking.status === 'Completed') status.style.color = '#4CAF50';
      if (booking.status === 'Cancelled') status.style.color = '#d9534f';
      header.append(title, status);

      const details = document.createElement('div');
      details.className = 'admin-order-details';
      const addDetail = (label, value) => {
        const line = document.createElement('p');
        const labelNode = document.createElement('strong');
        labelNode.textContent = `${label}: `;
        line.append(labelNode, document.createTextNode(value || '—'));
        details.appendChild(line);
      };

      addDetail('Customer Name', booking.name);
      addDetail('Email', booking.email);
      addDetail('Contact No', booking.contact);
      addDetail('Schedule', `${booking.dateSchedule} at ${booking.timeSlot}`);
      if (booking.remarks) {
        addDetail('Remarks', booking.remarks);
      }
      if (booking.createdAt) {
        addDetail('Requested At', new Date(booking.createdAt).toLocaleString());
      }

      const content = document.createElement('div');
      content.className = 'admin-order-content';
      content.appendChild(details);

      card.append(header, content);

      // Admin Action Menu Board Controls (Change Status)
      const actions = document.createElement('div');
      actions.className = 'admin-order-actions';
      actions.style.display = 'flex';
      actions.style.gap = '6px';
      actions.style.marginTop = '12px';
      actions.style.flexWrap = 'wrap';

      const possibleStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
      possibleStatuses.forEach((st) => {
        if (st !== booking.status) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-update';
          btn.style.fontSize = '0.75rem';
          btn.style.padding = '5px 10px';
          btn.textContent = `Mark as ${st}`;
          btn.addEventListener('click', () => updateBookingStatus(booking._id, st));
          actions.appendChild(btn);
        }
      });

      card.appendChild(actions);
      list.appendChild(card);
    });

    container.replaceChildren(list);
  } catch (error) {
    console.error('Failed to load bookings:', error);
    container.innerHTML = `<p class="admin-orders-error">${error.message || 'Failed to load bookings.'}</p>`;
  }
}

async function updateBookingStatus(bookingId, newStatus) {
  try {
    const response = await fetch(`/api/bookings/status/${bookingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to update booking status.');
    }
    await renderBookings();
    if (result.notificationSent === false) {
      alert(result.message);
    } else {
      showToast(result.message);
    }
  } catch (error) {
    alert(error.message);
  }
}

/* Storage & Toast */
function saveState() {
  try {
    localStorage.setItem('aureji_claws_admin_state', JSON.stringify(appState));
    if (syncBroadcast) {
      syncBroadcast.postMessage({ type: 'SYNC_UPDATE', state: appState });
    }
  } catch (e) {
    console.warn('Storage sync failed', e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('aureji_claws_admin_state');
    if (saved) {
      appState = JSON.parse(saved);
    }
  } catch (e) {
    appState = { ...defaultData };
  }
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('adminToast');
  document.getElementById('toastMessage').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

async function approvePayment(orderId, buttonElement) {
  if (!confirm("Are you sure you verified this GCash reference number and want to approve this order?")) return;

  buttonElement.disabled = true;
  buttonElement.textContent = "Processing...";

  try {
    const response = await fetch(`/api/orders/approve/${orderId}`, { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Payment approval failed.");
    }

    await renderOrders();
    alert("Payment verified! The order has been approved.");
  } catch (error) {
    console.error("Order approval failed:", error);
    alert(error.message || "Failed to submit approval.");
    buttonElement.disabled = false;
    buttonElement.textContent = "Approve Payment & Confirm Order";
  }
}

async function rejectPayment(orderId, buttonElement) {
  if (!confirm("Are you sure you want to reject this order?")) return;

  buttonElement.disabled = true;
  buttonElement.textContent = "Processing...";

  try {
    const response = await fetch(`/api/orders/reject/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Payment could not be verified." })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Order rejection failed.");
    }

    await renderOrders();
    alert(result.message || "Order has been marked as rejected.");
  } catch (error) {
    console.error("Order rejection failed:", error);
    alert(error.message || "Failed to submit rejection.");
    buttonElement.disabled = false;
    buttonElement.textContent = "Reject";
  }
}