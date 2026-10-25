/**
 * main.js — App entry point: tab routing & module initialisation
 */

import { renderCatalog }   from './modules/catalog/catalog.js';
import { renderDispatch }  from './modules/dispatch/dispatch.js';
import { renderInventory } from './modules/inventory/inventory.js';
import { renderLedger }    from './modules/ledger/ledger.js';

// --- Register Service Worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/sw.js').catch(() => {});
  });
}

// --- Tab routing ---
const tabs = {
  catalog:   { btn: 'nav-catalog',   panel: 'tab-catalog',   render: renderCatalog   },
  dispatch:  { btn: 'nav-dispatch',  panel: 'tab-dispatch',  render: renderDispatch  },
  inventory: { btn: 'nav-inventory', panel: 'tab-inventory', render: renderInventory },
  ledger:    { btn: 'nav-ledger',    panel: 'tab-ledger',    render: renderLedger    },
};

function activateTab(name) {
  Object.entries(tabs).forEach(([key, cfg]) => {
    const btn   = document.getElementById(cfg.btn);
    const panel = document.getElementById(cfg.panel);
    const active = key === name;
    btn.classList.toggle('active', active);
    panel.classList.toggle('active', active);
    if (active) {
      panel.innerHTML = '';
      cfg.render(panel);
    }
  });
}

// Wire nav buttons
Object.entries(tabs).forEach(([name, cfg]) => {
  document.getElementById(cfg.btn).addEventListener('click', () => activateTab(name));
});

// Boot on catalog
activateTab('catalog');
