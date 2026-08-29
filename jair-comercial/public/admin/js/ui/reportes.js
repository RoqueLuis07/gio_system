window.Views = window.Views || {};

Views.reportes = (function () {
  let ventas = [];
  let periodo = 'mes';
  let desde = '';
  let hasta = '';
  let vendedorId = '';
  let productoId = '';

  function fmtGs(n) { return '₲ ' + Math.round(n || 0).toLocaleString('es-PY'); }

  async function render(container) {
    container.innerHTML = '<div class="loading">Cargando…</div>';
    ventas = await Api.get('/ventas');

    const vendedores = Array.from(new Map(ventas.map((v) => [v.vendedorId, v.vendedorNombre])).entries());
    const productos = Array.from(new Map(ventas.map((v) => [v.productoId, v.productoNombre])).entries());

    container.innerHTML = `
      <div class="view-toolbar">
        <div class="tabs-filtro" id="rep-tabs">
          <button class="tab-btn" data-p="mes">Este mes</button>
          <button class="tab-btn" data-p="30dias">Últimos 30 días</button>
          <button class="tab-btn" data-p="todo">Todo el tiempo</button>
          <button class="tab-btn" data-p="rango">Rango de fechas</button>
        </div>
      </div>
      <div class="view-toolbar" id="rep-filtros-extra">
        <div id="rep-rango" class="form-grid" style="max-width:400px; margin:0;" hidden>
          <label>Desde <input id="f-desde" type="date" value="${desde}" /></label>
          <label>Hasta <input id="f-hasta" type="date" value="${hasta}" /></label>
        </div>
        <select id="f-vendedor" class="select-mini">
          <option value="">Todos los vendedores</option>
          ${vendedores.map(([id, nombre]) => `<option value="${id}" ${id === vendedorId ? 'selected' : ''}>${escapeHtml(nombre)}</option>`).join('')}
        </select>
        <select id="f-producto" class="select-mini">
          <option value="">Todos los productos</option>
          ${productos.map(([id, nombre]) => `<option value="${id}" ${id === productoId ? 'selected' : ''}>${escapeHtml(nombre)}</option>`).join('')}
        </select>
      </div>
      <div id="rep-resumen"></div>
      <div id="rep-tabla"></div>
      <div id="rep-tabla-productos" style="margin-top:26px;"></div>
    `;

    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.p === periodo);
      btn.addEventListener('click', () => {
        periodo = btn.dataset.p;
        container.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        document.getElementById('rep-rango').hidden = periodo !== 'rango';
        pintar();
      });
    });
    document.getElementById('rep-rango').hidden = periodo !== 'rango';

    document.getElementById('f-desde').addEventListener('change', (e) => { desde = e.target.value; pintar(); });
    document.getElementById('f-hasta').addEventListener('change', (e) => { hasta = e.target.value; pintar(); });
    document.getElementById('f-vendedor').addEventListener('change', (e) => { vendedorId = e.target.value; pintar(); });
    document.getElementById('f-producto').addEventListener('change', (e) => { productoId = e.target.value; pintar(); });

    pintar();
  }

  function dentroDelPeriodo(iso) {
    const fecha = new Date(iso);
    if (periodo === 'todo') return true;
    if (periodo === 'rango') {
      if (desde && fecha < new Date(desde)) return false;
      if (hasta && fecha > new Date(hasta + 'T23:59:59')) return false;
      return true;
    }
    const ahora = new Date();
    if (periodo === 'mes') return fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth();
    const hace30 = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    return fecha >= hace30;
  }

  function pintar() {
    const filtradas = ventas.filter((v) =>
      dentroDelPeriodo(v.creadoEn) &&
      (!vendedorId || v.vendedorId === vendedorId) &&
      (!productoId || v.productoId === productoId)
    );
    const aprobadas = filtradas.filter((v) => v.estado === 'aprobada');
    const pendientes = filtradas.filter((v) => ['pendiente', 'delivery_asignado', 'entregada'].includes(v.estado));

    const totalVendido = aprobadas.reduce((s, v) => s + v.total, 0);
    const totalGanancia = aprobadas.reduce((s, v) => s + v.comisionMonto, 0);
    const gananciaSinPagar = aprobadas.filter((v) => !v.comisionPagada).reduce((s, v) => s + v.comisionMonto, 0);

    document.getElementById('rep-resumen').innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-icon">🧾</div><div><div class="stat-num">${aprobadas.length}</div><div class="stat-label">Ventas aprobadas</div></div></div>
        <div class="stat-card"><div class="stat-icon">💰</div><div><div class="stat-num">${fmtGs(totalVendido)}</div><div class="stat-label">Total vendido</div></div></div>
        <div class="stat-card"><div class="stat-icon">🤝</div><div><div class="stat-num">${fmtGs(totalGanancia)}</div><div class="stat-label">Ganancia de vendedores</div></div></div>
        <div class="stat-card"><div class="stat-icon">💸</div><div><div class="stat-num">${fmtGs(gananciaSinPagar)}</div><div class="stat-label">Comisión sin pagar aún</div></div></div>
        <div class="stat-card"><div class="stat-icon">🕐</div><div><div class="stat-num">${pendientes.length}</div><div class="stat-label">En proceso (sin cerrar)</div></div></div>
      </div>
    `;

    // ---- tabla por vendedor ----
    const porVendedor = {};
    aprobadas.forEach((v) => {
      if (!porVendedor[v.vendedorId]) porVendedor[v.vendedorId] = { nombre: v.vendedorNombre, ventas: 0, total: 0, ganancia: 0 };
      porVendedor[v.vendedorId].ventas += 1;
      porVendedor[v.vendedorId].total += v.total;
      porVendedor[v.vendedorId].ganancia += v.comisionMonto;
    });
    pendientes.forEach((v) => {
      if (!porVendedor[v.vendedorId]) porVendedor[v.vendedorId] = { nombre: v.vendedorNombre, ventas: 0, total: 0, ganancia: 0 };
      porVendedor[v.vendedorId].pendientes = (porVendedor[v.vendedorId].pendientes || 0) + 1;
    });
    const filasVendedor = Object.values(porVendedor).sort((a, b) => b.total - a.total);
    const tablaVendedor = document.getElementById('rep-tabla');

    if (filasVendedor.length === 0) {
      tablaVendedor.innerHTML = '<div class="empty-state">No hay ventas con estos filtros.</div>';
      document.getElementById('rep-tabla-productos').innerHTML = '';
      return;
    }

    tablaVendedor.innerHTML = `
      <h3 style="margin:0 0 12px;">Por vendedor</h3>
      <div class="tabla-scroll">
        <table class="tabla-reporte">
          <thead><tr><th>Vendedor</th><th>Ventas aprobadas</th><th>Pendientes</th><th>Total vendido</th><th>Ganancia</th></tr></thead>
          <tbody>
            ${filasVendedor.map((f) => `
              <tr>
                <td>${escapeHtml(f.nombre)}</td>
                <td>${f.ventas}</td>
                <td>${f.pendientes || 0}</td>
                <td>${fmtGs(f.total)}</td>
                <td>${fmtGs(f.ganancia)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // ---- tabla por producto ----
    const porProducto = {};
    aprobadas.forEach((v) => {
      if (!porProducto[v.productoId]) porProducto[v.productoId] = { nombre: v.productoNombre, unidades: 0, total: 0, ganancia: 0 };
      porProducto[v.productoId].unidades += v.cantidad;
      porProducto[v.productoId].total += v.total;
      porProducto[v.productoId].ganancia += v.comisionMonto;
    });
    const filasProducto = Object.values(porProducto).sort((a, b) => b.total - a.total);

    document.getElementById('rep-tabla-productos').innerHTML = filasProducto.length === 0 ? '' : `
      <h3 style="margin:0 0 12px;">Por producto</h3>
      <div class="tabla-scroll">
        <table class="tabla-reporte">
          <thead><tr><th>Producto</th><th>Unidades vendidas</th><th>Total vendido</th><th>Ganancia</th></tr></thead>
          <tbody>
            ${filasProducto.map((f) => `
              <tr>
                <td>${escapeHtml(f.nombre)}</td>
                <td>${f.unidades}</td>
                <td>${fmtGs(f.total)}</td>
                <td>${fmtGs(f.ganancia)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return { render };
})();
