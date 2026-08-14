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

  document.getElementById('rep-enlace-submit').addEventListener('click', async () => {
    const tituloInput = document.getElementById('rep-enlace-titulo');
    const urlInput = document.getElementById('rep-enlace-url');
    const titulo = tituloInput.value.trim();
    const url = urlInput.value.trim();

    if (!titulo || !url) return alert('Completa el título y la URL del enlace.');

    try {
      const enlace = await api.enlaces.create({ titulo, url });
      state.enlaces.unshift(enlace);
      tituloInput.value = '';
      urlInput.value = '';
      renderEnlaces();
      showToast('Enlace guardado con éxito.');
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

window.borrarEnlace = async function borrarEnlace(id) {
  if (!confirm('¿Seguro que deseas eliminar este enlace?')) return;
  try {
    await api.enlaces.remove(id);
    state.enlaces = state.enlaces.filter((e) => e.id !== id);
    renderEnlaces();
    showToast('Enlace eliminado.');
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

function dominioDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (err) {
    return url;
  }
}

export function renderEnlaces() {
  const el = document.getElementById('repositorio-enlaces-grid');
  if (!el) return;

  if (state.enlaces.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay enlaces guardados todavía.</div>`;
    return;
  }

  el.innerHTML = state.enlaces.map((e) => `
    <div class="diploma-card">
      <div style="width:100%; height:80px; display:flex; align-items:center; justify-content:center; font-size:36px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:12px;">🔗</div>
      <div class="diploma-title" style="font-size:14px;" title="${e.titulo}">${e.titulo}</div>
      <div class="diploma-price" title="${e.url}">${dominioDe(e.url)}</div>
      <div class="diploma-actions">
        <a class="btn secondary btn-sm" href="${e.url}" target="_blank" rel="noopener noreferrer">🔗 Abrir</a>
        <button class="btn danger btn-sm" onclick="borrarEnlace('${e.id}')">🗑️ Borrar</button>
      </div>
    </div>
  `).join('');
}
