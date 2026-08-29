import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';
import { fmt } from '../format.js';
import { linkDiplomadoPublico } from '../public-site.js';

export function initPaginaPublica() {
  document.getElementById('pp-ver-catalogo-btn').addEventListener('click', () => {
    window.open(linkDiplomadoPublico(), '_blank');
  });

  document.getElementById('pp-tabla').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('button[data-editar]');
    const previewBtn = e.target.closest('button[data-preview]');
    const unpublishBtn = e.target.closest('button[data-despublicar]');

    if (editBtn) {
      window.abrirModalPublicacion(editBtn.dataset.editar);
      return;
    }

    if (previewBtn) {
      window.open(linkDiplomadoPublico(previewBtn.dataset.preview), '_blank');
      return;
    }

    if (unpublishBtn) {
      if (!confirm('¿Quitar este diplomado de la página pública? El contenido (foto, descripción) no se borra, solo deja de mostrarse.')) return;
      try {
        const id = unpublishBtn.dataset.despublicar;
        const actualizado = await api.productos.update(id, { publicado: false });
        const p = state.productos.find((x) => x.id === id);
        if (p) Object.assign(p, actualizado);
        showToast('Diplomado despublicado.');
        await renderAll();
      } catch (err) {
        alert(err.message);
      }
    }
  });
}

export function renderPaginaPublica() {
  const cont = document.getElementById('pp-tabla');
  if (!cont) return;

  if (state.productos.length === 0) {
    cont.innerHTML = '<div class="empty-state">Todavía no cargaste ningún diplomado.</div>';
    return;
  }

  cont.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Foto</th>
          <th>Diplomado</th>
          <th>Precio</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${state.productos.map((p) => {
          const foto = p.fotoUrl
            ? `<img src="${p.fotoUrl}" alt="" style="width:44px; height:44px; border-radius:8px; object-fit:cover;" />`
            : `<div style="width:44px; height:44px; border-radius:8px; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center;">🎓</div>`;

          const estadoPill = p.publicado
            ? '<span class="pill" style="color:var(--teal);">🟢 Publicado</span>'
            : '<span class="pill" style="color:var(--text-dim);">⚪ Borrador</span>';

          return `
            <tr>
              <td>${foto}</td>
              <td><b>${p.nombre}</b>${p.estado === 'concluido' ? ' <span class="pill" style="color:var(--coral);">CONCLUIDO</span>' : ''}</td>
              <td class="mono">${fmt(p.precio)}</td>
              <td>${estadoPill}</td>
              <td>
                <button class="btn secondary btn-sm" data-editar="${p.id}">✏️ Editar</button>
                <button class="btn secondary btn-sm" data-preview="${p.id}">👁️ Ver</button>
                ${p.publicado ? `<button class="btn danger btn-sm" data-despublicar="${p.id}">🚫 Despublicar</button>` : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
