const bookingsContainer = document.getElementById('bookingsContainer');

function addBookingDetail(container, label, value) {
  const line = document.createElement('p');
  const labelNode = document.createElement('strong');
  labelNode.textContent = `${label}: `;
  line.append(labelNode, document.createTextNode(value || '—'));
  container.appendChild(line);
}

async function renderBookings() {
  bookingsContainer.textContent = 'Loading bookings...';

  try {
    const response = await fetch('/api/bookings');
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.bookings)) {
      throw new Error(data.message || 'The bookings could not be loaded.');
    }

    if (data.bookings.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'bg-white border border-borderSoft rounded-2xl p-16 text-center';
      empty.textContent = 'No booked customer entries yet.';
      bookingsContainer.replaceChildren(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'admin-orders-list';
    data.bookings.forEach((booking) => {
      const card = document.createElement('article');
      card.className = 'booking-card';
      const header = document.createElement('div');
      header.className = 'flex items-start justify-between';
      const title = document.createElement('h3');
      title.className = 'font-alice text-2xl text-dustyPink';
      title.textContent = `${booking.serviceType} — ${booking.name}`;
      const status = document.createElement('span');
      status.className = 'admin-order-status';
      status.textContent = booking.status || 'Pending';
      header.append(title, status);

      const details = document.createElement('div');
      details.className = 'admin-order-details';
      addBookingDetail(details, 'Customer name', booking.name);
      addBookingDetail(details, 'Email', booking.email);
      addBookingDetail(details, 'Contact number', booking.contact);
      addBookingDetail(details, 'Schedule', `${booking.dateSchedule} at ${booking.timeSlot}`);
      if (booking.remarks) addBookingDetail(details, 'Remarks', booking.remarks);
      if (booking.createdAt) {
        addBookingDetail(details, 'Requested at', new Date(booking.createdAt).toLocaleString());
      }
      card.append(header, details);

      const actions = document.createElement('div');
      actions.className = 'admin-order-actions booking-status-actions';
      ['Pending', 'Confirmed', 'Completed', 'Cancelled'].forEach((nextStatus) => {
        if (nextStatus === booking.status) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-update';
        button.textContent = `Mark as ${nextStatus}`;
        button.addEventListener('click', () => updateBookingStatus(booking._id, nextStatus, button));
        actions.appendChild(button);
      });

      // Show Delete button if booking is finished (Completed or Cancelled)
      if (booking.status === 'Completed' || booking.status === 'Cancelled') {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-update';
        deleteBtn.style.backgroundColor = '#d9534f';
        deleteBtn.style.color = '#fff';
        deleteBtn.textContent = 'Delete Booking';
        deleteBtn.addEventListener('click', () => deleteBooking(booking._id, deleteBtn));
        actions.appendChild(deleteBtn);
      }

      if (actions.childElementCount) card.appendChild(actions);
      list.appendChild(card);
    });

    bookingsContainer.replaceChildren(list);
  } catch (error) {
    console.error('Failed to load bookings:', error);
    const message = document.createElement('p');
    message.className = 'admin-orders-error';
    message.textContent = error.message || 'The bookings could not be loaded.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn-update';
    retry.textContent = 'Retry';
    retry.addEventListener('click', renderBookings);
    bookingsContainer.replaceChildren(message, retry);
  }
}

async function updateBookingStatus(bookingId, status, button) {
  button.disabled = true;
  try {
    const response = await fetch(`/api/bookings/status/${bookingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
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
    console.error('Booking status update failed:', error);
    await renderBookings();
    alert(error.message || 'Failed to update booking status.');
  }
}

async function deleteBooking(bookingId, button) {
  if (!confirm("Are you sure you want to remove this booking record?")) return;
  
  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to delete booking.');
    }

    showToast(result.message || 'Booking deleted successfully.');
    await renderBookings();
  } catch (error) {
    console.error('Booking deletion failed:', error);
    button.disabled = false;
    button.textContent = "Delete Booking";
    alert(error.message || 'Failed to delete booking.');
  }
}

document.addEventListener('DOMContentLoaded', renderBookings);