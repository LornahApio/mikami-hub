/**
 * db.js — In-memory database with localStorage persistence
 * Stores: products, retailers, orders, orderItems
 */

const DB_KEY = 'mikami_hub_db';

const defaultData = {
  products: [
    { id: crypto.randomUUID(), sku: 'MS-PL-001', name: '20L Heavy Duty Plastic Basin', category: 'Plastics', unit_type: 'carton', units_per_pack: 12, wholesale_price: 2400, current_stock: 30, low_stock_threshold: 5 },
    { id: crypto.randomUUID(), sku: 'MS-CL-002', name: 'Omo Washing Powder 1kg', category: 'Cleaning', unit_type: 'carton', units_per_pack: 24, wholesale_price: 3600, current_stock: 50, low_stock_threshold: 10 },
    { id: crypto.randomUUID(), sku: 'MS-HW-003', name: 'Steel Door Padlock (Medium)', category: 'Hardware', unit_type: 'dozen', units_per_pack: 12, wholesale_price: 1800, current_stock: 4, low_stock_threshold: 5 },
    { id: crypto.randomUUID(), sku: 'MS-DG-004', name: 'Pembe Wheat Flour 2kg', category: 'Dry Goods', unit_type: 'carton', units_per_pack: 10, wholesale_price: 2200, current_stock: 20, low_stock_threshold: 8 },
    { id: crypto.randomUUID(), sku: 'MS-CL-005', name: 'Jik Bleach 750ml', category: 'Cleaning', unit_type: 'carton', units_per_pack: 12, wholesale_price: 1560, current_stock: 0, low_stock_threshold: 5 },
    { id: crypto.randomUUID(), sku: 'MS-PL-006', name: 'Plastic Cups Set (6pcs)', category: 'Plastics', unit_type: 'bale', units_per_pack: 48, wholesale_price: 960, current_stock: 15, low_stock_threshold: 5 },
  ],
  retailers: [
    { id: crypto.randomUUID(), business_name: 'Mama Brian General Store', contact_person: 'Brian Wanjiku', phone_number: '+254712345678', location_notes: 'Stall 14, West Market', credit_limit: 15000, outstanding_balance: 3200 },
    { id: crypto.randomUUID(), business_name: 'Jua Kali Traders', contact_person: 'Ali Osman', phone_number: '+254798765432', location_notes: 'Shop 7, Eastgate Plaza', credit_limit: 20000, outstanding_balance: 0 },
    { id: crypto.randomUUID(), business_name: 'Nairobi Kiosk Supplies', contact_person: 'Grace Muthoni', phone_number: '+254733112233', location_notes: 'Kiosk 3, Bus Station Road', credit_limit: 8000, outstanding_balance: 7800 },
  ],
  orders: [],
  orderItems: [],
};

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultData));
  } catch {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function save(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export const db = {
  // --- Products ---
  getProducts()             { return load().products; },
  addProduct(p)             { const d = load(); d.products.push({ id: crypto.randomUUID(), ...p }); save(d); },
  updateProduct(id, patch)  { const d = load(); d.products = d.products.map(p => p.id === id ? {...p, ...patch} : p); save(d); },
  deleteProduct(id)         { const d = load(); d.products = d.products.filter(p => p.id !== id); save(d); },

  // --- Retailers ---
  getRetailers()            { return load().retailers; },
  addRetailer(r)            { const d = load(); d.retailers.push({ id: crypto.randomUUID(), outstanding_balance: 0, ...r }); save(d); },
  updateRetailer(id, patch) { const d = load(); d.retailers = d.retailers.map(r => r.id === id ? {...r, ...patch} : r); save(d); },

  // --- Orders ---
  getOrders()               { return load().orders; },
  getOrderItems(orderId)    { return load().orderItems.filter(i => i.order_id === orderId); },
  createOrder(order, items) {
    const d = load();
    const id = crypto.randomUUID();
    const orderNum = `MS-${new Date().getFullYear()}-${String(d.orders.length + 1).padStart(4,'0')}`;
    const fullOrder = { id, order_number: orderNum, created_at: new Date().toISOString(), status: 'pending', payment_status: 'unpaid', amount_paid: 0, ...order };
    d.orders.unshift(fullOrder);
    items.forEach(item => d.orderItems.push({ id: crypto.randomUUID(), order_id: id, ...item }));
    // Deduct stock
    items.forEach(item => {
      const idx = d.products.findIndex(p => p.id === item.product_id);
      if (idx !== -1) d.products[idx].current_stock = Math.max(0, d.products[idx].current_stock - item.quantity_packs);
    });
    save(d);
    return fullOrder;
  },
  updateOrderStatus(id, status) { const d = load(); d.orders = d.orders.map(o => o.id === id ? {...o, status} : o); save(d); },
  recordPayment(orderId, amount, method) {
    const d = load();
    d.orders = d.orders.map(o => {
      if (o.id !== orderId) return o;
      const paid = (o.amount_paid || 0) + amount;
      const status = paid >= o.total_amount ? 'paid' : 'partial';
      // Update retailer balance
      const retailer = d.retailers.find(r => r.id === o.retailer_id);
      if (retailer) retailer.outstanding_balance = Math.max(0, retailer.outstanding_balance - amount);
      return { ...o, amount_paid: paid, payment_status: status, payment_method: method };
    });
    save(d);
  },

  reset() { localStorage.removeItem(DB_KEY); },
};
