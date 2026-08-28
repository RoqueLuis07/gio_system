window.Views = window.Views || {};

Views.ventas = (function () {
  let ventas = [];
  let filtro = 'pendiente';

  function fmtGs(n) { return '₲ ' + Math.round(n || 0).toLocaleString('es-PY'); }
  function fmtFecha(iso) { return new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  async function render(container) {
    container.innerHTML = '<div class="loading">Cargando…</div>';
    await cargar();

    container.innerHTML = `
      <div class="view-toolbar">
        <div class="tabs-filtro" id="ventas-tabs">
          <button class="tab-btn" data-estado="pendiente">🕐 Pendientes</button>
          <button class="tab-btn" data-estado="aprobada">✅ Aprobadas</button>
          <button class="tab-btn" data-estado="rechazada">✕ Rechazadas</button>
          <button class="tab-btn" data-estado="">Todas</button>
        </div>
      </div>
      <div id="ventas-lista"></div>
    `;

    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.estado === filtro);
      btn.addEventListener('click', () => {
        filtro = btn.dataset.estado;
        container.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        pintar();
      });
    });

    pintar();
  }

  async function cargar() {
    ventas = await Api.get('/ventas');
    await actualizarBadge();
  }

  async function actualizarBadge() {
    const pendientes = ventas.filter((v) => v.estado === 'pendiente').length;
    const badge = document.getElementById('badge-ventas-pendientes');
    if (!badge) return;
    badge.textContent = pendientes;
    badge.hidden = pendientes === 0;
  }

  function pintar() {
    const filtradas = filtro ? ventas.filter((v) => v.estado === filtro) : ventas;
    const el = document.getElementById('ventas-lista');

    if (filtradas.length === 0) {
      el.innerHTML = '<div class="empty-state">No hay ventas para mostrar acá.</div>';
      return;
    }

    el.innerHTML = `
      <div class="prod-list">
        ${filtradas.map(rowHtml).join('')}
      </div>
    `;

    el.querySelectorAll('[data-aprobar]').forEach((b) => b.addEventListener('click', () => aprobar(b.dataset.aprobar)));
    el.querySelectorAll('[data-rechazar]').forEach((b) => b.addEventListener('click', () => rechazar(b.dataset.rechazar)));
    el.querySelectorAll('[data-eliminar]').forEach((b) => b.addEventListener('click', () => eliminar(b.dataset.eliminar)));
    el.querySelectorAll('[data-delivery]').forEach((b) => b.addEventListener('click', () => abrirDelivery(b.dataset.delivery)));
  }

  function abrirDelivery(id) {
    const v = ventas.find((v) => v.id === id);
    Modal.open(`
      <div class="modal-head"><h3>Asignar delivery</h3><button class="modal-x" id="dv-close">✕</button></div>
      <div class="modal-scroll">
        <p class="muted" style="margin-top:0;">Pedido de ${escapeHtml(v.cliente?.nombre || 'cliente')} en ${escapeHtml(v.cliente?.ciudad || 'sin ciudad especificada')}.</p>
        <form id="dv-form" class="form-grid">
          <label class="span-2">Nombre del delivery / empresa
            <input id="dv-nombre" type="text" value="${escapeHtml((v.delivery && v.delivery.nombre) || '')}" required placeholder="Ej: Juan Pérez (moto propia)" />
          </label>
          <div class="modal-actions span-2">
            <button type="button" class="btn btn-ghost" id="dv-cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    `);
    document.getElementById('dv-close').addEventListener('click', Modal.close);
    document.getElementById('dv-cancelar').addEventListener('click', Modal.close);
    document.getElementById('dv-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const act = await Api.put('/ventas/' + id + '/delivery', { nombre: document.getElementById('dv-nombre').value.trim() });
        Object.assign(v, act);
        Modal.close();
        pintar();
        Toast.ok('Delivery asignado.');
      } catch (err) {
        Toast.error(err.message);
      }
    });
  }

  function badgeEstado(v) {
    if (v.estado === 'pendiente') return '<span class="badge badge-gold">Pendiente</span>';
    if (v.estado === 'aprobada') return '<span class="badge badge-green">Aprobada</span>';
    return '<span class="badge badge-gray">Rechazada</span>';
  }

  function rowHtml(v) {
    const cliente = v.cliente || {};
    return `
      <div class="prod-row venta-row">
        <div class="prod-row-info">
          <div class="prod-row-title">${escapeHtml(v.productoNombre)} <span class="muted">× ${v.cantidad}</span></div>
          <div class="prod-row-meta">
            👤 ${escapeHtml(v.vendedorNombre)} · 💳 ${escapeHtml(v.formaPago)} · 🕐 ${fmtFecha(v.creadoEn)}
          </div>
          <div class="prod-row-meta">
            Venta: <strong>${fmtGs(v.total)}</strong> · Costo: ${fmtGs((v.precioCosto || 0) * v.cantidad)} · Ganancia del vendedor: <strong>${fmtGs(v.comisionMonto)}</strong>
          </div>
          <div class="prod-row-meta">
            📦 ${escapeHtml(cliente.nombre || '—')} · 📞 ${escapeHtml(cliente.telefono || '—')}${cliente.ciudad ? ' · 🏙️ ' + escapeHtml(cliente.ciudad) : ''}${cliente.direccion ? ' · ' + escapeHtml(cliente.direccion) : ''}
          </div>
          ${v.estado === 'aprobada' ? `<div class="prod-row-meta">${v.delivery && v.delivery.nombre ? '🚚 Delivery: <strong>' + escapeHtml(v.delivery.nombre) + '</strong>' : '<span style="color:#b45309">🚚 Sin delivery asignado</span>'}</div>` : ''}
          ${v.motivoRechazo ? `<div class="prod-row-meta">Motivo: ${escapeHtml(v.motivoRechazo)}</div>` : ''}
        </div>
        <div class="prod-row-badges">${badgeEstado(v)}</div>
        <div class="prod-row-actions">
          ${v.estado === 'pendiente' ? `
            <button class="btn btn-primary btn-sm" data-aprobar="${v.id}">✓ Aprobar</button>
            <button class="btn btn-ghost btn-sm" data-rechazar="${v.id}">✕ Rechazar</button>
          ` : v.estado === 'aprobada' ? `
            <button class="btn btn-ghost btn-sm" data-delivery="${v.id}">🚚 ${v.delivery && v.delivery.nombre ? 'Cambiar delivery' : 'Asignar delivery'}</button>
            <button class="icon-btn icon-btn-danger" data-eliminar="${v.id}" title="Eliminar registro">🗑️</button>
          ` : `<button class="icon-btn icon-btn-danger" data-eliminar="${v.id}" title="Eliminar registro">🗑️</button>`}
        </div>
      </div>
    `;
  }

  async function aprobar(id) {
    try {
      const act = await Api.put('/ventas/' + id + '/aprobar');
      Object.assign(ventas.find((v) => v.id === id), act);
      await actualizarBadge();
      pintar();
      Toast.ok('Venta aprobada. Se descontó del stock.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function rechazar(id) {
    const motivo = prompt('Motivo del rechazo (opcional):') || '';
    try {
      const act = await Api.put('/ventas/' + id + '/rechazar', { motivo });
      Object.assign(ventas.find((v) => v.id === id), act);
      await actualizarBadge();
      pintar();
      Toast.ok('Venta rechazada.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este registro de venta?')) return;
    try {
      await Api.del('/ventas/' + id);
      ventas = ventas.filter((v) => v.id !== id);
      pintar();
      Toast.ok('Registro eliminado.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return { render, actualizarBadgeSilencioso: async () => { ventas = await Api.get('/ventas?estado=pendiente'); await actualizarBadge(); } };
})();
