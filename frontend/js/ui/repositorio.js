import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';

const CATEGORIA_LABEL = { flyer: 'Flyer', documento: 'Documento', foto: 'Foto' };
const CATEGORIA_ICON = { flyer: '📢', documento: '📄', foto: '🖼️' };

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function esImagen(tipo) {
  return (tipo || '').startsWith('image/');
}

export function initRepositorio() {
  document.getElementById('rep-archivo-submit').addEventListener('click', async () => {
    const input = document.getElementById('rep-archivo-input');
    const categoria = document.getElementById('rep-archivo-categoria').value;
    const file = input.files[0];

    if (!file) return alert('Selecciona un archivo para subir.');

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('categoria', categoria);

    try {
      const archivo = await api.archivos.upload(formData);
      state.archivos.unshift(archivo);
      input.value = '';
      renderRepositorio();
      showToast('Archivo subido con éxito.');
    } catch (err) {
      alert(err.message);
    }
  });
}

window.borrarArchivo = async function borrarArchivo(id) {
  if (!confirm('¿Seguro que deseas eliminar este archivo?')) return;
  try {
    await api.archivos.remove(id);
    state.archivos = state.archivos.filter((a) => a.id !== id);
    renderRepositorio();
    showToast('Archivo eliminado.');
  } catch (err) {
    alert(err.message);
  }
};

export function renderRepositorio() {
  const el = document.getElementById('repositorio-grid');
  if (!el) return;

  if (state.archivos.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay archivos cargados todavía.</div>`;
    return;
  }

  el.innerHTML = state.archivos.map((a) => `
    <div class="diploma-card">
      ${esImagen(a.tipo)
        ? `<img src="${a.url}" alt="${a.nombre}" style="width:100%; height:140px; object-fit:cover; border-radius:10px; margin-bottom:12px;" />`
        : `<div style="width:100%; height:140px; display:flex; align-items:center; justify-content:center; font-size:42px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:12px;">${CATEGORIA_ICON[a.categoria] || '📄'}</div>`}
      <div class="diploma-title" style="font-size:14px;" title="${a.nombre}">${a.nombre}</div>
      <div class="diploma-price">${CATEGORIA_LABEL[a.categoria] || a.categoria} · ${formatBytes(a.tamano)}</div>
      <div class="diploma-actions">
        <a class="btn secondary btn-sm" href="${a.url}" target="_blank" rel="noopener noreferrer">👁️ Ver</a>
        <button class="btn danger btn-sm" onclick="borrarArchivo('${a.id}')">🗑️ Borrar</button>
      </div>
    </div>
  `).join('');
}

export function renderRepositorioConcluidos() {
  const el = document.getElementById('repositorio-diplomados-concluidos');
  if (!el) return;

  const concluidos = state.productos.filter((p) => p.estado === 'concluido');
  if (concluidos.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay diplomados concluidos.</div>`;
    return;
  }

  el.innerHTML = concluidos.map((p) => {
    const vs = state.ventas.filter((v) => v.productoId === p.id);
    return `
      <div class="diploma-card" style="opacity:0.85;">
        <div class="diploma-title">${p.nombre} <span class="pill" style="color:var(--coral);">CONCLUIDO</span></div>
        <div class="diploma-price">${vs.length} alumno(s) registrado(s)</div>
        <div class="diploma-actions">
          <button class="btn secondary btn-sm" onclick="concluirDiplomado('${p.id}')">↩️ Reestablecer</button>
        </div>
      </div>
    `;
  }).join('');
}
