const Modal = (function () {
  const overlay = () => document.getElementById('modal-overlay');
  const box = () => document.getElementById('admin-modal');

  function open(html) {
    box().innerHTML = html;
    overlay().hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay().hidden = true;
    box().innerHTML = '';
    document.body.style.overflow = '';
  }

  overlay_click_bound();
  function overlay_click_bound() {
    document.addEventListener('DOMContentLoaded', () => {
      overlay().addEventListener('click', (e) => { if (e.target === overlay()) close(); });
    });
  }

  return { open, close, el: box };
})();
