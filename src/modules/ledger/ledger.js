/**
 * ledger.js — Module C: Retailer Account & Credit Ledger
 */

import { db } from '../../data/db.js';
import { ksh, payBadge, esc } from '../../utils/utils.js';
import { openModal, closeModal } from '../../components/shared/modal.js';

const MIKAMI_PHONE = '254700000000'; // ← Replace with real WhatsApp number

export function renderLedger(container) {
  const retailers = db.getRetailers();
  const orders    = db.getOrders();

  const totalOutstanding = retailers.reduce((s, r) => s + (r.outstanding_balance || 0), 0);
  const overdue = retailers.filter(r => r.outstanding_balance > 0 && r.outstanding_balance >= r.credit_limit * 0.8);

  container.innerHTML = `
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h1 style="font-size:1.4rem;font-weight:800">Customer Ledger</h1>
      <button class="btn btn-primary" id="ledger-add-btn">+ Add Retailer</button>
    </div>

    <!-- Summary cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px">
      <div class="card" style="text-align:center">
        <div class="text-muted text-sm">Total Retailers</div>
        <div style="font-size:1.8rem;font-weight:800;margin-top:4px">${retailers.length}</div>
      </div>
      <div class="card" style="text-align:center">
        <div class="text-muted text-sm">Outstanding Credit</div>
        <div style="font-size:1.4rem;font-weight:800;margin-top:4px;color:var(--color-danger)">${ksh(totalOutstanding)}</div>
      </div>
      <div class="card" style="text-align:center">
        <div class="text-muted text-sm">Overdue Accounts</div>
        <div style="font-size:1.8rem;font-weight:800;margin-top:4px;color:var(--color-warning)">${overdue.length}</div>
      </div>
    </div>

    <!-- Retailer list -->
    <div style="display:flex;flex-direction:column;gap:10px" id="ledger-list">
      ${retailers.map(r => {
        const buyerOrders = orders.filter(o => o.retailer_id === r.id);
        const isOverdue   = r.outstanding_balance > 0 && r.outstanding_balance >= r.credit_limit * 0.8;
        return `
          <div class="card" style="cursor:pointer;transition:border-color 0.2s;${isOverdue?'border-color:var(--color-warning)':''}"
            data-retailer="${r.id}" id="ledger-card-${r.id}"
            onmouseenter="this.style.borderColor='var(--color-primary)'"
            onmouseleave="this.style.borderColor='${isOverdue?'var(--color-warning)':'var(--color-border)'}'">
            <div class="flex justify-between items-center">
              <div>
                <div style="font-weight:700">${esc(r.business_name)}</div>
                <div class="text-muted text-sm">${esc(r.contact_person)} · ${esc(r.phone_number)}</div>
                <div class="text-muted text-sm">${esc(r.location_notes)}</div>
              </div>
              <div style="text-align:right">
                ${isOverdue ? '<span class="badge badge-yellow" style="margin-bottom:4px">⚠️ Overdue</span><br/>' : ''}
                <div style="font-size:0.78rem;color:var(--color-muted)">Outstanding</div>
                <div style="font-weight:800;font-size:1.05rem;color:${r.outstanding_balance>0?'var(--color-danger)':'var(--color-accent)'}">${ksh(r.outstanding_balance)}</div>
              </div>
            </div>
            <div class="flex gap-8 items-center" style="margin-top:10px">
              <div class="text-muted text-sm" style="flex:1">Limit: ${ksh(r.credit_limit)} · ${buyerOrders.length} orders</div>
              <button class="btn btn-ghost ledger-wa-btn" data-id="${r.id}" style="min-height:36px;padding:0 12px;font-size:0.8rem">📲 Remind</button>
              <button class="btn btn-primary ledger-pay-btn" data-id="${r.id}" style="min-height:36px;padding:0 14px;font-size:0.8rem">Record Payment</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelector('#ledger-add-btn').addEventListener('click', () => openRetailerForm(null, container));

  container.querySelectorAll('.ledger-wa-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = db.getRetailers().find(x => x.id === btn.dataset.id);
      const msg = encodeURIComponent(
        `Hello ${r.contact_person},\n\nThis is a payment reminder from Mikami Solutions.\n\n` +
        `Outstanding Balance: KSh ${r.outstanding_balance}\nCredit Limit: KSh ${r.credit_limit}\n\n` +
        `Kindly settle your balance at your earliest convenience.\nThank you! 🙏`
      );
      window.open(`https://wa.me/${r.phone_number.replace(/\D/g,'')}?text=${msg}`, '_blank');
    });
  });

  container.querySelectorAll('.ledger-pay-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPaymentModal(btn.dataset.id, container);
    });
  });

  container.querySelectorAll('[data-retailer]').forEach(card => {
    card.addEventListener('click', () => openRetailerDetail(card.dataset.retailer, container));
  });
}

