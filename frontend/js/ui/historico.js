import { state } from '../state.js';
import { fmt } from '../format.js';

const MESES_LABEL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function mesesDisponibles() {
  const set = new Set(state.ventas.map((v) => (v.fecha || '').slice(0, 7)).filter(Boolean));
  return [...set].sort().reverse();
}

function labelMes(yyyyMM) {
  const [y, m] = yyyyMM.split('-');
  return `${MESES_LABEL[parseInt(m, 10) - 1] || m} ${y}`;
}

export function initHistorico() {
  document.getElementById('hist-mes-select').addEventListener('change', renderHistorico);
}

export function renderHistorico() {
  const select = document.getElementById('hist-mes-select');
  if (!select) return;

  const meses = mesesDisponibles();
  const valorPrevio = select.value;

  select.innerHTML = meses.length
    ? meses.map((m) => `<option value="${m}">${labelMes(m)}</option>`).join('')
    : `<option value="">Sin ventas registradas</option>`;

  if (meses.includes(valorPrevio)) select.value = valorPrevio;

  const mesSeleccionado = select.value;
  const ventasDelMes = state.ventas.filter((v) => (v.fecha || '').slice(0, 7) === mesSeleccionado);

  document.getElementById('hist-comision').textContent = fmt(ventasDelMes.reduce((s, v) => s + v.comision, 0));
  document.getElementById('hist-recaudado').textContent = fmt(ventasDelMes.reduce((s, v) => s + v.monto, 0));
  document.getElementById('hist-ventas').textContent = ventasDelMes.length;
}
