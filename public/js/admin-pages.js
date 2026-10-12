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

// Client-side image compression helper to bypass Vercel's 4.5MB payload limit
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }));
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
  });
}

async function adminUploadImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Choose an image file.');
  }

  // Automatically compress large images before sending to prevent 413 Payload Too Large
  if (file.size > 2 * 1024 * 1024) {
    try {
      file = await compressImage(file);
    } catch (err) {
      console.error('Image compression failed, proceeding with original file:', err);
    }
  }

  const form = new FormData();
  form.append('image', file);
  const result = await adminRequest('/api/media', { method: 'POST', body: form });
  return result.url;
}