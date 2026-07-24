export function switchView(viewName) {
  document.querySelectorAll('.navbtn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const btn = document.querySelector(`[data-view="${viewName}"]`);
  if (btn) btn.classList.add('active');
  document.getElementById('view-' + viewName).classList.add('active');
}

export function initNav() {
  document.querySelectorAll('.navbtn').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
  document.querySelectorAll('[data-goto-view]').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.gotoView));
  });
}
