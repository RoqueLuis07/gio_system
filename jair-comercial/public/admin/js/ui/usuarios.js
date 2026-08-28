window.Views = window.Views || {};

Views.usuarios = (function () {
  let usuarios = [];
  const PERMISOS = [
    { key: 'productos', label: '📦 Productos', desc: 'Crear, editar y eliminar publicaciones' },
    { key: 'categorias', label: '🗂️ Categorías', desc: 'Administrar categorías del catálogo' },
    { key: 'ventas', label: '🧾 Ventas', desc: 'Ver, aprobar y rechazar las ventas de todos los vendedores' },
    { key: 'gastos', label: '💸 Gastos', desc: 'Registrar compras, reposición de stock y otros gastos' },
    { key: 'parametros', label: '⚙️ Ajustes', desc: 'Editar datos de la empresa, WhatsApp y banner' },
    { key: 'usuarios', label: '👥 Usuarios', desc: 'Crear y administrar accesos de otros usuarios' },
  ];

  function fmtGs(n) { return '₲ ' + Math.round(n || 0).toLocaleString('es-PY'); }
  function fmtFecha(iso) { return new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  async function render(container) {
    container.innerHTML = '<div class="loading">Cargando…</div>';
    usuarios = await Api.get('/usuarios');

    container.innerHTML = `
      <div class="view-toolbar">
        <p class="view-hint">Creá accesos para funcionarios y vendedores con permisos personalizados por sección.</p>
        <button class="btn btn-primary" id="btn-nuevo-usuario">➕ Nuevo usuario</button>
      </div>
      <div id="usr-lista"></div>
    `;
    document.getElementById('btn-nuevo-usuario').addEventListener('click', () => abrirEditor(null));
    pintar();
  }

  function pintar() {
    const el = document.getElementById('usr-lista');
    el.innerHTML = `
      <div class="prod-list">
        ${usuarios.map((u) => `
          <div class="prod-row">
            <div class="prod-row-img usr-avatar">${escapeHtml((u.nombre || '?')[0].toUpperCase())}</div>
            <div class="prod-row-info">
              <div class="prod-row-title">${escapeHtml(u.nombre)} <span class="muted">@${escapeHtml(u.usuario)}</span></div>
              <div class="prod-row-meta">${
                u.rol === 'admin' ? '👑 Administrador (acceso total)'
                : u.rol === 'vendedor' ? '🛍️ Vendedor' + (u.telefono ? ' · 📞 ' + escapeHtml(u.telefono) : '') + (u.perfilCompleto ? '' : ' · <span style="color:#b45309">perfil incompleto</span>')
                : 'Funcionario · ' + ((u.permisos || []).map((p) => p).join(', ') || 'sin permisos asignados')
              }</div>
            </div>
            <div class="prod-row-badges">
              <span class="badge ${u.activo ? 'badge-green' : 'badge-gray'}">${u.activo ? 'Activo' : 'Desactivado'}</span>
            </div>
            <div class="prod-row-actions">
              ${u.rol === 'vendedor' ? `<button class="icon-btn" data-ficha="${u.id}" title="Ver ficha">🗂️</button>` : ''}
              <button class="icon-btn" data-edit="${u.id}" title="Editar">✏️</button>
              <button class="icon-btn icon-btn-danger" data-del="${u.id}" title="Eliminar">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    el.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => abrirEditor(b.dataset.edit)));
    el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => eliminar(b.dataset.del)));
    el.querySelectorAll('[data-ficha]').forEach((b) => b.addEventListener('click', () => abrirFicha(b.dataset.ficha)));
  }

  function abrirEditor(id) {
    const u = id ? usuarios.find((u) => u.id === id) : { nombre: '', usuario: '', rol: 'funcionario', permisos: [], activo: true, telefono: '', ci: '' };

    Modal.open(`
      <div class="modal-head"><h3>${id ? 'Editar usuario' : 'Nuevo usuario'}</h3><button class="modal-x" id="usr-close">✕</button></div>
      <div class="modal-scroll">
        <form id="usr-form" class="form-grid">
          <label>Nombre completo
            <input id="f-nombre" type="text" value="${escapeAttr(u.nombre)}" required />
          </label>
          <label>Usuario (para iniciar sesión)
            <input id="f-usuario" type="text" value="${escapeAttr(u.usuario)}" required autocomplete="off" />
          </label>
          <label class="span-2">${id ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña'}
            <input id="f-pass" type="password" autocomplete="new-password" ${id ? '' : 'required'} />
          </label>

          <label class="span-2">Rol
            <select id="f-rol">
              <option value="funcionario" ${u.rol === 'funcionario' ? 'selected' : ''}>Funcionario (permisos personalizados)</option>
              <option value="vendedor" ${u.rol === 'vendedor' ? 'selected' : ''}>Vendedor (carga sus propias ventas)</option>
              <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador (acceso total)</option>
            </select>
          </label>

          <div class="span-2" id="permisos-wrap">
            <span class="field-label">Permisos</span>
            <div class="permisos-grid">
              ${PERMISOS.map((p) => `
                <label class="permiso-item">
                  <input type="checkbox" class="f-permiso" value="${p.key}" ${(u.permisos || []).includes(p.key) ? 'checked' : ''} />
                  <div><strong>${p.label}</strong><div class="muted">${p.desc}</div></div>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="span-2" id="vendedor-wrap">
            <span class="field-label">Datos básicos del vendedor</span>
            <div class="form-grid" style="margin-bottom:4px;">
              <label>Teléfono
                <input id="f-telefono" type="text" value="${escapeAttr(u.telefono || '')}" placeholder="Ej: 0981 123 456" />
              </label>
              <label>Cédula de identidad
                <input id="f-ci" type="text" value="${escapeAttr(u.ci || '')}" placeholder="Ej: 4123456" />
              </label>
            </div>
            <p class="muted" style="margin:0;">Sus datos de pago (banco, cuenta) los carga el propio vendedor la primera vez que inicia sesión. Podés verlos en su ficha (🗂️).</p>
          </div>

          <label class="switch-row span-2"><input type="checkbox" id="f-activo" ${u.activo !== false ? 'checked' : ''} /> Usuario activo (puede iniciar sesión)</label>

          <div class="modal-actions span-2">
            <button type="button" class="btn btn-ghost" id="usr-cancelar">Cancelar</button>
            <button type="submit" class="btn btn-primary">${id ? 'Guardar cambios' : 'Crear usuario'}</button>
          </div>
        </form>
      </div>
    `);

    const rolSelect = document.getElementById('f-rol');
    const permisosWrap = document.getElementById('permisos-wrap');
    const vendedorWrap = document.getElementById('vendedor-wrap');
    const actualizarVisibilidad = () => {
      permisosWrap.style.display = rolSelect.value === 'funcionario' ? '' : 'none';
      vendedorWrap.style.display = rolSelect.value === 'vendedor' ? '' : 'none';
    };
    actualizarVisibilidad();
    rolSelect.addEventListener('change', actualizarVisibilidad);

    document.getElementById('usr-close').addEventListener('click', Modal.close);
    document.getElementById('usr-cancelar').addEventListener('click', Modal.close);
    document.getElementById('usr-form').addEventListener('submit', (e) => guardar(e, id));
  }

  async function guardar(e, id) {
    e.preventDefault();
    const body = {
      nombre: document.getElementById('f-nombre').value.trim(),
      usuario: document.getElementById('f-usuario').value.trim(),
      rol: document.getElementById('f-rol').value,
      permisos: Array.from(document.querySelectorAll('.f-permiso:checked')).map((c) => c.value),
      activo: document.getElementById('f-activo').checked,
      telefono: document.getElementById('f-telefono').value.trim(),
      ci: document.getElementById('f-ci').value.trim(),
    };
    const pass = document.getElementById('f-pass').value.trim();
    if (pass) body.pass = pass;

    try {
      if (id) {
        const act = await Api.put('/usuarios/' + id, body);
        Object.assign(usuarios.find((u) => u.id === id), act);
        Toast.ok('Usuario actualizado.');
      } else {
        usuarios.push(await Api.post('/usuarios', body));
        Toast.ok('Usuario creado.');
      }
      Modal.close();
      pintar();
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function eliminar(id) {
    const u = usuarios.find((u) => u.id === id);
    if (!confirm(`¿Eliminar el acceso de "${u.nombre}"?`)) return;
    try {
      await Api.del('/usuarios/' + id);
      usuarios = usuarios.filter((x) => x.id !== id);
      pintar();
      Toast.ok('Usuario eliminado.');
    } catch (err) {
      Toast.error(err.message);
    }
  }

  // ---------- ficha del vendedor: datos de pago + historial de cambios + actividad ----------
  async function abrirFicha(id) {
    const u = usuarios.find((u) => u.id === id);
    Modal.open('<div class="modal-head"><h3>Ficha de ' + escapeHtml(u.nombre) + '</h3><button class="modal-x" id="fi-close">✕</button></div><div class="modal-scroll"><div class="loading">Cargando…</div></div>');
    document.getElementById('fi-close').addEventListener('click', Modal.close);

    const movimientos = await Api.get('/movimientos?usuarioId=' + id);
    const dp = u.datosPago || {};
    const historial = (u.historialCambios || []).slice().reverse();

    document.querySelector('.modal-scroll').innerHTML = `
      <section class="settings-section">
        <h3>💳 Datos de pago</h3>
        ${dp.banco ? `
          <div class="form-grid">
            <div><span class="field-label">Banco</span>${escapeHtml(dp.banco)}</div>
            <div><span class="field-label">Nº de cuenta</span>${escapeHtml(dp.numeroCuenta)}</div>
            <div><span class="field-label">Titular</span>${escapeHtml(dp.titular)}</div>
            <div><span class="field-label">Teléfono de pago</span>${escapeHtml(dp.telefono || '—')}</div>
          </div>
        ` : '<p class="muted">El vendedor todavía no cargó sus datos de pago.</p>'}
      </section>

      <section class="settings-section">
        <h3>🕐 Actividad reciente</h3>
        ${movimientos.length === 0 ? '<p class="muted">Sin actividad registrada todavía.</p>' : `
          <div class="prod-list">
            ${movimientos.slice(0, 20).map((m) => `
              <div class="prod-row" style="padding:10px 14px;">
                <div class="prod-row-info">
                  <div class="prod-row-title" style="font-size:13.5px;">${iconoMovimiento(m.tipo)} ${escapeHtml(m.detalle || tituloMovimiento(m.tipo))}</div>
                  <div class="prod-row-meta">${fmtFecha(m.fecha)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </section>

      <section class="settings-section">
        <h3>📝 Historial de cambios <span class="muted" style="font-weight:400;">(solo vos lo ves)</span></h3>
        ${historial.length === 0 ? '<p class="muted">Sin cambios registrados todavía.</p>' : `
          <div class="prod-list">
            ${historial.map((h) => `
              <div class="prod-row" style="padding:10px 14px; flex-direction:column; align-items:flex-start; gap:4px;">
                <div class="prod-row-meta"><strong>${fmtFecha(h.fecha)}</strong> · editado por ${escapeHtml(h.editadoPor)}</div>
                ${h.cambios.map((c) => `<div class="prod-row-meta">${escapeHtml(c.campo)}: "${escapeHtml(String(c.anterior))}" → "${escapeHtml(String(c.nuevo))}"</div>`).join('')}
              </div>
            `).join('')}
          </div>
        `}
      </section>
    `;
  }

  function iconoMovimiento(tipo) {
    return { venta_creada: '🧾', venta_cancelada: '🗑️', perfil_actualizado: '📝', inicio_sesion: '🔑' }[tipo] || '•';
  }
  function tituloMovimiento(tipo) {
    return { venta_creada: 'Cargó una venta', venta_cancelada: 'Canceló una venta', perfil_actualizado: 'Actualizó su perfil', inicio_sesion: 'Inició sesión' }[tipo] || tipo;
  }

  function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escapeAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }

  return { render };
})();
