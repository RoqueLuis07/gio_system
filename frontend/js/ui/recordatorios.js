import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';

let recModalId = null;

export function initRecordatorios() {
  document.getElementById('rec-submit').addEventListener('click', async () => {
    const titulo = document.getElementById('rec-titulo').value.trim();
    const fecha = document.getElementById('rec-fecha').value;
    const cliente = document.getElementById('rec-cliente').value.trim();

    if (!titulo || !fecha) return alert('Ingresa un título y fecha para el recordatorio.');

    try {
      const recordatorio = await api.recordatorios.create({ titulo, fecha, cliente });
      state.recordatorios.push(recordatorio);
      document.getElementById('rec-titulo').value = '';
      document.getElementById('rec-cliente').value = '';
      await renderAll();
      showToast('Recordatorio agendado.');
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('rec-modal-cerrar-btn').addEventListener('click', () => {
    document.getElementById('rec-modal-overlay').style.display = 'none';
    recModalId = null;
  });

  document.getElementById('rec-modal-imagen-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !recModalId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = state.recordatorios.find((x) => x.id === recModalId);
      if (r) {
        r.imagen = reader.result;
        document.getElementById('rec-modal-imagen-preview').innerHTML = `<img src="${r.imagen}" style="max-width:100%; border-radius:8px; border:1px solid var(--border);" />`;
      }
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('rec-modal-guardar-btn').addEventListener('click', async () => {
    const r = state.recordatorios.find((x) => x.id === recModalId);
    if (!r) return;
    const comentario = document.getElementById('rec-modal-comentario').value;

    try {
      const actualizado = await api.recordatorios.update(r.id, { comentario, imagen: r.imagen });
      Object.assign(r, actualizado);
      document.getElementById('rec-modal-overlay').style.display = 'none';
      recModalId = null;
      await renderAll();
      showToast('Recordatorio actualizado con comentario/imagen.');
    } catch (err) {
      alert(err.message);
    }
  });
}

window.toggleRecordatorio = async function toggleRecordatorio(id) {
  const r = state.recordatorios.find((x) => x.id === id);
  if (!r) return;
  try {
    const actualizado = await api.recordatorios.update(id, { completado: !r.completado });
    Object.assign(r, actualizado);
    await renderAll();
  } catch (err) {
    alert(err.message);
  }
};

window.borrarRecordatorio = async function borrarRecordatorio(id) {
  try {
    await api.recordatorios.remove(id);
    state.recordatorios = state.recordatorios.filter((x) => x.id !== id);
    await renderAll();
    showToast('Recordatorio eliminado.');
  } catch (err) {
    alert(err.message);
  }
};

window.abrirDetalleRecordatorio = function abrirDetalleRecordatorio(id) {
  const r = state.recordatorios.find((x) => x.id === id);
  if (!r) return;
  recModalId = id;

  document.getElementById('rec-modal-titulo').textContent = r.titulo;
  document.getElementById('rec-modal-info').textContent = `${r.fecha} · ${r.cliente || 'Sin contacto asociado'}`;
  document.getElementById('rec-modal-comentario').value = r.comentario || '';

  const preview = document.getElementById('rec-modal-imagen-preview');
  preview.innerHTML = r.imagen
    ? `<img src="${r.imagen}" style="max-width:100%; border-radius:8px; border:1px solid var(--border);" />`
    : '<span style="color:var(--text-faint); font-size:12.5px;">Sin imagen adjunta.</span>';

  document.getElementById('rec-modal-imagen-input').value = '';
  document.getElementById('rec-modal-overlay').style.display = 'flex';
};

export function renderRecordatorios() {
  const el = document.getElementById('rec-table');
  const alertText = document.getElementById('dash-alert-text');

  const pendientes = state.recordatorios.filter((r) => !r.completado);
  if (alertText) {
    alertText.textContent = pendientes.length > 0
      ? `Tienes ${pendientes.length} recordatorio(s) pendiente(s) próximo(s).`
      : 'No tienes recordatorios pendientes.';
  }

  if (!el) return;
  if (state.recordatorios.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay recordatorios agendados.</div>`;
    return;
  }

  el.innerHTML = `
    <table>
      <thead><tr><th>Estado</th><th>Tarea / Título</th><th>Fecha</th><th>Contacto</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.recordatorios.map((r) => `
          <tr style="${r.completado ? 'opacity:0.5; text-decoration:line-through;' : ''}">
            <td><input type="checkbox" ${r.completado ? 'checked' : ''} onclick="toggleRecordatorio('${r.id}')" /></td>
            <td><b>${r.titulo}</b> ${(r.comentario || r.imagen) ? '<span class="pill" style="margin-left:6px;">📝</span>' : ''}</td>
            <td class="mono">${r.fecha}</td>
            <td>${r.cliente || '—'}</td>
            <td style="white-space:nowrap;">
              <button class="btn secondary btn-sm" onclick="abrirDetalleRecordatorio('${r.id}')">👁️ Detalle</button>
              <button class="btn danger btn-sm" onclick="borrarRecordatorio('${r.id}')">🗑️ Borrar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
