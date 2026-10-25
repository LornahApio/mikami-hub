/**
 * utils.js — Shared helper utilities
 */

/** Format number as KSh currency */
export function ksh(amount) {
  return `KSh ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

/** Stock status badge HTML */
export function stockBadge(product) {
  if (product.current_stock === 0)
    return `<span class="badge badge-red">Sold Out</span>`;
  if (product.current_stock <= product.low_stock_threshold)
    return `<span class="badge badge-yellow">Low Stock</span>`;
  return `<span class="badge badge-green">In Stock</span>`;
}

/** Order status badge HTML */
export function statusBadge(status) {
  const map = {
    pending:    ['badge-blue',   'Pending'],
    confirmed:  ['badge-blue',   'Confirmed'],
    packing:    ['badge-yellow', 'Packing'],
    dispatched: ['badge-green',  'Dispatched'],
    completed:  ['badge-green',  'Completed'],
    cancelled:  ['badge-red',    'Cancelled'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

/** Payment status badge HTML */
export function payBadge(status) {
  const map = {
    paid:    ['badge-green',  'Paid'],
    partial: ['badge-yellow', 'Partial'],
    unpaid:  ['badge-red',    'Unpaid'],
  };
  const [cls, label] = map[status] || ['badge-muted', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

/** Format WhatsApp message for an order */
export function formatWhatsAppOrder(order, items, products) {
  const lines = items.map(item => {
    const p = products.find(x => x.id === item.product_id);
    return `  • ${p?.name || 'Item'} x${item.quantity_packs} packs — ${ksh(item.subtotal)}`;
  }).join('\n');

  return encodeURIComponent(
    `🛒 *Mikami Solutions — Order ${order.order_number}*\n` +
    `📅 ${new Date(order.created_at).toLocaleString('en-KE')}\n\n` +
    `*Buyer:* ${order.buyer_name}\n` +
    `*Phone:* ${order.buyer_phone}\n` +
    `*Delivery:* ${order.delivery_preference}\n\n` +
    `*Items:*\n${lines}\n\n` +
    `*Total: ${ksh(order.total_amount)}*\n` +
    `Status: ${order.payment_status === 'paid' ? '✅ Paid' : '⏳ Awaiting Payment'}`
  );
}

/** Escape HTML to prevent XSS */
export function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Generate unique short ID */
export function uid() { return crypto.randomUUID().slice(0,8); }
