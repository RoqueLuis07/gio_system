import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';
import { abrirWhatsapp } from '../whatsapp.js';

let modoActual = 'new';

function plantillasWhatsapp() {
  return state.plantillas.filter((t) => t.canal !== 'email');
}

function updateWaPreview() {
  const tplId = document.getElementById('wa2-plantilla-select').value;
  const nombre = document.getElementById('wa2-nombre').value.trim() || '[Nombre]';
  const diplomado = document.getElementById('wa2-diplomado').value.trim() || '[Diplomado]';

  const tpl = plantillasWhatsapp().find((t) => t.id === tplId);
  if (tpl) {
    const txt = tpl.cuerpo.replace(/{nombre}/g, nombre).replace(/{diplomado}/g, diplomado);
    document.getElementById('wa2-preview').value = txt;
  }
}

function syncTplModeSelect() {
  const modeSelect = document.getElementById('wa2-tpl-mode-select');
  modeSelect.innerHTML = '<option value="new">➕ Crear Nueva Plantilla</option>' +
    plantillasWhatsapp().map((t) => `<option value="${t.id}">✏️ Editar: ${t.titulo}</option>`).join('');

  modeSelect.value = plantillasWhatsapp().some((t) => t.id === modoActual) ? modoActual : 'new';
  modoActual = modeSelect.value;
}

export function renderWaModuloOptions() {
  document.getElementById('wa2-plantilla-select').innerHTML = plantillasWhatsapp().map((t) => `<option value="${t.id}">${t.titulo}</option>`).join('');
  syncTplModeSelect();
  updateWaPreview();
}

function aplicarModoEditor() {
  const saveBtn = document.getElementById('wa2-tpl-save-btn');
  const deleteBtn = document.getElementById('wa2-tpl-delete-btn');
  const tituloInput = document.getElementById('wa2-tpl-titulo');
  const cuerpoInput = document.getElementById('wa2-tpl-cuerpo');

  if (modoActual === 'new') {
    tituloInput.value = '';
    cuerpoInput.value = '';
    saveBtn.textContent = 'Añadir Plantilla';
    saveBtn.className = 'btn secondary';
    deleteBtn.style.display = 'none';
  } else {
    const tpl = plantillasWhatsapp().find((t) => t.id === modoActual);
    if (tpl) {
      tituloInput.value = tpl.titulo;
      cuerpoInput.value = tpl.cuerpo;
      saveBtn.textContent = 'Guardar Cambios';
      saveBtn.className = 'btn gold';
      deleteBtn.style.display = 'inline-flex';
    }
  }
}

export function initWaModulo() {
  const fileInput = document.getElementById('wa2-archivo');
  const fileInfoBox = document.getElementById('wa2-file-info-box');
  const fileNameLabel = document.getElementById('wa2-file-name-label');
  const btnRemoveFile = document.getElementById('wa2-btn-remove-file');

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileNameLabel.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileInfoBox.style.display = 'flex';

    if (file.type.startsWith('image/')) {
      try {
        const item = new ClipboardItem({ [file.type]: file });
        await navigator.clipboard.write([item]);
        showToast('Imagen copiada al portapapeles. ¡Solo dale Ctrl+V al abrir el chat!');
      } catch (err) {
        showToast('Archivo listo para adjuntar manualmente.');
      }
    } else {
      showToast('Archivo listo. Adjúntalo en el chat con el botón de clip.');
    }
  });

  btnRemoveFile.addEventListener('click', () => {
    fileInput.value = '';
    fileInfoBox.style.display = 'none';
    showToast('Archivo quitado.');
  });

  ['wa2-nombre', 'wa2-diplomado', 'wa2-plantilla-select'].forEach((id) => {
    document.getElementById(id).addEventListener('input', updateWaPreview);
    document.getElementById(id).addEventListener('change', updateWaPreview);
  });

  document.getElementById('wa2-tpl-mode-select').addEventListener('change', (e) => {
    modoActual = e.target.value;
    aplicarModoEditor();
  });

  document.getElementById('wa2-tpl-save-btn').addEventListener('click', async () => {
    const titulo = document.getElementById('wa2-tpl-titulo').value.trim();
    const cuerpo = document.getElementById('wa2-tpl-cuerpo').value.trim();

    if (!titulo || !cuerpo) return alert('Ingresa un título y el cuerpo del mensaje.');

    try {
      if (modoActual === 'new') {
        const nueva = await api.plantillas.create({ titulo, cuerpo, canal: 'whatsapp' });
        state.plantillas.push(nueva);
        showToast('Nueva plantilla creada');
      } else {
        const actualizada = await api.plantillas.update(modoActual, { titulo, cuerpo, canal: 'whatsapp' });
        const tpl = state.plantillas.find((t) => t.id === modoActual);
        if (tpl) Object.assign(tpl, actualizada);
        showToast('Plantilla actualizada');
      }

      modoActual = 'new';
      await renderAll();
      aplicarModoEditor();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('wa2-tpl-delete-btn').addEventListener('click', async () => {
    if (modoActual === 'new' || !confirm('¿Deseas eliminar esta plantilla?')) return;

    try {
      await api.plantillas.remove(modoActual);
      state.plantillas = state.plantillas.filter((t) => t.id !== modoActual);
      modoActual = 'new';
      showToast('Plantilla eliminada');
      await renderAll();
      aplicarModoEditor();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('wa2-send-btn').addEventListener('click', () => {
    const tel = document.getElementById('wa2-telefono').value;
    const txt = document.getElementById('wa2-preview').value;

    if (!tel.replace(/\D/g, '')) return alert('Ingresa un número de teléfono válido.');

    abrirWhatsapp(tel, txt);
  });

  aplicarModoEditor();
}
