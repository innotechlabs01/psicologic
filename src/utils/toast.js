// src/utils/toast.js
export function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `
    relative px-4 py-3 rounded shadow text-sm font-medium flex items-center gap-2 overflow-hidden
    ${type === 'success' ? 'bg-green-500 text-white' : ''}
    ${type === 'error' ? 'bg-red-500 text-white' : ''}
    ${type === 'info' ? 'bg-blue-500 text-white' : ''}
    ${type === 'warning' ? 'bg-yellow-500 text-black' : ''}
  `;

  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-auto font-bold text-white hover:text-gray-200" onclick="this.parentElement.remove()">×</button>
    <div class="absolute bottom-0 left-0 h-1 bg-white opacity-30 animate-progress" style="width: 100%;"></div>
  `;

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
    .animate-progress {
      animation: shrink ${duration}ms linear forwards;
    }
  `;
  document.head.appendChild(style);

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}
