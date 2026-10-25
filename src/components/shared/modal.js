/**
 * modal.js — Global modal controller
 */

const overlay = document.getElementById('modal-overlay');
const box = document.getElementById('modal-box');

export function openModal(html, onClose) {
  box.innerHTML = html;
  overlay.classList.add('open');
  // Close on overlay backdrop click
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(onClose); };
  // Close on any .modal-close button
  box.querySelectorAll('.modal-close').forEach(btn => {
    btn.onclick = () => closeModal(onClose);
  });
}

export function closeModal(cb) {
  overlay.classList.remove('open');
  box.innerHTML = '';
  if (typeof cb === 'function') cb();
}
