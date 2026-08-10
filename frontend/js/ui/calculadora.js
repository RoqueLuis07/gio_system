import { fmt, moneyVal } from '../format.js';

export function calcularEnTiempoReal() {
  const monto = moneyVal('c-monto');
  const pct = parseFloat(document.getElementById('c-porcentaje').value) || 0;
  const descPct = parseFloat(document.getElementById('c-descuento').value) || 0;
  const cuotas = Math.max(1, parseInt(document.getElementById('c-cuotas').value, 10) || 1);

  const valDescuento = monto * (descPct / 100);
  const montoConDescuento = monto - valDescuento;
  const valCuota = montoConDescuento / cuotas;
  const valComision = montoConDescuento * (pct / 100);

  document.getElementById('calc-val-cuota').textContent = fmt(valCuota);
  document.getElementById('calc-val-comision').textContent = fmt(valComision);
  document.getElementById('calc-val-descuento').textContent = fmt(valDescuento);

  const vMonto = moneyVal('v-monto');
  const vPct = parseFloat(document.getElementById('v-porcentaje').value) || 0;
  const vDescPct = parseFloat(document.getElementById('v-descuento').value) || 0;
  const vBase = vMonto - vMonto * (vDescPct / 100);
  document.getElementById('v-comision-preview').textContent = fmt(vBase * (vPct / 100));
}

export function initCalculadora() {
  ['c-porcentaje', 'c-cuotas', 'c-descuento', 'v-porcentaje', 'v-descuento'].forEach((id) => {
    document.getElementById(id).addEventListener('input', calcularEnTiempoReal);
  });
}
