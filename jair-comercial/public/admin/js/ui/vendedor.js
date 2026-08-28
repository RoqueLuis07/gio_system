window.Views = window.Views || {};

(function () {
  function fmtGs(n) { return '₲ ' + Math.round(n || 0).toLocaleString('es-PY'); }
  function fmtFecha(iso) { return new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }

  function badgeEstado(v) {
    if (v.estado === 'pendiente') return '<span class="badge badge-gold">Pendiente de aprobación</span>';
    if (v.estado === 'aprobada') return '<span class="badge badge-green">Aprobada</span>';
    return '<span class="badge badge-gray">Rechazada</span>';
  }

  // ---------- Mi panel ----------
  Views['vendedor-panel'] = {
    async render(container) {
      container.innerHTML = '<div class="loading">Cargando…</div>';
      const ventas = await Api.get('/ventas');
      const usuario = App.usuario();

      const ahora = new Date();
      const esteMes = ventas.filter((v) => {
        const f = new Date(v.creadoEn);
        return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth();
      });
      const aprobadasMes = esteMes.filter((v) => v.estado === 'aprobada');
      const pendientes = ventas.filter((v) => v.estado === 'pendiente');
      const totalVendidoMes = aprobadasMes.reduce((s, v) => s + v.total, 0);
      const gananciaMes = aprobadasMes.reduce((s, v) => s + v.comisionMonto, 0);

      container.innerHTML = `
        <div class="hello-banner">
          <div>
            <h3>Hola, ${escapeHtml(usuario.nombre)} 👋</h3>
            <p>Tu ganancia es lo que sumás por encima del precio de costo en cada venta que se aprueba.</p>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-icon">🧾</div><div><div class="stat-num">${aprobadasMes.length}</div><div class="stat-label">Ventas aprobadas este mes</div></div></div>
          <div class="stat-card"><div class="stat-icon">💰</div><div><div class="stat-num">${fmtGs(totalVendidoMes)}</div><div class="stat-label">Vendido este mes</div></div></div>
          <div class="stat-card"><div class="stat-icon">🤝</div><div><div class="stat-num">${fmtGs(gananciaMes)}</div><div class="stat-label">Tu ganancia este mes</div></div></div>
          <div class="stat-card"><div class="stat-icon">🕐</div><div><div class="stat-num">${pendientes.length}</div><div class="stat-label">Pendientes de aprobación</div></div></div>
        </div>
        <div class="quick-actions">
          <button class="btn btn-primary" data-go="vendedor-nueva-venta">➕ Cargar nueva venta</button>
          <button class="btn btn-ghost" data-go="vendedor-mis-ventas">🧾 Ver mis ventas</button>
        </div>
      `;
      container.querySelectorAll('[data-go]').forEach((btn) => btn.addEventListener('click', () => App.irAVista(btn.dataset.go)));
    },
  };

  // ---------- Nueva venta ----------
  Views['vendedor-nueva-venta'] = {
    async render(container) {
      container.innerHTML = '<div class="loading">Cargando…</div>';
      const [productosVenta, parametros] = await Promise.all([
        Api.get('/productos/para-venta'),
        Api.get('/parametros'),
      ]);
      const productos = productosVenta.filter((p) => p.stock === null || p.stock === undefined || p.stock > 0);
      const metodosPago = parametros.metodosPago && parametros.metodosPago.length ? parametros.metodosPago : ['Efectivo'];

      container.innerHTML = `
        <form id="venta-form" class="form-grid" style="max-width:680px;">
          <label class="span-2">Producto
            <select id="f-producto" required>
              <option value="">Seleccioná un producto</option>
              ${productos.map((p) => {
                const sugerido = p.precioOferta && p.precioOferta < p.precio ? p.precioOferta : p.precio;
                return `<option value="${p.id}" data-precio="${sugerido}" data-costo="${p.precioCosto || 0}" data-stock="${p.stock == null ? '' : p.stock}">${escapeHtml(p.nombre)} — costo ${fmtGs(p.precioCosto || 0)}, sugerido ${fmtGs(sugerido)}${p.stock != null ? ' (stock: ' + p.stock + ')' : ''}</option>`;
              }).join('')}
            </select>
          </label>
          <label>Cantidad
            <input id="f-cantidad" type="number" min="1" step="1" value="1" required />
          </label>
          <label>Precio al que vendiste (₲, por unidad)
            <input id="f-precio-venta" type="number" min="0" step="1" required placeholder="Ingresá el precio real de venta" />
          </label>
          <label class="span-2">Forma de pago
            <select id="f-forma-pago" required>
              ${metodosPago.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('')}
            </select>
          </label>

          <div class="span-2 venta-resumen" id="venta-resumen" hidden>
            <div><span>Costo total</span><strong id="venta-costo">₲ 0</strong></div>
            <div><span>Total de la venta</span><strong id="venta-total">₲ 0</strong></div>
            <div><span>Tu ganancia</span><strong id="venta-comision">₲ 0</strong></div>
          </div>

          <h4 class="span-2" style="margin:6px 0 -6px;">Datos de entrega</h4>
          <label>Nombre de quien recibe
            <input id="f-cliente-nombre" type="text" required placeholder="Nombre y apellido" />
          </label>
          <label>Teléfono de contacto
            <input id="f-cliente-telefono" type="text" required placeholder="Ej: 0981 123 456" />
          </label>
          <label>Ciudad
            <input id="f-cliente-ciudad" type="text" placeholder="Ej: Asunción" />
          </label>
          <label>Dirección (opcional)
            <input id="f-cliente-direccion" type="text" placeholder="Calle, número, referencia" />
          </label>

          <p class="span-2 muted" style="margin:0;">La venta queda <strong>pendiente de aprobación</strong>. El stock se descuenta y el delivery se coordina recién cuando un administrador la aprueba.</p>

          <div class="modal-actions span-2" style="justify-content:flex-start;">
            <button type="submit" class="btn btn-primary">Registrar venta</button>
          </div>
        </form>
      `;

      const selProducto = document.getElementById('f-producto');
      const inputCantidad = document.getElementById('f-cantidad');
      const inputPrecioVenta = document.getElementById('f-precio-venta');
      const resumen = document.getElementById('venta-resumen');

      selProducto.addEventListener('change', () => {
        const opt = selProducto.selectedOptions[0];
        if (opt && opt.value) inputPrecioVenta.value = opt.dataset.precio;
        actualizarResumen();
      });

      function actualizarResumen() {
        const opt = selProducto.selectedOptions[0];
        if (!opt || !opt.value) { resumen.hidden = true; return; }
        const costo = Number(opt.dataset.costo) || 0;
        const precioVenta = Number(inputPrecioVenta.value) || 0;
        const cantidad = Math.max(1, Number(inputCantidad.value) || 1);
        const total = precioVenta * cantidad;
        const costoTotal = costo * cantidad;
        const ganancia = Math.max(0, total - costoTotal);
        document.getElementById('venta-costo').textContent = fmtGs(costoTotal);
        document.getElementById('venta-total').textContent = fmtGs(total);
        document.getElementById('venta-comision').textContent = fmtGs(ganancia);
        resumen.hidden = false;
      }

      inputCantidad.addEventListener('input', actualizarResumen);
      inputPrecioVenta.addEventListener('input', actualizarResumen);

      document.getElementById('venta-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const opt = selProducto.selectedOptions[0];
        const stockDisponible = opt.dataset.stock;
        const cantidad = Number(inputCantidad.value);
        if (stockDisponible !== '' && cantidad > Number(stockDisponible)) {
          Toast.error('La cantidad supera el stock disponible (' + stockDisponible + ').');
          return;
        }
        try {
          await Api.post('/ventas', {
            productoId: selProducto.value,
            cantidad,
            precioVenta: Number(inputPrecioVenta.value),
            formaPago: document.getElementById('f-forma-pago').value,
            cliente: {
              nombre: document.getElementById('f-cliente-nombre').value.trim(),
              telefono: document.getElementById('f-cliente-telefono').value.trim(),
              ciudad: document.getElementById('f-cliente-ciudad').value.trim(),
              direccion: document.getElementById('f-cliente-direccion').value.trim(),
            },
          });
          Toast.ok('Venta registrada. Queda pendiente de aprobación.');
          App.irAVista('vendedor-mis-ventas');
        } catch (err) {
          Toast.error(err.message);
        }
      });
    },
  };

  // ---------- Mis ventas ----------
  Views['vendedor-mis-ventas'] = {
    async render(container) {
      container.innerHTML = '<div class="loading">Cargando…</div>';
      const ventas = await Api.get('/ventas');
      ventas.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

      if (ventas.length === 0) {
        container.innerHTML = '<div class="empty-state">Todavía no cargaste ninguna venta. <br><br><button class="btn btn-primary" id="btn-ir-nueva">➕ Cargar mi primera venta</button></div>';
        document.getElementById('btn-ir-nueva').addEventListener('click', () => App.irAVista('vendedor-nueva-venta'));
        return;
      }

      container.innerHTML = `
        <div class="prod-list">
          ${ventas.map((v) => `
            <div class="prod-row venta-row">
              <div class="prod-row-info">
                <div class="prod-row-title">${escapeHtml(v.productoNombre)} <span class="muted">× ${v.cantidad}</span></div>
                <div class="prod-row-meta">💳 ${escapeHtml(v.formaPago)} · 🚚 ${escapeHtml((v.cliente && v.cliente.ciudad) || 'sin ciudad')} · 🕐 ${fmtFecha(v.creadoEn)}</div>
                <div class="prod-row-meta">Total: <strong>${fmtGs(v.total)}</strong> · Tu ganancia: <strong>${fmtGs(v.comisionMonto)}</strong></div>
                ${v.estado === 'aprobada' ? `<div class="prod-row-meta">${v.delivery && v.delivery.nombre ? '🚚 Delivery asignado: ' + escapeHtml(v.delivery.nombre) : '🚚 Delivery: a coordinar por el admin'}</div>` : ''}
                ${v.motivoRechazo ? `<div class="prod-row-meta">Motivo del rechazo: ${escapeHtml(v.motivoRechazo)}</div>` : ''}
              </div>
              <div class="prod-row-badges">${badgeEstado(v)}</div>
              ${v.estado === 'pendiente' ? `<div class="prod-row-actions"><button class="icon-btn icon-btn-danger" data-cancelar="${v.id}" title="Cancelar venta">🗑️</button></div>` : ''}
            </div>
          `).join('')}
        </div>
      `;

      container.querySelectorAll('[data-cancelar]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Cancelar esta venta pendiente?')) return;
          try {
            await Api.del('/ventas/' + btn.dataset.cancelar);
            Toast.ok('Venta cancelada.');
            Views['vendedor-mis-ventas'].render(container);
          } catch (err) {
            Toast.error(err.message);
          }
        });
      });
    },
  };

  // ---------- Mi perfil (datos de pago) ----------
  Views['vendedor-perfil'] = {
    async render(container) {
      container.innerHTML = '<div class="loading">Cargando…</div>';
      const u = await Api.get('/usuarios/me');
      const dp = u.datosPago || {};

      container.innerHTML = `
        ${!u.perfilCompleto ? `
          <div class="alerta-pendientes">
            <span class="alerta-pendientes-icon">💳</span>
            <div>
              <strong>Completá tus datos de pago</strong>
              <p>Los necesitamos para poder pagarte tus ventas aprobadas.</p>
            </div>
          </div>
        ` : ''}
        <form id="perfil-form" class="form-grid" style="max-width:560px;">
          <label class="span-2">Banco / billetera
            <input id="f-banco" type="text" value="${escapeAttr(dp.banco || '')}" required placeholder="Ej: Banco Familiar, Tigo Money..." />
          </label>
          <label>Número de cuenta
            <input id="f-numero-cuenta" type="text" value="${escapeAttr(dp.numeroCuenta || '')}" required />
          </label>
          <label>Titular de la cuenta
            <input id="f-titular" type="text" value="${escapeAttr(dp.titular || '')}" required placeholder="Nombre completo" />
          </label>
          <label class="span-2">Teléfono asociado al pago (opcional)
            <input id="f-telefono-pago" type="text" value="${escapeAttr(dp.telefono || '')}" placeholder="Si cobrás por billetera móvil" />
          </label>
          <div class="modal-actions span-2" style="justify-content:flex-start;">
            <button type="submit" class="btn btn-primary">💾 Guardar datos de pago</button>
          </div>
        </form>
      `;

      document.getElementById('perfil-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await Api.put('/usuarios/me/datos-pago', {
            banco: document.getElementById('f-banco').value.trim(),
            numeroCuenta: document.getElementById('f-numero-cuenta').value.trim(),
            titular: document.getElementById('f-titular').value.trim(),
            telefono: document.getElementById('f-telefono-pago').value.trim(),
          });
          Toast.ok('Datos de pago guardados.');
          if (App.refrescarUsuario) await App.refrescarUsuario();
          Views['vendedor-perfil'].render(container);
        } catch (err) {
          Toast.error(err.message);
        }
      });
    },
  };
})();
