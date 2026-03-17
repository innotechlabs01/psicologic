// /js/toast.js
window.showToast = function(message, type) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} px-4 py-2 rounded shadow-lg mb-2 transition-all duration-300 transform translate-x-0`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}