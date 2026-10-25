/**
 * inventory.js — Inventory Admin: product management panel
 */

import { db } from '../../data/db.js';
import { ksh, stockBadge, esc } from '../../utils/utils.js';
import { openModal, closeModal } from '../../components/shared/modal.js';

const CATEGORIES = ['Plastics', 'Cleaning', 'Hardware', 'Dry Goods'];
const UNIT_TYPES  = ['piece', 'dozen', 'carton', 'bale'];

export function renderInventory(container) {
  const products = db.getProducts();
  const lowStock = products.filter(p => p.current_stock > 0 && p.current_stock <= p.low_stock_threshold);

  container.innerHTML = `
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h1 style="font-size:1.4rem;font-weight:800">Inventory Admin</h1>
      <button class="btn btn-primary" id="inv-add-btn">+ Add Product</button>
    </div>

    ${lowStock.length > 0 ? `
      <div class="card" style="background:rgba(245,158,11,0.1);border-color:var(--color-warning);margin-bottom:16px">
        <div style="font-weight:700;color:var(--color-warning);margin-bottom:6px">⚠️ Low Stock Alert (${lowStock.length})</div>
        ${lowStock.map(p => `<div class="text-sm">${esc(p.name)} — <strong>${p.current_stock}</strong> packs remaining</div>`).join('')}
      </div>
    ` : ''}

    <div class="card" style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.88rem">
        <thead>
          <tr style="border-bottom:1px solid var(--color-border)">
            <th style="text-align:left;padding:8px 6px;color:var(--color-muted);font-weight:600">SKU</th>
            <th style="text-align:left;padding:8px 6px;color:var(--color-muted);font-weight:600">Product</th>
            <th style="text-align:left;padding:8px 6px;color:var(--color-muted);font-weight:600">Category</th>
            <th style="text-align:right;padding:8px 6px;color:var(--color-muted);font-weight:600">Price/Pack</th>
            <th style="text-align:right;padding:8px 6px;color:var(--color-muted);font-weight:600">Stock</th>
            <th style="text-align:center;padding:8px 6px;color:var(--color-muted);font-weight:600">Status</th>
            <th style="padding:8px 6px"></th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr style="border-bottom:1px solid var(--color-border)" id="inv-row-${p.id}">
              <td style="padding:10px 6px;font-family:monospace;font-size:0.8rem;color:var(--color-muted)">${esc(p.sku)}</td>
              <td style="padding:10px 6px;font-weight:600">${esc(p.name)}</td>
              <td style="padding:10px 6px">${esc(p.category)}</td>
              <td style="padding:10px 6px;text-align:right;color:var(--color-accent);font-weight:700">${ksh(p.wholesale_price)}</td>
              <td style="padding:10px 6px;text-align:right;font-weight:700">${p.current_stock}</td>
              <td style="padding:10px 6px;text-align:center">${stockBadge(p)}</td>
              <td style="padding:10px 6px;text-align:right">
                <button class="btn btn-ghost inv-edit-btn" data-id="${p.id}" style="min-height:34px;padding:0 10px;font-size:0.8rem">Edit</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#inv-add-btn').addEventListener('click', () => openProductForm(null, container));
  container.querySelectorAll('.inv-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = db.getProducts().find(p => p.id === btn.dataset.id);
      openProductForm(product, container);
    });
  });
}

function openProductForm(product, container) {
  const isEdit = !!product;
  openModal(`
    <div class="flex justify-between items-center" style="margin-bottom:16px">
      <h2 style="font-weight:800">${isEdit ? 'Edit Product' : 'Add Product'}</h2>
      <button class="modal-close btn btn-ghost" style="min-height:36px;padding:0 12px">✕</button>
    </div>

    <div class="input-group"><label>SKU</label><input class="input" id="pf-sku" type="text" value="${esc(product?.sku || '')}" placeholder="MS-XX-000" /></div>
    <div class="input-group"><label>Product Name *</label><input class="input" id="pf-name" type="text" value="${esc(product?.name || '')}" required /></div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="input-group"><label>Category</label>
        <select class="input" id="pf-category">
          ${CATEGORIES.map(c => `<option ${product?.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="input-group"><label>Unit Type</label>
        <select class="input" id="pf-unit_type">
          ${UNIT_TYPES.map(u => `<option ${product?.unit_type===u?'selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="input-group"><label>Units per Pack</label><input class="input" id="pf-units_per_pack" type="number" min="1" value="${product?.units_per_pack||12}" /></div>
      <div class="input-group"><label>Wholesale Price (KSh)</label><input class="input" id="pf-wholesale_price" type="number" min="0" value="${product?.wholesale_price||0}" /></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="input-group"><label>Current Stock (packs)</label><input class="input" id="pf-current_stock" type="number" min="0" value="${product?.current_stock||0}" /></div>
      <div class="input-group"><label>Low Stock Threshold</label><input class="input" id="pf-low_stock_threshold" type="number" min="1" value="${product?.low_stock_threshold||5}" /></div>
    </div>

    <div class="flex gap-8" style="margin-top:8px">
      <button class="btn btn-primary" id="pf-save-btn" style="flex:1">${isEdit ? 'Save Changes' : 'Add Product'}</button>
      ${isEdit ? `<button class="btn btn-danger" id="pf-delete-btn">Delete</button>` : ''}
    </div>
  `);

  document.getElementById('pf-save-btn').addEventListener('click', () => {
    const name = document.getElementById('pf-name').value.trim();
    if (!name) { alert('Product name is required.'); return; }
    const data = {
      sku: document.getElementById('pf-sku').value.trim(),
      name,
      category: document.getElementById('pf-category').value,
      unit_type: document.getElementById('pf-unit_type').value,
      units_per_pack: parseInt(document.getElementById('pf-units_per_pack').value) || 1,
      wholesale_price: parseFloat(document.getElementById('pf-wholesale_price').value) || 0,
      current_stock: parseInt(document.getElementById('pf-current_stock').value) || 0,
      low_stock_threshold: parseInt(document.getElementById('pf-low_stock_threshold').value) || 5,
    };
    if (isEdit) db.updateProduct(product.id, data);
    else db.addProduct(data);
    closeModal(() => renderInventory(container));
  });

  document.getElementById('pf-delete-btn')?.addEventListener('click', () => {
    if (confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      db.deleteProduct(product.id);
      closeModal(() => renderInventory(container));
    }
  });
}
