import { api } from '../api.js';
import { state } from '../state.js';
import { fmt } from '../format.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';

let selectedProductoId = null;

function ventasPendientes(productoId) {
  return state.ventas.filter((v) => v.productoId === productoId && !v.cobrado);
}

function filaProducto(p) {
  const pendientes = ventasPendientes(p.id);
  const comisionPendiente = pendientes.reduce((s, v) => s + v.comision, 0);
  const seleccionada = selectedProductoId === p.id;
  return `
    <tr class="row-clickable ${seleccionada ? 'row-selected' : ''}" data-com-producto-id="${p.id}">
      <td><b>${p.nombre}</b></td>
      <td>${pendientes.length}</td>
      <td class="amt-gold">${fmt(comisionPendiente)}</td>
    </tr>
  `;
}

function onFilaClick(e) {
  const tr = e.target.closest('tr[data-com-producto-id]');
  if (!tr) return;
  selectedProductoId = selectedProductoId === tr.dataset.comProductoId ? null : tr.dataset.comProductoId;
  renderComisiones();
}

async function onDetalleClick(e) {
  const btn = e.target.closest('button[data-com-toggle-id]');
  if (!btn) return;
  const ventaId = btn.dataset.comToggleId;
  const venta = state.ventas.find((v) => v.id === ventaId);
  if (!venta) return;

  try {
    const actualizado = await api.ventas.update(ventaId, { cobrado: !venta.cobrado });
    Object.assign(venta, actualizado);
    await renderAll();
    showToast(venta.cobrado ? 'Comisión marcada como cobrada.' : 'Comisión marcada como pendiente.');
  } catch (err) {
    alert(err.message);
  }
}

export function initComisiones() {
  document.getElementById('com-activos-tbody').addEventListener('click', onFilaClick);
  document.getElementById('com-concluidos-tbody').addEventListener('click', onFilaClick);
  document.getElementById('com-detalle-tbody').addEventListener('click', onDetalleClick);
}

export function renderComisiones() {
  const activosTbody = document.getElementById('com-activos-tbody');
  const concluidosTbody = document.getElementById('com-concluidos-tbody');
  if (!activosTbody || !concluidosTbody) return;

  const activos = state.productos.filter((p) => p.estado !== 'concluido');
  const concluidos = state.productos.filter((p) => p.estado === 'concluido');

  activosTbody.innerHTML = activos.length
    ? activos.map(filaProducto).join('')
    : `<tr><td colspan="3" class="empty-state" style="border:none;">Sin diplomados activos.</td></tr>`;

  concluidosTbody.innerHTML = concluidos.length
    ? concluidos.map(filaProducto).join('')
    : `<tr><td colspan="3" class="empty-state" style="border:none;">Sin diplomados concluidos.</td></tr>`;

  const detalleWrap = document.getElementById('com-detalle-wrap');
  const detalleTitulo = document.getElementById('com-detalle-titulo');
  const detalleTbody = document.getElementById('com-detalle-tbody');

  const productoSeleccionado = state.productos.find((p) => p.id === selectedProductoId);
  if (!productoSeleccionado) {
    detalleWrap.style.display = 'none';
    return;
  }

  detalleWrap.style.display = 'block';
  detalleTitulo.innerHTML = `Ventas de "${productoSeleccionado.nombre}" <span class="hint">${productoSeleccionado.estado === 'concluido' ? 'Diplomado concluido' : 'Diplomado activo'}</span>`;

  const ventas = state.ventas.filter((v) => v.productoId === productoSeleccionado.id);
  detalleTbody.innerHTML = ventas.length
    ? ventas.map((v) => `
      <tr>
        <td><b>${v.cliente}</b></td>
        <td class="mono">${v.ci || '—'}</td>
        <td class="mono">${v.fecha}</td>
        <td class="amt-teal">${fmt(v.monto)}</td>
        <td class="amt-gold">${fmt(v.comision)}</td>
        <td><span class="pill" style="${v.cobrado ? 'color:var(--teal);' : 'color:var(--gold);'}">${v.cobrado ? 'Cobrada' : 'Pendiente'}</span></td>
        <td><button class="btn ${v.cobrado ? 'secondary' : ''} btn-sm" data-com-toggle-id="${v.id}">${v.cobrado ? '↩️ Marcar Pendiente' : '✅ Marcar Cobrada'}</button></td>
      </tr>
    `).join('')
    : `<tr><td colspan="7" class="empty-state" style="border:none;">Este diplomado no tiene ventas registradas.</td></tr>`;
}
