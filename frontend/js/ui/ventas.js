import { api } from '../api.js';
import { state } from '../state.js';
import { fmt, moneyVal } from '../format.js';
import { showToast } from '../toast.js';
import { switchView } from '../nav.js';
import { renderAll } from '../render.js';
import { calcularEnTiempoReal } from './calculadora.js';

let ventaEditId = null;
let ventasBusqueda = '';
let ventasPagina = 1;
const VENTAS_POR_PAGINA = 10;

export function initVentas() {
  document.getElementById('ventas-buscar').addEventListener('input', (e) => {
    ventasBusqueda = e.target.value.trim().toLowerCase();
    ventasPagina = 1;
    renderVentasTable();
  });

  document.getElementById('ventas-paginacion').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-pagina]');
    if (!btn) return;
    ventasPagina = Number(btn.dataset.pagina);
    renderVentasTable();
  });

  document.getElementById('v-submit').addEventListener('click', async () => {
    const productoId = document.getElementById('v-producto').value;
    const cliente = document.getElementById('v-cliente').value.trim();
    const monto = moneyVal('v-monto');
    const pct = parseFloat(document.getElementById('v-porcentaje').value) || 8.5;
    const descuento = parseFloat(document.getElementById('v-descuento').value) || 0;

    if (!productoId || !cliente || !monto) return alert('Ingresa cliente y monto.');

    const datos = {
      productoId,
      cliente,
      telefono: document.getElementById('v-telefono').value,
      ci: document.getElementById('v-ci').value,
      email: document.getElementById('v-email').value,
      empresa: document.getElementById('v-empresa').value,
      cargo: document.getElementById('v-cargo').value,
      metodoPago: document.getElementById('v-metodo-pago').value,
      fecha: document.getElementById('v-fecha').value || new Date().toISOString().slice(0, 10),
      monto,
      porcentaje: pct,
      descuento,
    };

    try {
      if (ventaEditId) {
        const actualizada = await api.ventas.update(ventaEditId, datos);
        const idx = state.ventas.findIndex((x) => x.id === ventaEditId);
        if (idx !== -1) state.ventas[idx] = actualizada;
        ventaEditId = null;
        document.getElementById('v-submit').textContent = '✨ Registrar Venta Individual';
        showToast('Venta actualizada con éxito.');
      } else {
        const nueva = await api.ventas.create(datos);
        state.ventas.push(nueva);
        showToast('Venta registrada con éxito.');
      }

      document.getElementById('v-cliente').value = '';
      document.getElementById('v-ci').value = '';
      document.getElementById('v-email').value = '';
      document.getElementById('v-descuento').value = '0';
      await renderAll();
    } catch (err) {
      alert(err.message);
    }
  });
}

window.editarVenta = function editarVenta(id) {
  const v = state.ventas.find((x) => x.id === id);
  if (!v) return;
  ventaEditId = id;

  document.getElementById('v-producto').value = v.productoId;
  document.getElementById('v-cliente').value = v.cliente;
  document.getElementById('v-telefono').value = v.telefono || '';
  document.getElementById('v-ci').value = v.ci || '';
  document.getElementById('v-email').value = v.email || '';
  document.getElementById('v-empresa').value = v.empresa || '';
  document.getElementById('v-cargo').value = v.cargo || '';
  document.getElementById('v-metodo-pago').value = v.metodoPago || '';
  document.getElementById('v-fecha').value = v.fecha;
  document.getElementById('v-monto').value = Math.round(v.monto).toLocaleString('es-PY');
  document.getElementById('v-porcentaje').value = v.porcentaje;
  document.getElementById('v-descuento').value = v.descuento || 0;
  document.getElementById('v-submit').textContent = '💾 Actualizar Venta';

  switchView('ventas');
  calcularEnTiempoReal();
  showToast(`Editando la venta de ${v.cliente}.`);
};

window.borrarVenta = async function borrarVenta(id) {
  if (!confirm('¿Seguro que deseas eliminar esta venta?')) return;
  try {
    await api.ventas.remove(id);
    state.ventas = state.ventas.filter((x) => x.id !== id);
    if (ventaEditId === id) {
      ventaEditId = null;
      document.getElementById('v-submit').textContent = '✨ Registrar Venta Individual';
    }
    await renderAll();
    showToast('Venta eliminada.');
  } catch (err) {
    alert(err.message);
  }
};

