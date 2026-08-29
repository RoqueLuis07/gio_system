window.Views = window.Views || {};

Views.productos = (function () {
  let productos = [];
  let categorias = [];
  let editor = null;
  let imagenesActuales = [];
  let soloOfertas = false;

  function fmtGs(n) {
    return '₲ ' + Math.round(n || 0).toLocaleString('es-PY');
  }

  async function render(container, opts) {
    soloOfertas = !!(opts && opts.soloOfertas);
    container.innerHTML = '<div class="loading">Cargando…</div>';
    [productos, categorias] = await Promise.all([Api.get('/productos'), Api.get('/categorias')]);

    container.innerHTML = `
      <div class="view-toolbar">
        <div class="search-mini">
          <input id="prod-buscar" type="search" placeholder="Buscar productos..." />
        </div>
        <select id="prod-filtro-cat" class="select-mini">
          <option value="">Todas las categorías</option>
          ${categorias.map((c) => `<option value="${c.id}">${escapeHtml(c.icono + ' ' + c.nombre)}</option>`).join('')}
        </select>
        <button class="btn btn-primary" id="btn-nuevo-producto">➕ Nueva publicación</button>
      </div>
      ${soloOfertas ? '<p class="view-hint">🔥 Mostrando solo productos con precio de oferta activo.</p>' : ''}
      <div id="prod-tabla-wrap"></div>
    `;

    document.getElementById('btn-nuevo-producto').addEventListener('click', () => abrirEditor(null));
    document.getElementById('prod-buscar').addEventListener('input', pintarTabla);
    document.getElementById('prod-filtro-cat').addEventListener('change', pintarTabla);

    pintarTabla();
  }

  function catNombre(id) {
    const c = categorias.find((c) => c.id === id);
    return c ? c.icono + ' ' + c.nombre : '<span class="muted">Sin categoría</span>';
  }

  function pintarTabla() {
    const q = (document.getElementById('prod-buscar').value || '').trim().toLowerCase();
    const cat = document.getElementById('prod-filtro-cat').value;
    const ordenable = !!cat && !q && !soloOfertas;

    let filtrados = productos.filter((p) => {
      const okQ = !q || p.nombre.toLowerCase().includes(q);
      const okCat = !cat || p.categoriaId === cat;
      const okOferta = !soloOfertas || (p.precioOferta && p.precioOferta < p.precio);
      return okQ && okCat && okOferta;
    });

    filtrados = cat
      ? filtrados.sort((a, b) => (a.orden || 0) - (b.orden || 0))
      : filtrados.sort((a, b) => catNombreTexto(a.categoriaId).localeCompare(catNombreTexto(b.categoriaId)) || (a.orden || 0) - (b.orden || 0));

    const wrap = document.getElementById('prod-tabla-wrap');
    if (filtrados.length === 0) {
      wrap.innerHTML = '<div class="empty-state">No hay productos que coincidan.</div>';
      return;
    }

    wrap.innerHTML = `
      ${ordenable ? '<p class="view-hint">Usá las flechas ↑ ↓ para elegir el orden en que aparecen en la fila de esa categoría en el inicio (los primeros son los que se muestran).</p>' : ''}
      <div class="prod-list">
        ${filtrados.map((p, i) => rowHtml(p, ordenable, i, filtrados)).join('')}
      </div>
    `;

    wrap.querySelectorAll('[data-edit]').forEach((el) => el.addEventListener('click', () => abrirEditor(el.dataset.edit)));
    wrap.querySelectorAll('[data-dup]').forEach((el) => el.addEventListener('click', () => duplicar(el.dataset.dup)));
    wrap.querySelectorAll('[data-del]').forEach((el) => el.addEventListener('click', () => eliminar(el.dataset.del)));
    wrap.querySelectorAll('[data-toggle-pub]').forEach((el) => el.addEventListener('click', () => togglePublicado(el.dataset.togglePub)));
    wrap.querySelectorAll('[data-mover]').forEach((el) => el.addEventListener('click', () => mover(el.dataset.mover, el.dataset.dir)));
  }

  function stockTexto(stock) {
    if (stock === null || stock === undefined) return 'Stock: sin control';
    return 'Stock: ' + stock;
  }

  function catNombreTexto(id) {
    const c = categorias.find((c) => c.id === id);
    return c ? c.nombre : 'zzz';
  }

  function rowHtml(p, ordenable, i, lista) {
    const img = (p.imagenes && p.imagenes[0]) || '';
    const enOferta = p.precioOferta && p.precioOferta < p.precio;
    return `
      <div class="prod-row">
        ${ordenable ? `
          <div class="prod-row-orden">
            <button class="icon-btn" data-mover="${p.id}" data-dir="up" ${i === 0 ? 'disabled' : ''} title="Subir">▲</button>
            <span class="prod-row-orden-num">${i + 1}</span>
            <button class="icon-btn" data-mover="${p.id}" data-dir="down" ${i === lista.length - 1 ? 'disabled' : ''} title="Bajar">▼</button>
          </div>
        ` : ''}
        <div class="prod-row-img">${img ? `<img src="${img}" alt="" />` : '<span class="prod-row-noimg">📦</span>'}</div>
        <div class="prod-row-info">
          <div class="prod-row-title">${escapeHtml(p.nombre)}</div>
          <div class="prod-row-meta">${catNombre(p.categoriaId)} · ${fmtGs(p.precio)}${enOferta ? ` <span class="tag-oferta">Oferta ${fmtGs(p.precioOferta)}</span>` : ''} · ${stockTexto(p.stock)}</div>
        </div>
        <div class="prod-row-badges">
          ${p.stock !== null && p.stock !== undefined && p.stock <= 0 ? '<span class="badge badge-gray">Sin stock</span>' : ''}
          ${p.destacado ? '<span class="badge badge-gold">Destacado</span>' : ''}
          <span class="badge ${p.publicado ? 'badge-green' : 'badge-gray'}" data-toggle-pub="${p.id}" title="Click para cambiar" style="cursor:pointer">${p.publicado ? 'Publicado' : 'Borrador'}</span>
        </div>
        <div class="prod-row-actions">
          <button class="icon-btn" data-edit="${p.id}" title="Editar">✏️</button>
          <button class="icon-btn" data-dup="${p.id}" title="Duplicar">📄</button>
          <button class="icon-btn icon-btn-danger" data-del="${p.id}" title="Eliminar">🗑️</button>
        </div>
      </div>
    `;
  }

  async function mover(id, dir) {
    const cat = document.getElementById('prod-filtro-cat').value;
    const grupo = productos.filter((p) => p.categoriaId === cat).sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const idx = grupo.findIndex((p) => p.id === id);
    const destino = dir === 'up' ? idx - 1 : idx + 1;
    if (destino < 0 || destino >= grupo.length) return;

    // Movemos el elemento a su nueva posición y renumeramos todo el grupo en
    // secuencia (evita que quede "pegado" si dos productos comparten el mismo orden).
    const reordenado = [...grupo];
    reordenado.splice(idx, 1);
    reordenado.splice(destino, 0, grupo[idx]);

    const cambios = reordenado
      .map((p, i) => ({ p, nuevoOrden: i * 10 }))
      .filter(({ p, nuevoOrden }) => (p.orden || 0) !== nuevoOrden);

    try {
      await Promise.all(cambios.map(({ p, nuevoOrden }) => Api.put('/productos/' + p.id, { orden: nuevoOrden }).then((act) => {
        Object.assign(productos.find((x) => x.id === p.id), act);
      })));
      pintarTabla();
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function togglePublicado(id) {
    const p = productos.find((p) => p.id === id);
    try {
      const actualizado = await Api.put('/productos/' + id, { publicado: !p.publicado });
      Object.assign(p, actualizado);
      pintarTabla();
      Toast.ok(p.publicado ? 'Producto publicado.' : 'Producto pasado a borrador.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function duplicar(id) {
    try {
      const copia = await Api.post('/productos/' + id + '/duplicar');
      productos.push(copia);
      pintarTabla();
      Toast.ok('Producto duplicado como borrador.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function eliminar(id) {
    const p = productos.find((p) => p.id === id);
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await Api.del('/productos/' + id);
      productos = productos.filter((x) => x.id !== id);
      pintarTabla();
      Toast.ok('Producto eliminado.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  // ---------- editor (crear / editar) ----------
  function abrirEditor(id) {
    const p = id ? productos.find((p) => p.id === id) : {
      nombre: '', precio: '', precioOferta: '', precioCosto: '', categoriaId: '', descripcion: '', stock: null,
      imagenes: [], destacado: false, disponible: true, publicado: false, orden: 0,
    };
    imagenesActuales = [...(p.imagenes || [])];

    Modal.open(`
      <div class="modal-head">
        <h3>${id ? 'Editar publicación' : 'Nueva publicación'}</h3>
        <button class="modal-x" id="prod-modal-close">✕</button>
      </div>
      <div class="modal-scroll">
        <form id="prod-form" class="form-grid">
          <label class="span-2">Nombre del producto
            <input id="f-nombre" type="text" value="${escapeAttr(p.nombre)}" required placeholder="Ej: Smart TV 55&quot; 4K" />
          </label>

          <label>Precio (₲)
            <input id="f-precio" type="number" min="0" step="1" value="${p.precio || ''}" required />
          </label>
          <label>Precio de oferta (opcional)
            <input id="f-oferta" type="number" min="0" step="1" value="${p.precioOferta || ''}" placeholder="Dejar vacío si no aplica" />
          </label>
          <label>Precio de costo (solo lo ven los vendedores)
            <input id="f-costo" type="number" min="0" step="1" value="${p.precioCosto || ''}" placeholder="Para calcular la comisión por margen" />
          </label>

          <label>Categoría
            <select id="f-categoria">
              <option value="">Sin categoría</option>
              ${categorias.map((c) => `<option value="${c.id}" ${c.id === p.categoriaId ? 'selected' : ''}>${escapeHtml(c.icono + ' ' + c.nombre)}</option>`).join('')}
            </select>
          </label>
          <label>Stock disponible
            <input id="f-stock" type="number" min="0" step="1" value="${p.stock != null ? p.stock : ''}" placeholder="Vacío = sin control de stock" />
          </label>

          <div class="span-2">
            <span class="field-label">Imágenes</span>
            <div id="galeria" class="galeria"></div>
            <input id="f-imagen-input" type="file" accept="image/*" multiple hidden />
            <button type="button" class="btn btn-ghost btn-sm" id="btn-subir-imagen">📷 Agregar imágenes</button>
          </div>

          <div class="span-2">
            <span class="field-label">Descripción</span>
            <div id="f-descripcion-mount"></div>
          </div>

          <label>Orden en la fila de inicio
            <input id="f-orden" type="number" step="1" value="${p.orden || 0}" title="Más bajo aparece primero en la fila de su categoría en el inicio" />
          </label>

          <label class="switch-row"><input type="checkbox" id="f-destacado" ${p.destacado ? 'checked' : ''} /> ⭐ Destacado</label>
          <label class="switch-row"><input type="checkbox" id="f-disponible" ${p.disponible !== false ? 'checked' : ''} /> ✅ Disponible</label>
          <label class="switch-row span-2"><input type="checkbox" id="f-publicado" ${p.publicado ? 'checked' : ''} /> 🌐 Publicado en el sitio</label>

          <div class="modal-actions span-2">
            <button type="button" class="btn btn-ghost" id="prod-cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar cambios' : 'Crear publicación'}</button>
          </div>
        </form>
      </div>
    `);

    editor = crearEditorRico(document.getElementById('f-descripcion-mount'), p.descripcion);
    pintarGaleria();

    document.getElementById('prod-modal-close').addEventListener('click', Modal.close);
    document.getElementById('prod-cancelar').addEventListener('click', Modal.close);
    document.getElementById('btn-subir-imagen').addEventListener('click', () => document.getElementById('f-imagen-input').click());
    document.getElementById('f-imagen-input').addEventListener('change', subirImagenes);
    document.getElementById('prod-form').addEventListener('submit', (e) => guardar(e, id));
  }

  function pintarGaleria() {
    const el = document.getElementById('galeria');
    el.innerHTML = imagenesActuales.map((url, i) => `
      <div class="galeria-item">
        <img src="${url}" alt="" />
        <button type="button" class="galeria-del" data-i="${i}">✕</button>
      </div>
    `).join('') || '<div class="galeria-vacia">Sin imágenes todavía</div>';

    el.querySelectorAll('.galeria-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        imagenesActuales.splice(Number(btn.dataset.i), 1);
        pintarGaleria();
      });
    });
  }

  async function subirImagenes(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of files) {
      const fd = new FormData();
      fd.append('imagen', file);
      try {
        const { url } = await Api.upload('/productos/imagen', fd);
        imagenesActuales.push(url);
      } catch (err) {
        Toast.error('No se pudo subir ' + file.name + ': ' + err.message);
      }
    }
    pintarGaleria();
  }

  async function guardar(e, id) {
    e.preventDefault();
    const body = {
      nombre: document.getElementById('f-nombre').value.trim(),
      precio: Number(document.getElementById('f-precio').value),
      precioOferta: document.getElementById('f-oferta').value ? Number(document.getElementById('f-oferta').value) : null,
      precioCosto: document.getElementById('f-costo').value ? Number(document.getElementById('f-costo').value) : null,
      categoriaId: document.getElementById('f-categoria').value || null,
      stock: document.getElementById('f-stock').value === '' ? null : Number(document.getElementById('f-stock').value),
      descripcion: editor.getHtml(),
      imagenes: imagenesActuales,
      destacado: document.getElementById('f-destacado').checked,
      disponible: document.getElementById('f-disponible').checked,
      publicado: document.getElementById('f-publicado').checked,
      orden: Number(document.getElementById('f-orden').value) || 0,
    };

    try {
      if (id) {
        const actualizado = await Api.put('/productos/' + id, body);
        const idx = productos.findIndex((p) => p.id === id);
        productos[idx] = actualizado;
        Toast.ok('Cambios guardados.');
      } else {
        const nuevo = await Api.post('/productos', body);
        productos.push(nuevo);
        Toast.ok('Publicación creada.');
      }
      Modal.close();
      pintarTabla();
    } catch (err) {
      Toast.error(err.message);
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  return { render };
})();
