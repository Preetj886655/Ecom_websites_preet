// assets/js/products.js
// Loads products from backend API and handles Add to Cart

// ---- TOAST NOTIFICATION ----
function showToast(message, type = 'default') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2900);
}

// ---- RENDER STAR RATING ----
function renderStars(rating) {
  const full    = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < full; i++)         stars += '<i class="fa-solid fa-star"></i>';
  if (hasHalf)                            stars += '<i class="fa-solid fa-star-half-stroke"></i>';
  for (let i = full + (hasHalf?1:0); i < 5; i++) stars += '<i class="fa-regular fa-star"></i>';
  return stars;
}

// ---- RENDER PRODUCTS ----
function renderProducts(products, containerId = 'product_container') {
  const container = document.getElementById(containerId);
  const template  = document.getElementById('productTemplate');
  if (!container || !template) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;grid-column:1/-1">
        <i class="fa-solid fa-box-open" style="font-size:40px;color:var(--text-muted);display:block;margin-bottom:12px"></i>
        <p style="color:var(--text-muted)">No products found.</p>
      </div>`;
    return;
  }

  container.innerHTML = '';

  products.forEach((product, index) => {
    const clone = template.content.cloneNode(true);

    // Fill in product data
    clone.querySelector('.category').textContent          = product.category;
    clone.querySelector('.productImage').src              = product.imageUrl;
    clone.querySelector('.productImage').alt              = product.name;
    clone.querySelector('.productName').textContent       = product.name;
    clone.querySelector('.productDescription').textContent= product.description;
    clone.querySelector('.productPrice').textContent      = '₹' + product.price.toLocaleString('en-IN');
    clone.querySelector('.productStock').textContent      = product.stock;
    clone.querySelector('.productRating').innerHTML       = renderStars(product.rating || 4);

    const actualPrice = clone.querySelector('.productActualPrice');
    if (product.originalPrice && product.originalPrice > product.price) {
      actualPrice.textContent = '₹' + product.originalPrice.toLocaleString('en-IN');
      actualPrice.style.textDecoration = 'line-through';
    }

    // Quantity controls
    const qtyEl  = clone.querySelector('.productQuantity');
    const incBtn = clone.querySelector('.cartIncrement');
    const decBtn = clone.querySelector('.cartDecrement');
    let qty = 1;

    incBtn.addEventListener('click', () => {
      if (qty < product.stock) { qty++; qtyEl.textContent = qty; }
    });
    decBtn.addEventListener('click', () => {
      if (qty > 1) { qty--; qtyEl.textContent = qty; }
    });

    // Add to Cart button
    const addBtn = clone.querySelector('.btn-add-cart');
    addBtn.dataset.productId = product._id;

    if (product.stock === 0) {
      addBtn.textContent = 'Out of Stock';
      addBtn.disabled    = true;
    }

    addBtn.addEventListener('click', async () => {
      // Must be logged in to add to cart
      if (!isLoggedIn()) {
        showToast('Please login to add items to cart 🌸', 'error');
        setTimeout(() => window.location.href = 'login.html?redirect=product.html', 1500);
        return;
      }

      addBtn.disabled    = true;
      addBtn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';

      const res = await api.post('/cart/add', {
        productId: product._id,
        quantity:  qty
      });

      if (res.ok) {
        showToast(`${product.name} added to cart! 🛍️`, 'success');
        updateCartCount();
        addBtn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
        setTimeout(() => {
          addBtn.disabled  = false;
          addBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Add to Cart';
          qty = 1;
          qtyEl.textContent = '1';
        }, 1800);
      } else {
        showToast(res.data.message || 'Could not add to cart', 'error');
        addBtn.disabled  = false;
        addBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Add to Cart';
      }
    });

    // Staggered animation delay
    const card = clone.querySelector('.cards');
    if (card) card.style.animationDelay = (index * 0.07) + 's';

    container.appendChild(clone);
  });
}

// ---- LOAD PRODUCTS FROM API ----
async function loadProducts(params = {}) {
  const container = document.getElementById('product_container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;padding:48px;color:var(--text-muted);grid-column:1/-1">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:28px;display:block;margin-bottom:12px"></i>
      Loading beautiful collection...
    </div>`;

  // Build query string
  const query = new URLSearchParams(params).toString();
  const res   = await api.get('/products' + (query ? '?' + query : ''));

  if (res.ok) {
    renderProducts(res.data.products || []);
  } else {
    container.innerHTML = `
      <div style="text-align:center;padding:48px;color:#C62828;grid-column:1/-1">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:28px;display:block;margin-bottom:12px"></i>
        Could not load products. Make sure backend is running at localhost:5000
      </div>`;
  }
}

// ---- LOAD CATEGORIES ----
async function loadCategories() {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;

  const res = await api.get('/products/categories');
  if (!res.ok) return;

  const categoryImages = {
    'Lehengas':    'https://manyavar.scene7.com/is/image/manyavar/WLP_Curate_T1_D_27-03-2025-06-55?$WT_MLP%2FWLP_CurateLook_D$',
    'Sarees':      'https://www.manyavar.com/on/demandware.static/-/Library-Sites-ManyavarSharedLibrary/default/dw1b049f60/styledbymanyavar/STYLED_BY_MOHEY_Landing_D.jpg',
    'Suits':       'https://yashwinibeautyparlour.in/images/slider-bg.jpg',
    'Kurtis':      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgIbSXn06MFxQigzxOJDXHJeRhUXL9fYM15rZIA8dZNDlLeJCpmxfnjaiOsfjwvIk2zwA&usqp=CAU',
    'Accessories': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTe1R3Qo7BKO021XDz0IxJQV6WC5vmh_4PW2g&s',
  };

  const categories = (res.data.categories || []).filter(c => c !== 'All');

  container.innerHTML = '';
  categories.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'Lehengas-set';
    div.innerHTML = `
      <div class="extra-img">
        <img src="${categoryImages[cat] || categoryImages['Lehengas']}" alt="${cat}">
      </div>
      <div class="extra-text"><h2>${cat}</h2></div>`;
    div.addEventListener('click', () => {
      window.location.href = `product.html?category=${encodeURIComponent(cat)}`;
    });
    container.appendChild(div);
  });
}

// ---- INIT ----
// Guard checks prevent errors on pages that don't have these elements
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('categoriesContainer')) {
    loadCategories();
  }
  if (document.getElementById('product_container') && document.getElementById('productTemplate')) {
    loadProducts();
  }
});