function ventasFiltradas() {
  if (!ventasBusqueda) return state.ventas;
  return state.ventas.filter((v) => {
    const nombre = (v.cliente || '').toLowerCase();
    const ci = (v.ci || '').toLowerCase();
    return nombre.includes(ventasBusqueda) || ci.includes(ventasBusqueda);
  });
}

function renderVentasPaginacion(totalPaginas) {
  const el = document.getElementById('ventas-paginacion');
  if (!el) return;

  if (totalPaginas <= 1) {
    el.innerHTML = '';
    return;
  }

  const paginas = [];
  const ventana = 2;
  for (let i = 1; i <= totalPaginas; i++) {
    if (i === 1 || i === totalPaginas || Math.abs(i - ventasPagina) <= ventana) paginas.push(i);
    else if (paginas[paginas.length - 1] !== '…') paginas.push('…');
  }

  const botones = paginas.map((p) => (
    p === '…'
      ? `<span class="pagina-ellipsis">…</span>`
      : `<button data-pagina="${p}" class="${p === ventasPagina ? 'pagina-activa' : ''}">${p}</button>`
  )).join('');

  el.innerHTML = `
    <button data-pagina="${ventasPagina - 1}" ${ventasPagina <= 1 ? 'disabled' : ''}>‹ Anterior</button>
    ${botones}
    <button data-pagina="${ventasPagina + 1}" ${ventasPagina >= totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
  `;
}

export function renderVentasTable() {
  const el = document.getElementById('ventas-table');
  const dashEl = document.getElementById('dash-recent');

  const rowsDash = state.ventas.map((v) => {
    const p = state.productos.find((x) => x.id === v.productoId);
    return `
      <tr>
        <td><b>${v.cliente}</b></td>
        <td><span class="pill">${p ? p.nombre : 'Eliminado'}</span></td>
        <td>${v.empresa || 'Particular'}</td>
        <td class="mono">${v.fecha}</td>
        <td class="amt-teal">${fmt(v.monto)}</td>
      </tr>
    `;
  });

  const filtradas = ventasFiltradas();
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / VENTAS_POR_PAGINA));
  if (ventasPagina > totalPaginas) ventasPagina = totalPaginas;
  if (ventasPagina < 1) ventasPagina = 1;
  const inicio = (ventasPagina - 1) * VENTAS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + VENTAS_POR_PAGINA);

  const rows = pagina.map((v) => {
    const p = state.productos.find((x) => x.id === v.productoId);
    return `
      <tr>
        <td><b>${v.cliente}</b></td>
        <td class="mono">${v.ci || '—'}</td>
        <td>${v.email || '—'}</td>
        <td><span class="pill">${p ? p.nombre : 'Eliminado'}</span></td>
        <td>${v.empresa || 'Particular'}</td>
        <td class="mono">${v.fecha}</td>
        <td class="amt-teal">${fmt(v.monto)}</td>
        <td class="amt-gold">${fmt(v.comision)}</td>
        <td style="white-space:nowrap;">
          <button class="btn secondary btn-sm" onclick="editarVenta('${v.id}')">✏️ Editar</button>
          <button class="btn danger btn-sm" onclick="borrarVenta('${v.id}')">🗑️ Borrar</button>
        </td>
      </tr>
    `;
  }).join('');

  if (dashEl) dashEl.innerHTML = `<table><thead><tr><th>Alumno</th><th>Diplomado</th><th>Empresa</th><th>Fecha</th><th>Monto</th></tr></thead><tbody>${rowsDash.slice(0, 5).join('')}</tbody></table>`;
  if (el) {
    el.innerHTML = filtradas.length
      ? `<table><thead><tr><th>Alumno</th><th>CI</th><th>Email</th><th>Diplomado</th><th>Empresa</th><th>Fecha</th><th>Monto</th><th>Comisión</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="empty-state">No se encontraron ventas para "${ventasBusqueda}".</div>`;
  }
  renderVentasPaginacion(totalPaginas);
}
