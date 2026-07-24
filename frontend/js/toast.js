export function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `✨ <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}
