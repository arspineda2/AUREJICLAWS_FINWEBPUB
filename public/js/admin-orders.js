const ordersContainer = document.getElementById('ordersContainer');

function addOrderDetail(container, label, value) {
  const line = document.createElement('p');
  const labelNode = document.createElement('strong');
  labelNode.textContent = `${label}: `;
  line.append(labelNode, document.createTextNode(value || '—'));
  container.appendChild(line);
}

// Fullscreen image preview modal handler
function openImageLightbox(imageSrc) {
  const existingOverlay = document.getElementById('adminImageLightbox');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'adminImageLightbox';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.cursor = 'zoom-out';

  const img = document.createElement('img');
  img.src = imageSrc;
  img.style.maxWidth = '90vw';
  img.style.maxHeight = '90vh';
  img.style.objectFit = 'contain';
  img.style.borderRadius = '12px';
  img.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';

  overlay.appendChild(img);
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

async function renderOrders() {
  if (!ordersContainer) return;
  ordersContainer.textContent = 'Loading orders...';

  try {
    const response = await fetch('/api/orders');
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.orders)) {
      throw new Error(data.message || 'The orders could not be loaded.');
    }

    if (data.orders.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'bg-white border border-borderSoft rounded-2xl p-16 text-center';
      empty.textContent = 'No customer orders yet.';
      ordersContainer.replaceChildren(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'admin-orders-list';

    data.orders.forEach((order) => {
      const card = document.createElement('article');
      card.className = 'booking-card';

      const header = document.createElement('div');
      header.className = 'flex items-start justify-between mb-4';
      
      const title = document.createElement('h3');
      title.className = 'font-alice text-2xl text-dustyPink';
      title.textContent = `Order #${order._id.slice(-6)} — ${order.customerName}`;
      
      const status = document.createElement('span');
      status.className = 'admin-order-status';
      status.textContent = order.status || 'Pending';
      header.append(title, status);

      // Two-column layout container: Left = Customer Info, Right = Payment Screenshot (below Pending)
      const bodyWrapper = document.createElement('div');
      bodyWrapper.className = 'flex flex-col md:flex-row justify-between items-start gap-6';

      const details = document.createElement('div');
      details.className = 'admin-order-details flex-1';
      addOrderDetail(details, 'Customer Name', order.customerName);
      addOrderDetail(details, 'Email', order.customerEmail);
      addOrderDetail(details, 'Contact Number', order.contactNo);
      addOrderDetail(details, 'Delivery Address', order.address);
      addOrderDetail(details, 'Total Amount', `₱${order.totalAmount}`);
      addOrderDetail(details, 'GCash Ref No.', order.gcashRefNumber);
      if (order.createdAt) {
        addOrderDetail(details, 'Ordered At', new Date(order.createdAt).toLocaleString());
      }

      bodyWrapper.appendChild(details);

      // Render payment screenshot preview positioned on the right
      if (order.paymentScreenshot) {
        const proofWrapper = document.createElement('div');
        proofWrapper.className = 'flex flex-col items-start md:items-end';

        const proofLabel = document.createElement('p');
        proofLabel.className = 'text-xs text-textMuted mb-1';
        proofLabel.innerHTML = '<strong>Payment Screenshot</strong> (click to enlarge):';

        const img = document.createElement('img');
        img.src = order.paymentScreenshot;
        img.alt = 'GCash Payment Proof';
        img.style.maxWidth = '220px';
        img.style.maxHeight = '220px';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '8px';
        img.style.cursor = 'pointer';
        img.className = 'border border-borderSoft shadow-sm hover:opacity-90 transition';

        // Open image directly in modal on click
        img.addEventListener('click', () => openImageLightbox(order.paymentScreenshot));

        proofWrapper.append(proofLabel, img);
        bodyWrapper.appendChild(proofWrapper);
      }

      card.append(header, bodyWrapper);

      const actions = document.createElement('div');
      actions.className = 'admin-order-actions mt-4 pt-4 border-t border-borderSoft';

      // If order is pending, show Approve and Reject actions
      if (order.status === 'Pending') {
        const approveBtn = document.createElement('button');
        approveBtn.type = 'button';
        approveBtn.className = 'btn-update';
        approveBtn.style.backgroundColor = '#4CAF50';
        approveBtn.style.color = '#fff';
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', () => approveOrder(order._id, approveBtn));

        const rejectBtn = document.createElement('button');
        rejectBtn.type = 'button';
        rejectBtn.className = 'btn-update';
        rejectBtn.style.backgroundColor = '#d9534f';
        rejectBtn.style.color = '#fff';
        rejectBtn.style.marginLeft = '8px';
        rejectBtn.textContent = 'Reject';
        rejectBtn.addEventListener('click', () => rejectOrder(order._id, rejectBtn));

        actions.append(approveBtn, rejectBtn);
      }

      // If order is finished (Approved or Rejected), show Delete Order button
      if (order.status === 'Approved' || order.status === 'Rejected') {
        const deleteOrderBtn = document.createElement('button');
        deleteOrderBtn.type = 'button';
        deleteOrderBtn.className = 'btn-reject';
        deleteOrderBtn.style.backgroundColor = '#d9534f';
        deleteOrderBtn.style.color = '#fff';
        deleteOrderBtn.style.marginLeft = '8px';
        deleteOrderBtn.textContent = 'Delete Order';
        
        deleteOrderBtn.addEventListener('click', async () => {
          if (!confirm("Are you sure you want to remove this order from the dashboard?")) return;
          
          deleteOrderBtn.disabled = true;
          deleteOrderBtn.textContent = "Deleting...";

          try {
            const res = await fetch(`/api/orders/${order._id}`, { method: 'DELETE' });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message);
            
            showToast(result.message || 'Order removed from dashboard.');
            renderOrders();
          } catch (err) {
            alert(err.message || 'Failed to delete order.');
            deleteOrderBtn.disabled = false;
            deleteOrderBtn.textContent = 'Delete Order';
          }
        });

        actions.appendChild(deleteOrderBtn);
      }

      if (actions.childElementCount) card.appendChild(actions);
      list.appendChild(card);
    });

    ordersContainer.replaceChildren(list);
  } catch (error) {
    console.error('Failed to load orders:', error);
    const message = document.createElement('p');
    message.className = 'admin-orders-error';
    message.textContent = error.message || 'The orders could not be loaded.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn-update';
    retry.textContent = 'Retry';
    retry.addEventListener('click', renderOrders);
    ordersContainer.replaceChildren(message, retry);
  }
}

async function approveOrder(orderId, button) {
  if (!confirm("Are you sure you verified this GCash reference number and want to approve this order?")) return;

  button.disabled = true;
  button.textContent = 'Processing...';

  try {
    const response = await fetch(`/api/orders/approve/${orderId}`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    
    showToast(result.message || 'Order approved successfully.');
    await renderOrders();
  } catch (error) {
    alert(error.message || 'Failed to approve order.');
    button.disabled = false;
    button.textContent = 'Approve';
  }
}

async function rejectOrder(orderId, button) {
  if (!confirm("Are you sure you want to reject this order?")) return;

  button.disabled = true;
  try {
    const response = await fetch(`/api/orders/reject/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Payment could not be verified.' })
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    
    showToast(result.message || 'Order rejected successfully.');
    await renderOrders();
  } catch (error) {
    alert(error.message || 'Failed to reject order.');
    button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', renderOrders);