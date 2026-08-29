window.Views = window.Views || {};

Views.gastos = (function () {
  let gastos = [];
  const TIPOS = { compra: '🛒 Compra', reposicion: '📦 Reposición', otro: '📝 Otro' };

  function fmtGs(n) { return '₲ ' + Math.round(n || 0).toLocaleString('es-PY'); }

  async function render(container) {
    container.innerHTML = '<div class="loading">Cargando…</div>';
    gastos = await Api.get('/gastos');

    container.innerHTML = `
      <div class="view-toolbar">
        <p class="view-hint">Registrá compras, reposición de stock y otros gastos del negocio.</p>
        <button class="btn btn-primary" id="btn-nuevo-gasto">➕ Nuevo gasto</button>
      </div>
      <div id="gastos-resumen"></div>
      <div id="gastos-lista"></div>
    `;
    document.getElementById('btn-nuevo-gasto').addEventListener('click', () => abrirEditor(null));
    pintar();
  }

  function pintar() {
    const total = gastos.reduce((s, g) => s + g.monto, 0);
    document.getElementById('gastos-resumen').innerHTML = `
      <div class="stat-grid" style="margin-bottom:20px;">
        <div class="stat-card"><div class="stat-icon">💸</div><div><div class="stat-num">${fmtGs(total)}</div><div class="stat-label">Total registrado</div></div></div>
        <div class="stat-card"><div class="stat-icon">📋</div><div><div class="stat-num">${gastos.length}</div><div class="stat-label">Gastos cargados</div></div></div>
      </div>
    `;

    const el = document.getElementById('gastos-lista');
    if (gastos.length === 0) {
      el.innerHTML = '<div class="empty-state">Todavía no cargaste ningún gasto.</div>';
      return;
    }

    const ordenados = gastos.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    el.innerHTML = `
      <div class="prod-list">
        ${ordenados.map((g) => `
          <div class="prod-row">
            <div class="prod-row-info">
              <div class="prod-row-title">${escapeHtml(g.descripcion)}</div>
              <div class="prod-row-meta">${TIPOS[g.tipo] || g.tipo} · ${g.fecha}</div>
            </div>
            <div class="prod-row-badges"><span class="badge badge-gray">${fmtGs(g.monto)}</span></div>
            <div class="prod-row-actions">
              <button class="icon-btn" data-edit="${g.id}" title="Editar">✏️</button>
              <button class="icon-btn icon-btn-danger" data-del="${g.id}" title="Eliminar">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    el.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => abrirEditor(b.dataset.edit)));
    el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => eliminar(b.dataset.del)));
  }

  function abrirEditor(id) {
    const g = id ? gastos.find((g) => g.id === id) : { tipo: 'reposicion', descripcion: '', monto: '', fecha: new Date().toISOString().slice(0, 10) };
    Modal.open(`
      <div class="modal-head"><h3>${id ? 'Editar gasto' : 'Nuevo gasto'}</h3><button class="modal-x" id="gasto-close">✕</button></div>
      <div class="modal-scroll">
        <form id="gasto-form" class="form-grid">
          <label>Tipo
            <select id="f-tipo">
              <option value="reposicion" ${g.tipo === 'reposicion' ? 'selected' : ''}>📦 Reposición de stock</option>
              <option value="compra" ${g.tipo === 'compra' ? 'selected' : ''}>🛒 Compra</option>
              <option value="otro" ${g.tipo === 'otro' ? 'selected' : ''}>📝 Otro</option>
            </select>
          </label>
          <label>Fecha
            <input id="f-fecha" type="date" value="${g.fecha}" required />
          </label>
          <label class="span-2">Descripción
            <input id="f-descripcion" type="text" value="${escapeAttr(g.descripcion)}" required placeholder="Ej: Reposición de 10 autos a batería" />
          </label>
          <label class="span-2">Monto (₲)
            <input id="f-monto" type="number" min="0" step="1" value="${g.monto}" required />
          </label>
          <div class="modal-actions span-2">
            <button type="button" class="btn btn-ghost" id="gasto-cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar' : 'Registrar gasto'}</button>
          </div>
        </form>
      </div>
    `);
    document.getElementById('gasto-close').addEventListener('click', Modal.close);
    document.getElementById('gasto-cancelar').addEventListener('click', Modal.close);
    document.getElementById('gasto-form').addEventListener('submit', (e) => guardar(e, id));
  }

  async function guardar(e, id) {
    e.preventDefault();
    const body = {
      tipo: document.getElementById('f-tipo').value,
      fecha: document.getElementById('f-fecha').value,
      descripcion: document.getElementById('f-descripcion').value.trim(),
      monto: Number(document.getElementById('f-monto').value),
    };
    try {
      if (id) {
        const act = await Api.put('/gastos/' + id, body);
        Object.assign(gastos.find((g) => g.id === id), act);
        Toast.ok('Gasto actualizado.');
      } else {
        gastos.push(await Api.post('/gastos', body));
        Toast.ok('Gasto registrado.');
      }
      Modal.close();
      pintar();
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await Api.del('/gastos/' + id);
      gastos = gastos.filter((g) => g.id !== id);
      pintar();
      Toast.ok('Gasto eliminado.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }

  return { render };
})();
