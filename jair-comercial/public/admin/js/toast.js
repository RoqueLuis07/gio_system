const Toast = (function () {
  const container = () => document.getElementById('toast-container');

  function show(msg, tipo) {
    const el = document.createElement('div');
    el.className = 'toast toast-' + (tipo || 'info');
    el.textContent = msg;
    container().appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => {
      el.classList.remove('in');
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  return {
    ok: (msg) => show(msg, 'ok'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info'),
  };
})();
