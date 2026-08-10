import { state } from '../state.js';
import { fmt } from '../format.js';

export function renderTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const comision = state.ventas.reduce((s, v) => s + v.comision, 0);
  const recaudado = state.ventas.reduce((s, v) => s + v.monto, 0);
  const totalMeta = state.productos.reduce((s, p) => s + (p.meta || 0), 0) || 1;
  const totalAlumnos = state.ventas.length;
  const progreso = Math.round((totalAlumnos / totalMeta) * 100);
  const pendientes = state.recordatorios.filter((r) => !r.completado).length;

  const items = [
    `COMISIÓN ACUMULADA · ${fmt(comision)}`,
    `TOTAL RECAUDADO · ${fmt(recaudado)}`,
    `VENTAS CERRADAS · ${totalAlumnos}`,
    `META GLOBAL · ${progreso}%`,
    `RECORDATORIOS PENDIENTES · ${pendientes}`,
    `DIPLOMADOS ACTIVOS · ${state.productos.length}`,
  ];

  const content = items.concat(items);
  track.innerHTML = content.map((t) => `<span class="ticker-item"><span class="dot"></span>${t}</span>`).join('');
}
