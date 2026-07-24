import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';

function updateWaPreview() {
  const clientIndex = document.getElementById('wa-cliente-select').value;
  const tplId = document.getElementById('wa-plantilla-select').value;

  let nombre = document.getElementById('wa-nombre').value || '[Nombre]';
  let diplomado = '[Diplomado]';

  if (clientIndex !== '') {
    const v = state.ventas[clientIndex];
    if (v) {
      nombre = v.cliente;
      document.getElementById('wa-nombre').value = v.cliente;
      document.getElementById('wa-telefono').value = v.telefono || '';
      const p = state.productos.find((x) => x.id === v.productoId);
      if (p) diplomado = p.nombre;
    }
  }

  const tpl = state.plantillas.find((t) => t.id === tplId);
  if (tpl) {
    const txt = tpl.cuerpo.replace(/{nombre}/g, nombre).replace(/{diplomado}/g, diplomado);
    document.getElementById('wa-preview').value = txt;
  }
}

export function initWhatsapp() {
  document.getElementById('wa-cliente-select').addEventListener('change', updateWaPreview);
  document.getElementById('wa-plantilla-select').addEventListener('change', updateWaPreview);

  document.getElementById('tpl-add-btn').addEventListener('click', async () => {
    const titulo = document.getElementById('tpl-titulo').value.trim();
    const cuerpo = document.getElementById('tpl-cuerpo').value.trim();

    if (!titulo || !cuerpo) return alert('Ingresa título y texto para la plantilla.');

    try {
      const plantilla = await api.plantillas.create({ titulo, cuerpo });
      state.plantillas.push(plantilla);
      document.getElementById('tpl-titulo').value = '';
      document.getElementById('tpl-cuerpo').value = '';
      await renderAll();
      showToast('Nueva plantilla añadida.');
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('wa-send-btn').addEventListener('click', () => {
    const tel = document.getElementById('wa-telefono').value.replace(/\D/g, '');
    const txt = encodeURIComponent(document.getElementById('wa-preview').value);
    if (!tel) return alert('Ingresa un número de teléfono válido.');
    window.open(`https://wa.me/${tel}?text=${txt}`, '_blank');
  });
}

window.editarPlantilla = async function editarPlantilla(id) {
  const t = state.plantillas.find((x) => x.id === id);
  if (!t) return;
  const nuevoTitulo = prompt('Editar título de la plantilla:', t.titulo);
  if (nuevoTitulo === null) return;
  const nuevoCuerpo = prompt('Editar cuerpo de la plantilla (usa {nombre} y {diplomado}):', t.cuerpo);
  if (nuevoCuerpo === null) return;

  try {
    const actualizada = await api.plantillas.update(id, {
      titulo: nuevoTitulo.trim() || t.titulo,
      cuerpo: nuevoCuerpo.trim() || t.cuerpo,
    });
    Object.assign(t, actualizada);
    await renderAll();
    showToast('Plantilla actualizada.');
  } catch (err) {
    alert(err.message);
  }
};

window.borrarPlantilla = async function borrarPlantilla(id) {
  if (!confirm('¿Seguro que deseas eliminar esta plantilla?')) return;
  try {
    await api.plantillas.remove(id);
    state.plantillas = state.plantillas.filter((x) => x.id !== id);
    await renderAll();
    showToast('Plantilla eliminada.');
  } catch (err) {
    alert(err.message);
  }
};

export function renderPlantillas() {
  const el = document.getElementById('tpl-table');
  if (!el) return;

  if (state.plantillas.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay plantillas guardadas.</div>`;
    return;
  }

  el.innerHTML = `
    <table>
      <thead><tr><th>Título</th><th>Cuerpo</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.plantillas.map((t) => `
          <tr>
            <td><b>${t.titulo}</b></td>
            <td style="max-width:360px; white-space:normal;">${t.cuerpo}</td>
            <td style="white-space:nowrap;">
              <button class="btn secondary btn-sm" onclick="editarPlantilla('${t.id}')">✏️ Editar</button>
              <button class="btn danger btn-sm" onclick="borrarPlantilla('${t.id}')">🗑️ Borrar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function renderWaSelects() {
  document.getElementById('wa-cliente-select').innerHTML = '<option value="">— Seleccionar Alumno —</option>' +
    state.ventas.map((v, i) => `<option value="${i}">${v.cliente}</option>`).join('');
  document.getElementById('wa-plantilla-select').innerHTML = state.plantillas.map((t) => `<option value="${t.id}">${t.titulo}</option>`).join('');
  updateWaPreview();
}
