/**
 * dispatch.js — Module B: Warehouse Picking & Dispatch Queue
 */

import { db } from '../../data/db.js';
import { ksh, statusBadge, payBadge, esc } from '../../utils/utils.js';
import { openModal, closeModal } from '../../components/shared/modal.js';

const STAGES = ['pending', 'packing', 'dispatched', 'completed'];
const STAGE_LABELS = { pending: '🕐 New Orders', packing: '📦 In Packing', dispatched: '🚚 Dispatched', completed: '✅ Completed' };

export function renderDispatch(container) {
  const orders = db.getOrders();

  container.innerHTML = `
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h1 style="font-size:1.4rem;font-weight:800">Dispatch Queue</h1>
      <span class="badge badge-blue">${orders.filter(o => o.status === 'pending').length} pending</span>
    </div>

    <div class="kanban" id="dispatch-kanban">
      ${STAGES.map(stage => `
        <div class="kanban-col">
          <div class="kanban-col-title">${STAGE_LABELS[stage]}</div>
          <div id="col-${stage}">
            ${orders.filter(o => o.status === stage).map(o => orderCard(o)).join('') || '<p class="text-muted text-sm">Empty</p>'}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Wire order cards
  container.querySelectorAll('.dispatch-card').forEach(card => {
    card.addEventListener('click', () => openOrderDetail(card.dataset.id, container));
  });
}

function orderCard(o) {
  return `
    <div class="card dispatch-card" data-id="${o.id}" style="cursor:pointer;margin-bottom:8px;transition:border-color 0.2s"
      onmouseenter="this.style.borderColor='var(--color-primary)'" onmouseleave="this.style.borderColor='var(--color-border)'">
      <div class="flex justify-between items-center" style="margin-bottom:6px">
        <span style="font-weight:700;font-size:0.85rem">${esc(o.order_number)}</span>
        ${payBadge(o.payment_status)}
      </div>
      <div style="font-size:0.82rem;color:var(--color-muted)">${esc(o.buyer_name || 'Unknown Buyer')}</div>
      <div style="font-weight:700;color:var(--color-accent);margin-top:6px">${ksh(o.total_amount)}</div>
      <div class="text-muted text-sm" style="margin-top:4px">${new Date(o.created_at).toLocaleDateString('en-KE')}</div>
    </div>
  `;
}

function openOrderDetail(orderId, container) {
  const orders   = db.getOrders();
  const products = db.getProducts();
  const order    = orders.find(o => o.id === orderId);
  if (!order) return;
  const items    = db.getOrderItems(orderId);

  openModal(`
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h2 style="font-weight:800">${esc(order.order_number)}</h2>
      <button class="modal-close btn btn-ghost" style="min-height:36px;padding:0 12px">✕</button>
    </div>

    <div class="flex gap-8" style="margin-bottom:12px;flex-wrap:wrap">
      ${statusBadge(order.status)} ${payBadge(order.payment_status)}
    </div>

    <div class="card" style="background:var(--color-surface-2);margin-bottom:14px">
      <div class="text-sm text-muted">Buyer</div>
      <div style="font-weight:600">${esc(order.buyer_name || '—')}</div>
      <div class="text-muted text-sm">${esc(order.buyer_phone || '')} · ${esc(order.delivery_preference || '')}</div>
    </div>

    <div style="margin-bottom:14px">
      <div style="font-weight:700;margin-bottom:8px">Pick List</div>
      ${items.map(item => {
        const p = products.find(x => x.id === item.product_id);
        return `
          <label class="flex items-center gap-8" style="padding:10px 0;border-bottom:1px solid var(--color-border);cursor:pointer">
            <input type="checkbox" class="pick-check" data-item="${item.id}" style="width:22px;height:22px;cursor:pointer;accent-color:var(--color-accent)" />
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.9rem">${esc(p?.name || 'Product')}</div>
              <div class="text-muted text-sm">×${item.quantity_packs} packs &nbsp;·&nbsp; ${ksh(item.subtotal)}</div>
            </div>
          </label>`;
      }).join('')}
      <div class="flex justify-between fw-700" style="margin-top:10px">
        <span>Total</span><span style="color:var(--color-accent)">${ksh(order.total_amount)}</span>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${order.status === 'pending'    ? `<button class="btn btn-warning" id="btn-start-packing">Start Packing</button>` : ''}
      ${order.status === 'packing'    ? `<button class="btn btn-primary" id="btn-dispatched">Mark Dispatched</button>` : ''}
      ${order.status === 'dispatched' ? `<button class="btn btn-success" id="btn-complete">Mark Completed</button>` : ''}
      <button class="btn btn-ghost" id="btn-print-note">🖨️ Print Note</button>
    </div>
  `);

  document.getElementById('btn-start-packing')?.addEventListener('click', () => { db.updateOrderStatus(orderId, 'packing'); closeModal(() => renderDispatch(container)); });
  document.getElementById('btn-dispatched')?.addEventListener('click',    () => { db.updateOrderStatus(orderId, 'dispatched'); closeModal(() => renderDispatch(container)); });
  document.getElementById('btn-complete')?.addEventListener('click',      () => { db.updateOrderStatus(orderId, 'completed'); closeModal(() => renderDispatch(container)); });
  document.getElementById('btn-print-note')?.addEventListener('click',   () => printDeliveryNote(order, items, products));
}

function printDeliveryNote(order, items, products) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Delivery Note — ${order.order_number}</title>
    <style>body{font-family:sans-serif;padding:24px;max-width:600px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f0f0f0}</style></head>
    <body>
      <h2>Mikami Solutions — Delivery Note</h2>
      <p><strong>Order:</strong> ${order.order_number} &nbsp; <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-KE')}</p>
      <p><strong>Buyer:</strong> ${order.buyer_name} &nbsp; <strong>Phone:</strong> ${order.buyer_phone}</p>
      <p><strong>Delivery:</strong> ${order.delivery_preference}</p>
      <table><thead><tr><th>Item</th><th>Packs</th><th>Unit Price</th><th>Subtotal</th></tr></thead><tbody>
        ${items.map(i => { const p = products.find(x => x.id === i.product_id); return `<tr><td>${p?.name||''}</td><td>${i.quantity_packs}</td><td>KSh ${i.unit_price}</td><td>KSh ${i.subtotal}</td></tr>`; }).join('')}
      </tbody></table>
      <p style="margin-top:12px"><strong>Total: KSh ${order.total_amount}</strong></p>
      <script>window.print()</script>
    </body></html>`);
  win.document.close();
}
