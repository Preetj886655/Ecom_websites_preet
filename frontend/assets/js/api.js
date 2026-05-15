// assets/js/api.js
// =============================================
// SHARED API HELPER
// =============================================

// Auto-detects local vs deployed environment
const isLocal = window.location.hostname === 'localhost'
             || window.location.hostname === '127.0.0.1';

// FIX: Use full backend URL for production (two separate Render services)
const API_BASE = isLocal
  ? 'http://localhost:5000/api'
  : 'https://ecom-websites-backend.onrender.com/';

// ---- Auth helpers ----
function getToken() {
  return localStorage.getItem('prachiToken');
}

function getUser() {
  const u = localStorage.getItem('prachiUser');
  return u ? JSON.parse(u) : null;
}

function isLoggedIn() {
  return !!getToken();
}

function saveAuth(token, user) {
  localStorage.setItem('prachiToken', token);
  localStorage.setItem('prachiUser', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('prachiToken');
  localStorage.removeItem('prachiUser');
}

// ---- Core fetch helper ----
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

    if (response.status === 401) {
      clearAuth();
      updateNavbar();
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API Error:', error.message);
    return {
      ok: false,
      data: { message: 'Cannot connect to server. Backend may be starting up — please wait 30 seconds and refresh.' }
    };
  }
}

// ---- Convenience methods ----
const api = {
  get:    (url)       => apiRequest(url),
  post:   (url, body) => apiRequest(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body) => apiRequest(url, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (url)       => apiRequest(url, { method: 'DELETE' })
};

// ---- NAVBAR: update based on login state ----
function updateNavbar() {
  const signInUp = document.querySelector('.sign_in_up');
  if (!signInUp) return;

  const user = getUser();
  if (user) {
    signInUp.innerHTML = `
      <span style="font-weight:500;color:rgba(255,255,255,0.9)">Hi, ${user.name.split(' ')[0]} 👋</span>
      <a href="orders.html">My Orders</a>
      <a href="#" onclick="logout(); return false;">LOGOUT</a>
    `;
  } else {
    signInUp.innerHTML = `
      <a href="login.html">SIGN IN</a>
      <a href="signup.html">SIGN UP</a>
    `;
  }

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
    const count = res.data.items
      ? res.data.items.reduce((s, i) => s + i.quantity, 0)
      : 0;
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
