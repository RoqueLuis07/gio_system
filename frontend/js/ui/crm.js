import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';

export function initCrm() {
  document.getElementById('crm-submit').addEventListener('click', async () => {
    const nombre = document.getElementById('crm-nombre').value.trim();
    const telefono = document.getElementById('crm-telefono').value.trim();
    const productoId = document.getElementById('crm-producto').value;
    const estado = document.getElementById('crm-estado').value;

    if (!nombre || !productoId) return alert('Por favor ingresa el Nombre y selecciona un Diplomado de Interés.');

    try {
      const prospecto = await api.prospectos.create({ nombre, telefono, productoId, estado });
      state.prospectos.push(prospecto);
      document.getElementById('crm-nombre').value = '';
      document.getElementById('crm-telefono').value = '';
      await renderAll();
      showToast('Prospecto agregado con éxito.');
    } catch (err) {
      alert(err.message);
    }
  });
}

window.borrarProspecto = async function borrarProspecto(id) {
  try {
    await api.prospectos.remove(id);
    state.prospectos = state.prospectos.filter((p) => p.id !== id);
    await renderAll();
    showToast('Prospecto eliminado.');
  } catch (err) {
    alert(err.message);
  }
};

export function renderCRM() {
  const el = document.getElementById('crm-table');
  if (!el) return;

  if (state.prospectos.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay prospectos agregados aún.</div>`;
    return;
  }

  el.innerHTML = `
    <table>
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Diplomado de Interés</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.prospectos.map((p) => {
          const prod = state.productos.find((x) => x.id === p.productoId);
          return `
            <tr>
              <td><b>${p.nombre}</b></td>
              <td>${p.telefono || '—'}</td>
              <td><span class="pill">${prod ? prod.nombre : '—'}</span></td>
              <td><span class="pill" style="color:var(--gold);">${p.estado.toUpperCase()}</span></td>
              <td class="mono">${p.fecha}</td>
              <td><button class="btn danger btn-sm" onclick="borrarProspecto('${p.id}')">🗑️ Borrar</button></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
