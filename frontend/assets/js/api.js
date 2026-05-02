// assets/js/api.js
// =============================================
// SHARED API HELPER
// All fetch calls to backend go through here
// =============================================

const API_BASE = 'https://ecom-websites-backend.onrender.com';

// Get the saved token from browser storage
function getToken() {
  return localStorage.getItem('prachiToken');
}

// Get the saved user object
function getUser() {
  const u = localStorage.getItem('prachiUser');
  return u ? JSON.parse(u) : null;
}

// Check if user is logged in
function isLoggedIn() {
  return !!getToken();
}

// Save login data
function saveAuth(token, user) {
  localStorage.setItem('prachiToken', token);
  localStorage.setItem('prachiUser', JSON.stringify(user));
}

// Clear login data (logout)
function clearAuth() {
  localStorage.removeItem('prachiToken');
  localStorage.removeItem('prachiUser');
}

// ---- Core fetch helper ----
// Automatically adds Authorization header if token exists
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
    const data = await response.json();

    // If token expired, force logout
    if (response.status === 401) {
      clearAuth();
      updateNavbar();
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, data: { message: 'Cannot connect to server. Is backend running?' } };
  }
}

// ---- Convenience methods ----
const api = {
  get:    (url)          => apiRequest(url),
  post:   (url, body)    => apiRequest(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body)    => apiRequest(url, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (url)          => apiRequest(url, { method: 'DELETE' })
};

// =============================================
// NAVBAR: update Sign In / Sign Up based on login state
// =============================================
function updateNavbar() {
  const signInUp = document.querySelector('.sign_in_up');
  const cartEl   = document.getElementById('cartvalue');
  if (!signInUp) return;

  const user = getUser();
  if (user) {
    signInUp.innerHTML = `
      <span style="font-weight:500">Hi, ${user.name.split(' ')[0]} 👋</span>
      <a href="orders.html">My Orders</a>
      <a href="#" onclick="logout(); return false;">LOGOUT</a>
    `;
  } else {
    signInUp.innerHTML = `
      <a href="login.html">SIGN IN</a>
      <a href="signup.html">SIGN UP</a>
    `;
  }

  // Update cart count
  updateCartCount();
}

async function updateCartCount() {
  const cartEl = document.getElementById('cartvalue');
  if (!cartEl) return;

  if (!isLoggedIn()) {
    cartEl.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> 0`;
    return;
  }

  const res = await api.get('/cart');
  if (res.ok) {
    const count = res.data.items ? res.data.items.reduce((s, i) => s + i.quantity, 0) : 0;
    cartEl.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> ${count}`;
  }
}

async function logout() {
  await api.post('/auth/logout', {});
  clearAuth();
  updateNavbar();
  window.location.href = 'index.html';
}

// Run on every page load
document.addEventListener('DOMContentLoaded', updateNavbar);
