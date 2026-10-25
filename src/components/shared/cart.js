/**
 * cart.js — Cart state & drawer renderer (Module A support)
 */

import { ksh, esc } from '../../utils/utils.js';

let cart = []; // [{ product, quantity }]
const MIKAMI_WHATSAPP = '254700000000'; // Replace with real number

const overlay = document.getElementById('cart-overlay');
const drawer  = document.getElementById('cart-drawer');

// -- State --
export function addToCart(product, qty = 1) {
  const existing = cart.find(i => i.product.id === product.id);
  if (existing) existing.quantity += qty;
  else cart.push({ product, quantity: qty });
  renderDrawer();
}

export function removeFromCart(productId) {
  cart = cart.filter(i => i.product.id !== productId);
  renderDrawer();
}

export function updateQty(productId, delta) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  renderDrawer();
}

export function clearCart() { cart = []; renderDrawer(); }

export function getCart() { return cart; }

export function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.product.wholesale_price * i.quantity, 0);
}

export function getCartCount() {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

// -- Drawer UI --
export function openCart() {
  overlay.classList.add('open');
  drawer.classList.add('open');
  renderDrawer();
}

export function closeCart() {
  overlay.classList.remove('open');
  drawer.classList.remove('open');
}

overlay.onclick = closeCart;

function renderDrawer() {
  const count = getCartCount();
  const total = getCartTotal();

  drawer.innerHTML = `
    <div class="flex justify-between items-center" style="padding:16px;border-bottom:1px solid var(--color-border)">
      <h2 style="font-size:1.1rem;font-weight:700">🛒 Cart <span class="badge badge-blue">${count}</span></h2>
      <button class="btn btn-ghost" id="cart-close-btn" style="padding:0 12px;min-height:36px">✕</button>
    </div>

    ${cart.length === 0
      ? `<p class="text-muted" style="padding:24px;text-align:center">Cart is empty</p>`
      : `<div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px">
          ${cart.map(item => `
            <div class="card" style="padding:12px">
              <div class="flex justify-between items-center gap-8">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:0.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(item.product.name)}</div>
                  <div class="text-muted">${ksh(item.product.wholesale_price)} / pack</div>
                </div>
                <div class="stepper">
                  <button data-action="dec" data-id="${item.product.id}">−</button>
                  <span>${item.quantity}</span>
                  <button data-action="inc" data-id="${item.product.id}">+</button>
                </div>
                <button class="btn btn-danger" data-action="remove" data-id="${item.product.id}" style="min-height:36px;padding:0 10px">✕</button>
              </div>
              <div style="text-align:right;font-weight:700;margin-top:6px;color:var(--color-accent)">${ksh(item.product.wholesale_price * item.quantity)}</div>
            </div>
          `).join('')}
        </div>
        <div style="padding:16px;border-top:1px solid var(--color-border)">
          <div class="flex justify-between fw-700" style="font-size:1.05rem;margin-bottom:12px">
            <span>Total</span><span style="color:var(--color-accent)">${ksh(total)}</span>
          </div>
          <button class="btn btn-success w-full" id="cart-checkout-btn">Proceed to Checkout →</button>
        </div>`
    }
  `;

  // Wire events
  document.getElementById('cart-close-btn')?.addEventListener('click', closeCart);
  drawer.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (btn.dataset.action === 'inc')    updateQty(id, 1);
      if (btn.dataset.action === 'dec')    updateQty(id, -1);
      if (btn.dataset.action === 'remove') removeFromCart(id);
    });
  });
  document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
    import('../catalog/checkout.js').then(m => m.openCheckout());
  });
}
