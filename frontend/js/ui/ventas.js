import { api } from '../api.js';
import { state } from '../state.js';
import { fmt, moneyVal } from '../format.js';
import { showToast } from '../toast.js';
import { switchView } from '../nav.js';
import { renderAll } from '../render.js';
import { calcularEnTiempoReal } from './calculadora.js';

let ventaEditId = null;

export function initVentas() {
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

  const rows = state.ventas.map((v) => {
    const p = state.productos.find((x) => x.id === v.productoId);
    return `
      <tr>
        <td><b>${v.cliente}</b></td>
        <td class="mono">${v.ci || '—'}</td>
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
  if (el) el.innerHTML = `<table><thead><tr><th>Alumno</th><th>CI</th><th>Diplomado</th><th>Empresa</th><th>Fecha</th><th>Monto</th><th>Comisión</th><th>Acción</th></tr></thead><tbody>${rows}</tbody></table>`;
}
