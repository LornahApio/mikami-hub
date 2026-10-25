/**
 * checkout.js — Order submission & WhatsApp bridge
 */

import { db } from '../../data/db.js';
import { ksh, esc, formatWhatsAppOrder } from '../../utils/utils.js';
import { openModal, closeModal } from '../../components/shared/modal.js';
import { getCart, getCartTotal, clearCart } from '../../components/shared/cart.js';

const MIKAMI_PHONE = '254700000000'; // ← Replace with real WhatsApp number

export function openCheckout() {
  const cart = getCart();
  const total = getCartTotal();
  const retailers = db.getRetailers();

  if (cart.length === 0) return;

  openModal(`
    <div class="flex justify-between items-center" style="margin-bottom:20px">
      <h2 style="font-weight:800;font-size:1.1rem">🧾 Checkout</h2>
      <button class="modal-close btn btn-ghost" style="min-height:36px;padding:0 12px">✕</button>
    </div>

    <div class="input-group">
      <label for="co-retailer">Select Buyer Account (optional)</label>
      <select class="input" id="co-retailer">
        <option value="">— Walk-in / New Customer —</option>
        ${retailers.map(r => `<option value="${r.id}">${esc(r.business_name)}</option>`).join('')}
      </select>
    </div>

    <div class="input-group">
      <label for="co-name">Buyer Name *</label>
      <input class="input" id="co-name" type="text" placeholder="e.g. Brian Wanjiku" required />
    </div>

    <div class="input-group">
      <label for="co-phone">Phone (WhatsApp) *</label>
      <input class="input" id="co-phone" type="tel" placeholder="e.g. 0712345678" required />
    </div>

    <div class="input-group">
      <label for="co-delivery">Delivery Preference</label>
      <select class="input" id="co-delivery">
        <option value="Pickup">Pickup from Warehouse</option>
        <option value="Delivery">Delivery (within Nairobi)</option>
      </select>
    </div>

    <div class="card" style="margin-bottom:16px;background:var(--color-surface-2)">
      ${cart.map(i => `
        <div class="flex justify-between text-sm" style="padding:4px 0">
          <span>${esc(i.product.name)} ×${i.quantity}</span>
          <span style="font-weight:600">${ksh(i.product.wholesale_price * i.quantity)}</span>
        </div>
      `).join('')}
      <div class="flex justify-between fw-700" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--color-border)">
        <span>Total</span><span style="color:var(--color-accent)">${ksh(total)}</span>
      </div>
    </div>

    <div class="flex flex-col gap-8">
      <button class="btn btn-success w-full" id="co-whatsapp-btn">📲 Submit via WhatsApp</button>
      <button class="btn btn-primary w-full" id="co-submit-btn">✅ Confirm Order (Internal)</button>
    </div>
  `);

  document.getElementById('co-retailer').addEventListener('change', function () {
    const r = retailers.find(x => x.id === this.value);
    if (r) {
      document.getElementById('co-name').value = r.contact_person;
      document.getElementById('co-phone').value = r.phone_number;
    }
  });

  document.getElementById('co-whatsapp-btn').addEventListener('click', () => {
    const order = collectOrder(cart, total);
    if (!order) return;
    const saved = db.createOrder(order, buildItems(cart));
    const items = db.getOrderItems(saved.id);
    const products = db.getProducts();
    const msg = formatWhatsAppOrder(saved, items, products);
    window.open(`https://wa.me/${MIKAMI_PHONE}?text=${msg}`, '_blank');
    clearCart();
    closeModal();
  });

  document.getElementById('co-submit-btn').addEventListener('click', () => {
    const order = collectOrder(cart, total);
    if (!order) return;
    db.createOrder(order, buildItems(cart));
    clearCart();
    closeModal(() => {
      document.querySelector('[data-tab="dispatch"]')?.click();
    });
  });
}

function collectOrder(cart, total) {
  const name  = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const retailer_id = document.getElementById('co-retailer').value || null;
  const delivery = document.getElementById('co-delivery').value;
  if (!name || !phone) { alert('Please fill in buyer name and phone.'); return null; }
  return { retailer_id, buyer_name: name, buyer_phone: phone, delivery_preference: delivery, total_amount: total, notes: '' };
}

function buildItems(cart) {
  return cart.map(i => ({
    product_id: i.product.id,
    quantity_packs: i.quantity,
    unit_price: i.product.wholesale_price,
    subtotal: i.product.wholesale_price * i.quantity,
  }));
}
