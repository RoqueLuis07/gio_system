import { state } from './state.js';
import { fmt } from './format.js';
import { renderProductosCards } from './ui/productos.js';
import { renderVentasTable } from './ui/ventas.js';
import { renderRecordatorios } from './ui/recordatorios.js';
import { renderCRM } from './ui/crm.js';
import { renderExportView } from './ui/exportar.js';
import { renderParametros } from './ui/parametros.js';
import { renderPerfil } from './ui/auth.js';
import { calcularEnTiempoReal } from './ui/calculadora.js';
import { renderWaModuloOptions } from './ui/wa-modulo.js';
import { renderTicker } from './ui/ticker.js';
import { renderRepositorio, renderEnlaces } from './ui/repositorio.js';
import { renderReportesPreview } from './ui/reportes.js';
import { renderComisiones } from './ui/comisiones.js';
import { renderHistorico } from './ui/historico.js';
import { renderDiplomadosConcluidos } from './ui/diplomados-concluidos.js';
import { renderNavOrden } from './ui/nav-orden.js';
import { renderFuturosClientes } from './ui/futuros-clientes.js';

function productosActivosIds() {
  return new Set(state.productos.filter((p) => p.estado !== 'concluido').map((p) => p.id));
}

function updateMetaGauge() {
  const circle = document.getElementById('meta-gauge-circle');
  const pctEl = document.getElementById('meta-gauge-pct');
  const labelEl = document.getElementById('meta-gauge-label');
  if (!circle) return;

  const activosIds = productosActivosIds();
  const totalMeta = state.productos.filter((p) => p.estado !== 'concluido').reduce((s, p) => s + (p.meta || 0), 0) || 1;
  const totalAlumnos = state.ventas.filter((v) => activosIds.has(v.productoId)).length;
  const pct = Math.max(0, Math.min(100, (totalAlumnos / totalMeta) * 100));

  const r = 54;
  const c = 2 * Math.PI * r;
  circle.style.strokeDasharray = `${c}`;
  circle.style.strokeDashoffset = `${c - (pct / 100) * c}`;

  pctEl.textContent = `${Math.round(pct)}%`;
  labelEl.textContent = `${totalAlumnos} / ${totalMeta} alumnos`;
}

export async function renderAll() {
  // Diplomados activos primero; los concluidos siguen disponibles (para no romper
  // ediciones de ventas ya cargadas en ellos) pero marcados y al final de la lista.
  const productosOrdenados = [...state.productos].sort((a, b) => (a.estado === 'concluido' ? 1 : 0) - (b.estado === 'concluido' ? 1 : 0));
  const pOptions = productosOrdenados.map((p) => `<option value="${p.id}">${p.nombre}${p.estado === 'concluido' ? ' (Concluido)' : ''}</option>`).join('');

  document.getElementById('v-producto').innerHTML = pOptions;
  document.getElementById('crm-producto').innerHTML = '<option value="">— Seleccionar Diplomado —</option>' + pOptions;
  document.getElementById('csv-diplomado-select').innerHTML = pOptions;
  document.getElementById('exp-diplomado-select').innerHTML = '<option value="todos">Todos los Diplomados</option>' + pOptions;

  document.getElementById('v-metodo-pago').innerHTML = state.parametros.metodosPago.map((m) => `<option value="${m}">${m}</option>`).join('');
  document.getElementById('v-cargo').innerHTML = '<option value="">— Opcional —</option>' + state.parametros.cargos.map((c) => `<option value="${c}">${c}</option>`).join('');

  renderPerfil();
  renderParametros();

  const activosIds = productosActivosIds();
  const comisionPendiente = state.ventas
    .filter((v) => !v.cobrado && activosIds.has(v.productoId))
    .reduce((s, v) => s + v.comision, 0);
  document.getElementById('stat-ganancia').textContent = fmt(comisionPendiente);
  document.getElementById('stat-monto-total').textContent = fmt(state.ventas.reduce((s, v) => s + v.monto, 0));
  document.getElementById('stat-ventas').textContent = state.ventas.length;
  document.getElementById('stat-diplomados').textContent = state.productos.filter((p) => p.estado !== 'concluido').length;
  updateMetaGauge();

  renderProductosCards('dash-cards', { filter: 'activos' });
  renderProductosCards('productos-cards', { filter: 'activos' });
  renderDiplomadosConcluidos();
  renderVentasTable();
  renderRecordatorios();
  renderCRM();
  renderExportView();
  calcularEnTiempoReal();
  renderWaModuloOptions();
  renderTicker();
  renderRepositorio();
  renderEnlaces();
  renderReportesPreview();
  renderComisiones();
  renderHistorico();
  renderNavOrden();
  renderFuturosClientes();
}
