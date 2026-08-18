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

function dominioDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (err) {
    return url;
  }
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

    if (!titulo || !url) return alert('Ingresa título y URL del enlace.');

    try {
      const enlace = await api.enlaces.create({ titulo, url });
      state.enlaces.unshift(enlace);
      tituloInput.value = '';
      urlInput.value = '';
      renderRepositorio();
      showToast('Enlace guardado con éxito.');
    } catch (err) {
      alert(err.message);
    }
  });
}

window.editarArchivo = async function editarArchivo(id) {
  const a = state.archivos.find((x) => x.id === id);
  if (!a) return;

  const nuevoNombre = prompt('Nuevo nombre del archivo:', a.nombre);
  if (nuevoNombre === null) return;
  if (!nuevoNombre.trim()) return alert('El nombre no puede estar vacío.');

  try {
    const actualizado = await api.archivos.rename(id, nuevoNombre.trim());
    Object.assign(a, actualizado);
    renderRepositorio();
    showToast('Archivo renombrado.');
  } catch (err) {
    alert(err.message);
  }
};

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

window.editarEnlace = async function editarEnlace(id) {
  const e = state.enlaces.find((x) => x.id === id);
  if (!e) return;

  const nuevoTitulo = prompt('Nuevo título del enlace:', e.titulo);
  if (nuevoTitulo === null) return;
  if (!nuevoTitulo.trim()) return alert('El título no puede estar vacío.');

  const nuevaUrl = prompt('Nueva URL del enlace:', e.url);
  if (nuevaUrl === null) return;
  if (!nuevaUrl.trim()) return alert('La URL no puede estar vacía.');

  try {
    const actualizado = await api.enlaces.update(id, { titulo: nuevoTitulo.trim(), url: nuevaUrl.trim() });
    Object.assign(e, actualizado);
    renderRepositorio();
    showToast('Enlace actualizado.');
  } catch (err) {
    alert(err.message);
  }
};

window.borrarEnlace = async function borrarEnlace(id) {
  if (!confirm('¿Seguro que deseas eliminar este enlace?')) return;
  try {
    await api.enlaces.remove(id);
    state.enlaces = state.enlaces.filter((e) => e.id !== id);
    renderRepositorio();
    showToast('Enlace eliminado.');
  } catch (err) {
    alert(err.message);
  }
};

function tarjetaArchivo(a) {
  return `
    <div class="diploma-card">
      ${esImagen(a.tipo)
        ? `<img src="${a.url}" alt="${a.nombre}" style="width:100%; height:140px; object-fit:cover; border-radius:10px; margin-bottom:12px;" />`
        : `<div style="width:100%; height:140px; display:flex; align-items:center; justify-content:center; font-size:42px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:12px;">${CATEGORIA_ICON[a.categoria] || '📄'}</div>`}
      <div class="diploma-title" style="font-size:14px;" title="${a.nombre}">${a.nombre}</div>
      <div class="diploma-price">${CATEGORIA_LABEL[a.categoria] || a.categoria} · ${formatBytes(a.tamano)}</div>
      <div class="diploma-actions">
        <a class="btn secondary btn-sm" href="${a.url}" target="_blank" rel="noopener noreferrer">👁️ Ver</a>
        <button class="btn secondary btn-sm" onclick="editarArchivo('${a.id}')">✏️ Editar</button>
        <button class="btn danger btn-sm" onclick="borrarArchivo('${a.id}')">🗑️ Borrar</button>
      </div>
    </div>
  `;
}

function tarjetaEnlace(e) {
  return `
    <div class="diploma-card">
      <div style="width:100%; height:140px; display:flex; align-items:center; justify-content:center; font-size:42px; background:rgba(255,255,255,0.03); border-radius:10px; margin-bottom:12px;">🔗</div>
      <div class="diploma-title" style="font-size:14px;" title="${e.titulo}">${e.titulo}</div>
      <div class="diploma-price">Enlace · ${dominioDe(e.url)}</div>
      <div class="diploma-actions">
        <a class="btn secondary btn-sm" href="${e.url}" target="_blank" rel="noopener noreferrer">🔗 Abrir</a>
        <button class="btn secondary btn-sm" onclick="editarEnlace('${e.id}')">✏️ Editar</button>
        <button class="btn danger btn-sm" onclick="borrarEnlace('${e.id}')">🗑️ Borrar</button>
      </div>
    </div>
  `;
}

export function renderRepositorio() {
  const el = document.getElementById('repositorio-grid');
  if (!el) return;

  if (state.archivos.length === 0 && state.enlaces.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay archivos ni enlaces guardados todavía.</div>`;
    return;
  }

  el.innerHTML = state.archivos.map(tarjetaArchivo).join('') + state.enlaces.map(tarjetaEnlace).join('');
}
