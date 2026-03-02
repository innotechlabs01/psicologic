// /js/toast.js
export function showToast(message, type) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    console.warn('Toast container not found');
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}