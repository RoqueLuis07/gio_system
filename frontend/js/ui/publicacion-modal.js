import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';
import { primeraPaginaComoImagen } from '../pdf-thumb.js';
import { fmt, attachMoneyInput, moneyVal } from '../format.js';
import { linkDiplomadoPublico as linkPublico } from '../public-site.js';

let productoActualId = null;
let fotoPendiente = null;
let brochurePendiente = null;

function renderDocentesLista(nombres) {
  const cont = document.getElementById('pub-docentes-lista');
  const lista = nombres.length > 0 ? nombres : [''];
  cont.innerHTML = lista.map((nombre) => `
    <div style="display:flex; gap:6px;">
      <input type="text" class="pub-docente-input" value="${nombre.replace(/"/g, '&quot;')}" placeholder="Ej: Marcelo Meza" style="flex:1;" />
      <button type="button" class="btn danger btn-sm pub-docente-quitar" style="width:auto; padding:4px 10px;">✕</button>
    </div>
  `).join('');
}

function leerDocentes() {
  return Array.from(document.querySelectorAll('.pub-docente-input'))
    .map((el) => el.value.trim())
    .filter(Boolean)
    .join(', ');
}

function pintarModal(p) {
  const nombresDocentes = (p.docentes || '').split(',').map((n) => n.trim()).filter(Boolean);
  renderDocentesLista(nombresDocentes);

  document.getElementById('pub-descripcion').innerHTML = p.descripcionPromo || '';
  document.getElementById('pub-precio-actual').textContent = fmt(p.precio);
  document.getElementById('pub-precio-oferta').value = p.precioOferta ? Number(p.precioOferta).toLocaleString('es-PY') : '';
  document.getElementById('pub-publicado').checked = !!p.publicado;

  const preview = document.getElementById('pub-foto-preview');
  preview.src = p.fotoUrl || '';
  preview.style.display = p.fotoUrl ? 'block' : 'none';

  const brochureBox = document.getElementById('pub-brochure-actual');
  if (p.brochurePdfUrl) {
    brochureBox.style.display = 'block';
    document.getElementById('pub-brochure-link').href = p.brochurePdfUrl;
  } else {
    brochureBox.style.display = 'none';
  }

  const linkBox = document.getElementById('pub-link-box');
  if (p.publicado) {
    linkBox.style.display = 'block';
    linkBox.innerHTML = `🔗 <a href="${linkPublico(p.id)}" target="_blank" style="color:var(--teal);">${linkPublico(p.id)}</a> <button class="btn secondary btn-sm" id="pub-copy-link-btn" style="margin-top:8px; width:auto; padding:4px 10px;">📋 Copiar Link</button>`;
  } else {
    linkBox.style.display = 'none';
    linkBox.innerHTML = '';
  }
}

window.abrirModalPublicacion = function abrirModalPublicacion(id) {
  const p = state.productos.find((x) => x.id === id);
  if (!p) return;

  productoActualId = id;
  fotoPendiente = null;
  brochurePendiente = null;
  document.getElementById('pub-foto-input').value = '';
  document.getElementById('pub-brochure-input').value = '';
  pintarModal(p);
  document.getElementById('pub-modal-overlay').style.display = 'flex';
};

function cerrarModal() {
  document.getElementById('pub-modal-overlay').style.display = 'none';
  productoActualId = null;
  fotoPendiente = null;
  brochurePendiente = null;
}

function wireRteToolbars() {
  document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('.rte-toolbar button[data-cmd]');
    if (!btn) return;
    e.preventDefault(); // evita perder el foco/selección del editor antes de aplicar el comando

    const cmd = btn.dataset.cmd;
    if (cmd === 'createLink') {
      const url = prompt('URL del link (incluye https://):');
      if (!url) return;
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
  });
}

