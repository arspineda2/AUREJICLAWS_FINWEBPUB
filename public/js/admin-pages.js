async function adminPageLogout(event) {
  event.preventDefault();

  try {
    const response = await fetch('/admin/logout', { method: 'POST' });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Could not log out.');
    }
    window.location.href = result.redirectUrl || '/login.html';
  } catch (error) {
    console.error('Admin logout failed:', error);
    alert(error.message || 'Could not log out.');
  }
}

async function adminRequest(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed with status ${response.status}.`);
  }
  return result;
}

async function adminUploadImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Choose an image file.');
  }
  const form = new FormData();
  form.append('image', file);
  const result = await adminRequest('/api/media', { method: 'POST', body: form });
  return result.url;
}
