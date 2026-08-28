window.Views = window.Views || {};

Views.categorias = (function () {
  let categorias = [];

  async function render(container) {
    container.innerHTML = '<div class="loading">Cargando…</div>';
    categorias = await Api.get('/categorias');

    container.innerHTML = `
      <div class="view-toolbar">
        <p class="view-hint">Las categorías organizan el catálogo público y aparecen como filtros en el menú del sitio.</p>
        <button class="btn btn-primary" id="btn-nueva-cat">➕ Nueva categoría</button>
      </div>
      <div id="cat-lista"></div>
    `;
    document.getElementById('btn-nueva-cat').addEventListener('click', () => abrirEditor(null));
    pintar();
  }

  function pintar() {
    const el = document.getElementById('cat-lista');
    if (categorias.length === 0) {
      el.innerHTML = '<div class="empty-state">Todavía no creaste ninguna categoría.</div>';
      return;
    }
    el.innerHTML = `
      <div class="cat-grid">
        ${categorias.sort((a, b) => (a.orden || 0) - (b.orden || 0)).map((c) => `
          <div class="cat-card">
            <div class="cat-card-icono">${escapeHtml(c.icono)}</div>
            <div class="cat-card-nombre">${escapeHtml(c.nombre)}</div>
            <div class="cat-card-actions">
              <button class="icon-btn" data-edit="${c.id}" title="Editar">✏️</button>
              <button class="icon-btn icon-btn-danger" data-del="${c.id}" title="Eliminar">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    el.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => abrirEditor(b.dataset.edit)));
    el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => eliminar(b.dataset.del)));
  }

  function abrirEditor(id) {
    const c = id ? categorias.find((c) => c.id === id) : { nombre: '', icono: '📦', orden: categorias.length };
    Modal.open(`
      <div class="modal-head"><h3>${id ? 'Editar categoría' : 'Nueva categoría'}</h3><button class="modal-x" id="cat-close">✕</button></div>
      <div class="modal-scroll">
        <form id="cat-form" class="form-grid">
          <label>Ícono / emoji
            <input id="f-icono" type="text" maxlength="4" value="${escapeAttr(c.icono)}" style="font-size:20px;text-align:center" />
          </label>
          <label>Orden
            <input id="f-orden" type="number" value="${c.orden || 0}" />
          </label>
          <label class="span-2">Nombre
            <input id="f-nombre" type="text" value="${escapeAttr(c.nombre)}" required placeholder="Ej: Electrodomésticos" />
          </label>
          <div class="modal-actions span-2">
            <button type="button" class="btn btn-ghost" id="cat-cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `);
    document.getElementById('cat-close').addEventListener('click', Modal.close);
    document.getElementById('cat-cancelar').addEventListener('click', Modal.close);
    document.getElementById('cat-form').addEventListener('submit', (e) => guardar(e, id));
  }

  async function guardar(e, id) {
    e.preventDefault();
    const body = {
      nombre: document.getElementById('f-nombre').value.trim(),
      icono: document.getElementById('f-icono').value.trim() || '📦',
      orden: Number(document.getElementById('f-orden').value) || 0,
    };
    try {
      if (id) {
        const act = await Api.put('/categorias/' + id, body);
        Object.assign(categorias.find((c) => c.id === id), act);
        Toast.ok('Categoría actualizada.');
      } else {
        categorias.push(await Api.post('/categorias', body));
        Toast.ok('Categoría creada.');
      }
      Modal.close();
      pintar();
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function eliminar(id) {
    const c = categorias.find((c) => c.id === id);
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"? Los productos que la usan quedarán sin categoría.`)) return;
    try {
      await Api.del('/categorias/' + id);
      categorias = categorias.filter((x) => x.id !== id);
      pintar();
      Toast.ok('Categoría eliminada.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }

  return { render };
})();
