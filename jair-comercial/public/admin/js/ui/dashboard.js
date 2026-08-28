window.Views = window.Views || {};

Views.dashboard = {
  async render(container) {
    container.innerHTML = '<div class="loading">Cargando…</div>';

    const usuario = App.usuario();
    const puede = (p) => usuario.rol === 'admin' || (usuario.permisos || []).includes(p);

    const [productos, categorias, ventasPendientes] = await Promise.all([
      puede('productos') ? Api.get('/productos') : Promise.resolve([]),
      puede('categorias') ? Api.get('/categorias') : Promise.resolve([]),
      puede('ventas') ? Api.get('/ventas?estado=pendiente') : Promise.resolve([]),
    ]);

    const publicados = productos.filter((p) => p.publicado).length;
    const ofertas = productos.filter((p) => p.precioOferta && p.precioOferta < p.precio).length;
    const borradores = productos.length - publicados;
    const fmtGs = (n) => '₲ ' + Math.round(n || 0).toLocaleString('es-PY');

    container.innerHTML = `
      <div class="hello-banner">
        <div>
          <h3>Hola, ${escapeHtml(usuario.nombre)} 👋</h3>
          <p>Este es el resumen de tu negocio hoy.</p>
        </div>
      </div>

      ${ventasPendientes.length > 0 ? `
        <div class="alerta-pendientes" id="ir-ventas-pendientes">
          <span class="alerta-pendientes-icon">🔔</span>
          <div>
            <strong>${ventasPendientes.length} ${ventasPendientes.length === 1 ? 'venta pendiente' : 'ventas pendientes'} de aprobación</strong>
            <p>Sumá ${fmtGs(ventasPendientes.reduce((s, v) => s + v.total, 0))} en total esperando tu revisión.</p>
          </div>
          <button class="btn btn-primary btn-sm" data-go="ventas">Revisar ahora →</button>
        </div>
      ` : ''}

      <div class="stat-grid">
        <div class="stat-card"><div class="stat-icon">📦</div><div><div class="stat-num">${productos.length}</div><div class="stat-label">Productos totales</div></div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div><div class="stat-num">${publicados}</div><div class="stat-label">Publicados</div></div></div>
        <div class="stat-card"><div class="stat-icon">📝</div><div><div class="stat-num">${borradores}</div><div class="stat-label">Borradores</div></div></div>
        <div class="stat-card"><div class="stat-icon">🔥</div><div><div class="stat-num">${ofertas}</div><div class="stat-label">En oferta</div></div></div>
        <div class="stat-card"><div class="stat-icon">🗂️</div><div><div class="stat-num">${categorias.length}</div><div class="stat-label">Categorías</div></div></div>
      </div>
      <div class="quick-actions">
        ${puede('productos') ? '<button class="btn btn-primary" data-go="productos">➕ Nueva publicación</button>' : ''}
        ${puede('ventas') ? '<button class="btn btn-ghost" data-go="reportes">📊 Ver reportes</button>' : ''}
        ${puede('parametros') ? '<button class="btn btn-ghost" data-go="parametros">⚙️ Editar datos de contacto</button>' : ''}
        <a class="btn btn-ghost" href="/" target="_blank">↗ Ver sitio público</a>
      </div>
    `;

    container.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => App.irAVista(btn.dataset.go));
    });
  },
};

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
