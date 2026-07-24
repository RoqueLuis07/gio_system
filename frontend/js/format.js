import { state } from './state.js';

export const fmt = (n) => (state.parametros.moneda || '₲') + ' ' + Math.round(Number(n) || 0).toLocaleString('es-PY');

export function attachMoneyInput(id, onInput) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    const raw = el.value.replace(/\D/g, '');
    el.value = raw ? Number(raw).toLocaleString('es-PY') : '';
    if (onInput) onInput();
  });
}

export function moneyVal(id) {
  return parseInt((document.getElementById(id).value || '').replace(/\D/g, ''), 10) || 0;
}
