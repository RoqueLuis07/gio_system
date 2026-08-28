const Cuenta = {
  abrir() {
    const usuario = App.usuario();
    Modal.open(`
      <div class="modal-head"><h3>Mi cuenta</h3><button class="modal-x" id="cta-close">✕</button></div>
      <div class="modal-scroll">
        <div class="cuenta-resumen">
          <div class="sidebar-user-avatar" style="width:48px;height:48px;font-size:18px;">${(usuario.nombre || '?')[0].toUpperCase()}</div>
          <div>
            <div><strong>${usuario.nombre}</strong></div>
            <div class="muted">@${usuario.usuario} · ${usuario.rol === 'admin' ? 'Administrador' : 'Funcionario'}</div>
          </div>
        </div>
        <form id="cta-form" class="form-grid" style="margin-top:18px;">
          <label class="span-2">Contraseña actual
            <input id="f-pass-actual" type="password" required autocomplete="current-password" />
          </label>
          <label class="span-2">Nueva contraseña
            <input id="f-pass-nueva" type="password" required minlength="4" autocomplete="new-password" />
          </label>
          <div class="modal-actions span-2">
            <button type="button" class="btn btn-ghost" id="cta-cancelar">Cerrar</button>
            <button type="submit" class="btn btn-primary">Cambiar contraseña</button>
          </div>
        </form>
      </div>
    `);
    document.getElementById('cta-close').addEventListener('click', Modal.close);
    document.getElementById('cta-cancelar').addEventListener('click', Modal.close);
    document.getElementById('cta-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await Api.put('/auth/clave', {
          passActual: document.getElementById('f-pass-actual').value,
          passNueva: document.getElementById('f-pass-nueva').value,
        });
        Toast.ok('Contraseña actualizada.');
        Modal.close();
      } catch (err) {
        Toast.error(err.message);
      }
    });
  },
};
