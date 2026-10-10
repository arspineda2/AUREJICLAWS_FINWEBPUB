const loginForm = document.getElementById('loginForm');
const otpForm = document.getElementById('otpForm');

// Submit Login Credentials
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.success) {
    loginForm.style.display = 'none';
    otpForm.style.display = 'block';
  } else {
    alert(data.message);
  }
});

// Submit OTP Code
otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const userOTP = document.getElementById('otpInput').value;

  const res = await fetch('/admin/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userOTP })
  });

  const data = await res.json();
  if (data.success) {
    // Redirect to the protected admin page
    window.location.href = data.redirectUrl;
  } else {
    alert(data.message);
  }
});