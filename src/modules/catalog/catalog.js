/**
 * catalog.js — Module A: Retailer Quick-Order Portal
 */

import { db } from '../../data/db.js';
import { ksh, stockBadge, esc } from '../../utils/utils.js';
import { addToCart, openCart, getCartCount } from '../../components/shared/cart.js';

const CATEGORIES = ['All', 'Plastics', 'Cleaning', 'Hardware', 'Dry Goods'];

let activeCategory = 'All';
let searchQuery = '';

export function renderCatalog(container) {
  container.innerHTML = `
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h1 style="font-size:1.4rem;font-weight:800">Wholesale Catalog</h1>
      <button class="btn btn-primary" id="open-cart-btn" style="gap:8px">
        🛒 Cart <span class="badge" id="cart-count-badge" style="background:rgba(255,255,255,0.25);color:#fff">${getCartCount()}</span>
      </button>
    </div>

    <div class="search-bar">
      <span>🔍</span>
      <input type="text" id="catalog-search" placeholder="Search products…" autocomplete="off" />
    </div>

    <div class="flex gap-8" id="category-filters" style="flex-wrap:wrap;margin-bottom:16px">
      ${CATEGORIES.map(c => `
        <button class="btn btn-ghost category-btn ${c === activeCategory ? 'active' : ''}"
          data-cat="${c}" id="cat-${c.toLowerCase()}"
          style="min-height:36px;padding:0 14px;font-size:0.82rem">
          ${c}
        </button>
      `).join('')}
    </div>

    <div id="product-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px"></div>
  `;

  renderProducts(container);

  // Search
  container.querySelector('#catalog-search').addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase();
    renderProducts(container);
  });

  // Category filters
  container.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      container.querySelectorAll('.category-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === activeCategory));
      renderProducts(container);
    });
  });

  // Cart button
  container.querySelector('#open-cart-btn').addEventListener('click', openCart);
}

function renderProducts(container) {
  const grid = container.querySelector('#product-grid');
  let products = db.getProducts();

  if (activeCategory !== 'All') products = products.filter(p => p.category === activeCategory);
  if (searchQuery) products = products.filter(p => p.name.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery));

  if (products.length === 0) {
    grid.innerHTML = `<p class="text-muted" style="padding:32px 0">No products found.</p>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="card" style="display:flex;flex-direction:column;gap:10px" id="product-${p.id}">
      <div class="flex justify-between items-center">
        <span class="badge badge-muted" style="font-size:0.7rem">${esc(p.sku)}</span>
        ${stockBadge(p)}
      </div>
      <div style="font-weight:700;font-size:0.95rem;line-height:1.3">${esc(p.name)}</div>
      <div class="text-muted text-sm">${esc(p.category)} · ${p.units_per_pack} units/${p.unit_type}</div>
      <div style="font-size:1.15rem;font-weight:800;color:var(--color-accent)">${ksh(p.wholesale_price)}<span class="text-muted" style="font-size:0.78rem;font-weight:400"> /pack</span></div>
      <div class="flex items-center gap-8" style="margin-top:auto">
        <div class="stepper">
          <button class="qty-dec" data-id="${p.id}">−</button>
          <span class="qty-val" id="qty-${p.id}">1</span>
          <button class="qty-inc" data-id="${p.id}">+</button>
        </div>
        <button class="btn btn-primary" style="flex:1;font-size:0.85rem" data-add="${p.id}"
          ${p.current_stock === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;flex:1;font-size:0.85rem"' : ''}>
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');

  // Wire steppers & add-to-cart
  products.forEach(p => {
    const card = grid.querySelector(`#product-${p.id}`);
    if (!card) return;
    const qtyEl  = card.querySelector(`#qty-${p.id}`);
    let qty = 1;

    card.querySelector('.qty-dec').addEventListener('click', () => { qty = Math.max(1, qty - 1); qtyEl.textContent = qty; });
    card.querySelector('.qty-inc').addEventListener('click', () => { qty = Math.min(p.current_stock || 999, qty + 1); qtyEl.textContent = qty; });
    card.querySelector(`[data-add="${p.id}"]`)?.addEventListener('click', () => {
      addToCart(p, qty);
      updateCartBadge(container);
      openCart();
    });
  });
}

function updateCartBadge(container) {
  const badge = container.querySelector('#cart-count-badge');
  if (badge) badge.textContent = getCartCount();
}