export function initPublicacionModal() {
  wireRteToolbars();
  attachMoneyInput('pub-precio-oferta');

  document.getElementById('pub-close-btn').addEventListener('click', cerrarModal);

  document.getElementById('pub-docente-agregar-btn').addEventListener('click', () => {
    const cont = document.getElementById('pub-docentes-lista');
    const div = document.createElement('div');
    div.style.cssText = 'display:flex; gap:6px;';
    div.innerHTML = `
      <input type="text" class="pub-docente-input" placeholder="Ej: Marcelo Meza" style="flex:1;" />
      <button type="button" class="btn danger btn-sm pub-docente-quitar" style="width:auto; padding:4px 10px;">✕</button>
    `;
    cont.appendChild(div);
    div.querySelector('input').focus();
  });

  document.getElementById('pub-docentes-lista').addEventListener('click', (e) => {
    if (!e.target.classList.contains('pub-docente-quitar')) return;
    const filas = document.querySelectorAll('#pub-docentes-lista > div');
    if (filas.length <= 1) {
      e.target.closest('div').querySelector('input').value = '';
      return;
    }
    e.target.closest('div').remove();
  });

  document.getElementById('pub-preview-btn').addEventListener('click', () => {
    if (!productoActualId) return;
    window.open(linkPublico(productoActualId), '_blank');
  });

  document.getElementById('pub-foto-input').addEventListener('change', (e) => {
    fotoPendiente = e.target.files[0] || null;
    if (fotoPendiente) {
      document.getElementById('pub-foto-preview').src = URL.createObjectURL(fotoPendiente);
      document.getElementById('pub-foto-preview').style.display = 'block';
    }
  });

  document.getElementById('pub-brochure-input').addEventListener('change', async (e) => {
    brochurePendiente = e.target.files[0] || null;
    if (!brochurePendiente) return;

    const preview = document.getElementById('pub-foto-preview');
    const status = document.getElementById('pub-brochure-status');
    status.textContent = '⏳ Generando foto a partir del PDF...';
    status.style.display = 'block';

    try {
      const miniatura = await primeraPaginaComoImagen(brochurePendiente);
      if (miniatura) {
        fotoPendiente = miniatura;
        preview.src = URL.createObjectURL(miniatura);
        preview.style.display = 'block';
        status.textContent = '✅ Foto generada a partir de la primera página.';
        setTimeout(() => { status.style.display = 'none'; }, 3000);
      }
    } catch (err) {
      console.error('No se pudo generar la miniatura del PDF:', err);
      status.textContent = '⚠️ No se pudo generar la foto automáticamente (podés subir una manualmente).';
    }
  });

  document.getElementById('pub-brochure-quitar-btn').addEventListener('click', async () => {
    if (!productoActualId || !confirm('¿Quitar el PDF del broshure?')) return;
    try {
      const actualizado = await api.productos.update(productoActualId, { brochurePdfUrl: '' });
      const p = state.productos.find((x) => x.id === productoActualId);
      if (p) Object.assign(p, actualizado);
      pintarModal(p);
      await renderAll();
      showToast('PDF quitado.');
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('pub-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'pub-modal-overlay') cerrarModal();
  });

  document.getElementById('pub-link-box').addEventListener('click', async (e) => {
    if (e.target.id !== 'pub-copy-link-btn') return;
    try {
      await navigator.clipboard.writeText(linkPublico(productoActualId));
      showToast('Link copiado al portapapeles.');
    } catch (err) {
      alert('No se pudo copiar el link automáticamente. Copiálo manualmente.');
    }
  });

  document.getElementById('pub-save-btn').addEventListener('click', async () => {
    if (!productoActualId) return;

    const docentes = leerDocentes();
    const descripcionPromo = document.getElementById('pub-descripcion').innerHTML.trim();
    const precioOferta = moneyVal('pub-precio-oferta');
    const publicado = document.getElementById('pub-publicado').checked;

    const btn = document.getElementById('pub-save-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      let actualizado = await api.productos.update(productoActualId, { docentes, descripcionPromo, precioOferta, publicado });

      if (fotoPendiente) {
        const formData = new FormData();
        formData.append('foto', fotoPendiente);
        actualizado = await api.productos.uploadFoto(productoActualId, formData);
      }

      if (brochurePendiente) {
        const formData = new FormData();
        formData.append('brochure', brochurePendiente);
        actualizado = await api.productos.uploadBrochure(productoActualId, formData);
      }

      const p = state.productos.find((x) => x.id === productoActualId);
      if (p) Object.assign(p, actualizado);

      fotoPendiente = null;
      brochurePendiente = null;
      document.getElementById('pub-foto-input').value = '';
      document.getElementById('pub-brochure-input').value = '';
      pintarModal(p);
      await renderAll();
      showToast('Publicación guardada.');
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Guardar Publicación';
    }
  });
}
