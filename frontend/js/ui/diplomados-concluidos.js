import { state } from '../state.js';
import { fmt } from '../format.js';
import { showToast } from '../toast.js';
import { descargarExcel } from '../xlsx-export.js';

let selectedId = null;

function exportarAlumnosDelDiplomado(productoId) {
  const p = state.productos.find((x) => x.id === productoId);
  if (!p) return;

  const ventas = state.ventas.filter((v) => v.productoId === productoId);
  if (ventas.length === 0) return alert('Este diplomado no tiene alumnos registrados.');

  const filas = ventas.map((v) => [v.cliente, v.ci || '', v.telefono || '', v.empresa || '', v.cargo || '', v.fecha, v.monto, v.descuento || 0, v.comision]);

  descargarExcel(`Alumnos_${p.nombre.replace(/[^a-zA-Z0-9]+/g, '_')}.xls`, [
    {
      nombre: 'Alumnos',
      headers: ['Alumno', 'CI', 'Telefono', 'Empresa', 'Cargo', 'Fecha', 'Monto', 'Descuento(%)', 'Comision'],
      filas,
      anchos: [140, 90, 100, 130, 110, 90, 100, 90, 100],
    },
  ]);
  showToast('Alumnos exportados correctamente.');
}

function onFilaClick(e) {
  const tr = e.target.closest('tr[data-concluido-id]');
  if (!tr) return;
  selectedId = selectedId === tr.dataset.concluidoId ? null : tr.dataset.concluidoId;
  renderDiplomadosConcluidos();
}

function onDetalleClick(e) {
  const btn = e.target.closest('button[data-accion]');
  if (!btn || !selectedId) return;
  const accion = btn.dataset.accion;
  if (accion === 'editar') window.editarDiplomado(selectedId);
  if (accion === 'reabrir') window.concluirDiplomado(selectedId);
  if (accion === 'borrar') window.borrarDiplomado(selectedId);
  if (accion === 'exportar') exportarAlumnosDelDiplomado(selectedId);
}

export function initDiplomadosConcluidos() {
  document.getElementById('productos-concluidos-tbody').addEventListener('click', onFilaClick);
  document.getElementById('productos-concluidos-detalle').addEventListener('click', onDetalleClick);
}

export function renderDiplomadosConcluidos() {
  const tbody = document.getElementById('productos-concluidos-tbody');
  if (!tbody) return;

  const concluidos = state.productos.filter((p) => p.estado === 'concluido');

  tbody.innerHTML = concluidos.length
    ? concluidos.map((p) => `
      <tr class="row-clickable ${selectedId === p.id ? 'row-selected' : ''}" data-concluido-id="${p.id}">
        <td><b>${p.nombre}</b></td>
      </tr>
    `).join('')
    : `<tr><td class="empty-state" style="border:none;">No hay diplomados concluidos.</td></tr>`;

  const detalleWrap = document.getElementById('productos-concluidos-detalle');
  const p = concluidos.find((x) => x.id === selectedId);

  if (!p) {
    detalleWrap.style.display = 'none';
    return;
  }

  const vs = state.ventas.filter((v) => v.productoId === p.id);
  const totalComision = vs.reduce((s, v) => s + v.comision, 0);

  detalleWrap.style.display = 'block';
  detalleWrap.innerHTML = `
    <div class="diploma-title">${p.nombre} <span class="pill" style="color:var(--coral);">CONCLUIDO</span></div>
    <div class="diploma-price">${fmt(p.precio)} · ${p.valor}% com.</div>
    <div class="diploma-count mono">${vs.length}</div>
    <div class="diploma-count-label">Alumnos Inscritos (Meta: ${p.meta || 0})</div>
    <div class="diploma-earn">${fmt(totalComision)} comisiones</div>
    <div class="diploma-actions">
      <button class="btn secondary btn-sm" data-accion="editar">✏️ Editar</button>
      <button class="btn secondary btn-sm" data-accion="reabrir">↩️ Reabrir</button>
      <button class="btn btn-sm" data-accion="exportar">⬇️ Exportar Alumnos</button>
      <button class="btn danger btn-sm" data-accion="borrar">🗑️ Borrar</button>
    </div>
  `;
}