function openPaymentModal(retailerId, container) {
  const retailer = db.getRetailers().find(r => r.id === retailerId);
  const orders   = db.getOrders().filter(o => o.retailer_id === retailerId && o.payment_status !== 'paid');

  openModal(`
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h2 style="font-weight:800">Record Payment</h2>
      <button class="modal-close btn btn-ghost" style="min-height:36px;padding:0 12px">✕</button>
    </div>

    <div class="card" style="background:var(--color-surface-2);margin-bottom:14px">
      <div style="font-weight:700">${esc(retailer.business_name)}</div>
      <div style="color:var(--color-danger);font-weight:700;font-size:1.1rem">Outstanding: ${ksh(retailer.outstanding_balance)}</div>
    </div>

    <div class="input-group">
      <label>Apply to Order (optional)</label>
      <select class="input" id="pay-order">
        <option value="">— General Account Payment —</option>
        ${orders.map(o => `<option value="${o.id}">${esc(o.order_number)} — ${ksh(o.total_amount - o.amount_paid)} due</option>`).join('')}
      </select>
    </div>

    <div class="input-group">
      <label>Amount Received (KSh) *</label>
      <input class="input" id="pay-amount" type="number" min="1" placeholder="0" />
    </div>

    <div class="input-group">
      <label>Payment Method</label>
      <select class="input" id="pay-method">
        <option>M-Pesa</option>
        <option>Cash</option>
        <option>Bank Transfer</option>
      </select>
    </div>

    <button class="btn btn-success w-full" id="pay-confirm-btn">✅ Confirm Payment</button>
  `);

  document.getElementById('pay-confirm-btn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const method = document.getElementById('pay-method').value;
    const orderId = document.getElementById('pay-order').value;
    if (!amount || amount <= 0) { alert('Enter a valid amount.'); return; }

    if (orderId) {
      db.recordPayment(orderId, amount, method);
    } else {
      // General account credit reduction
      db.updateRetailer(retailerId, { outstanding_balance: Math.max(0, retailer.outstanding_balance - amount) });
    }
    closeModal(() => renderLedger(container));
  });
}

function openRetailerDetail(retailerId, container) {
  const r = db.getRetailers().find(x => x.id === retailerId);
  const orders = db.getOrders().filter(o => o.retailer_id === retailerId);

  openModal(`
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h2 style="font-weight:800">${esc(r.business_name)}</h2>
      <button class="modal-close btn btn-ghost" style="min-height:36px;padding:0 12px">✕</button>
    </div>

    <div class="card" style="background:var(--color-surface-2);margin-bottom:14px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div><div class="text-muted text-sm">Contact</div><div style="font-weight:600">${esc(r.contact_person)}</div></div>
      <div><div class="text-muted text-sm">Phone</div><div style="font-weight:600">${esc(r.phone_number)}</div></div>
      <div><div class="text-muted text-sm">Location</div><div style="font-weight:600">${esc(r.location_notes)}</div></div>
      <div><div class="text-muted text-sm">Credit Limit</div><div style="font-weight:600">${ksh(r.credit_limit)}</div></div>
    </div>

    <div style="font-weight:700;margin-bottom:8px">Order History</div>
    ${orders.length === 0
      ? '<p class="text-muted text-sm">No orders yet.</p>'
      : orders.map(o => `
        <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--color-border)">
          <div>
            <div style="font-weight:600;font-size:0.88rem">${esc(o.order_number)}</div>
            <div class="text-muted text-sm">${new Date(o.created_at).toLocaleDateString('en-KE')}</div>
          </div>
          <div style="text-align:right">${payBadge(o.payment_status)}<div style="font-weight:700;margin-top:4px">${ksh(o.total_amount)}</div></div>
        </div>
      `).join('')}
  `);
}

function openRetailerForm(retailer, container) {
  openModal(`
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h2 style="font-weight:800">Add New Retailer</h2>
      <button class="modal-close btn btn-ghost" style="min-height:36px;padding:0 12px">✕</button>
    </div>
    <div class="input-group"><label>Business Name *</label><input class="input" id="rf-business_name" type="text" value="${esc(retailer?.business_name||'')}" /></div>
    <div class="input-group"><label>Contact Person</label><input class="input" id="rf-contact_person" type="text" value="${esc(retailer?.contact_person||'')}" /></div>
    <div class="input-group"><label>WhatsApp Phone</label><input class="input" id="rf-phone_number" type="tel" value="${esc(retailer?.phone_number||'')}" placeholder="+254..." /></div>
    <div class="input-group"><label>Location Notes</label><input class="input" id="rf-location_notes" type="text" value="${esc(retailer?.location_notes||'')}" placeholder="Stall 14, West Market" /></div>
    <div class="input-group"><label>Credit Limit (KSh)</label><input class="input" id="rf-credit_limit" type="number" min="0" value="${retailer?.credit_limit||10000}" /></div>
    <button class="btn btn-primary w-full" id="rf-save-btn">Add Retailer</button>
  `);

  document.getElementById('rf-save-btn').addEventListener('click', () => {
    const name = document.getElementById('rf-business_name').value.trim();
    if (!name) { alert('Business name required.'); return; }
    db.addRetailer({
      business_name: name,
      contact_person: document.getElementById('rf-contact_person').value.trim(),
      phone_number: document.getElementById('rf-phone_number').value.trim(),
      location_notes: document.getElementById('rf-location_notes').value.trim(),
      credit_limit: parseFloat(document.getElementById('rf-credit_limit').value) || 10000,
    });
    closeModal(() => renderLedger(container));
  });
}
