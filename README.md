# Mikami Hub — Development Notes

## Quick Start

Open `index.html` in a browser **via a local dev server** (required for ES modules):

```bash
# Option 1 — VS Code Live Server extension (just click "Go Live")
# Option 2 — Node http-server
npx http-server . -p 3000 -o
# Option 3 — Python
python -m http.server 3000
```

> ⚠️ Opening `index.html` directly as a `file://` URL will block ES module imports. Always use a local server.

---

## Before Going Live

1. **Set your WhatsApp number** in two files:
   - [`src/modules/catalog/checkout.js`](src/modules/catalog/checkout.js) → `const MIKAMI_PHONE`
   - [`src/modules/ledger/ledger.js`](src/modules/ledger/ledger.js) → `const MIKAMI_PHONE`

2. **Data persistence** — all data lives in `localStorage`. For production, replace the `db.js` layer with real API calls.

3. **PWA icons** — add `public/icon-192.png` and `public/icon-512.png` to enable full PWA install.

---

## Project Structure

```
mikami-hub/
├── index.html                     # App shell & tab nav
├── public/
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker (offline)
└── src/
    ├── main.js                    # Entry point & tab router
    ├── styles/
    │   └── main.css               # Full design system
    ├── data/
    │   └── db.js                  # localStorage database layer
    ├── utils/
    │   └── utils.js               # Shared helpers
    ├── components/shared/
    │   ├── modal.js               # Global modal controller
    │   └── cart.js                # Cart state & drawer
    └── modules/
        ├── catalog/
        │   ├── catalog.js         # Module A: Product catalog
        │   └── checkout.js        # Checkout & WhatsApp bridge
        ├── dispatch/
        │   └── dispatch.js        # Module B: Dispatch Kanban
        ├── inventory/
        │   └── inventory.js       # Inventory admin
        └── ledger/
            └── ledger.js          # Module C: Credit ledger
```
