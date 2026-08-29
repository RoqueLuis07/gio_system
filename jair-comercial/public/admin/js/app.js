const App = (function () {
  let usuarioActual = null;
  let vistaActual = 'dashboard';

  const NOMBRES_VISTA = {
    dashboard: 'Escritorio', productos: 'Productos', categorias: 'Categorías',
    ofertas: 'Ofertas', ventas: 'Ventas', reportes: 'Reportes', gastos: 'Gastos',
    usuarios: 'Usuarios', parametros: 'Ajustes',
    'vendedor-panel': 'Mi panel', 'vendedor-nueva-venta': 'Nueva venta', 'vendedor-mis-ventas': 'Mis ventas',
    'vendedor-perfil': 'Mi perfil',
  };

  let intervaloNotificaciones = null;

  function usuario() { return usuarioActual; }

  function puedeVer(permiso) {
    if (!permiso) return true;
    if (!usuarioActual) return false;
    return usuarioActual.rol === 'admin' || (usuarioActual.permisos || []).includes(permiso);
  }

  function mostrarLogin(mensaje) {
    document.getElementById('app-shell').hidden = true;
    document.getElementById('login-screen').hidden = false;
    const err = document.getElementById('login-error');
    if (mensaje) { err.textContent = mensaje; err.hidden = false; } else { err.hidden = true; }
  }

  function esVendedor() { return usuarioActual && usuarioActual.rol === 'vendedor'; }

  async function refrescarUsuario() {
    try {
      const fresco = await Api.get('/usuarios/me');
      usuarioActual = fresco;
      actualizarBadgePerfil();
      return fresco;
    } catch {
      return usuarioActual;
    }
  }

  function actualizarBadgePerfil() {
    const badge = document.getElementById('badge-perfil-incompleto');
    if (!badge) return;
    badge.hidden = !esVendedor() || usuarioActual.perfilCompleto !== false;
  }

  async function mostrarShell() {
    document.getElementById('login-screen').hidden = true;
    document.getElementById('app-shell').hidden = false;

    document.getElementById('sidebar-user-name').textContent = usuarioActual.nombre;
    document.getElementById('sidebar-user-avatar').textContent = (usuarioActual.nombre || '?')[0].toUpperCase();

    if (esVendedor()) {
      document.querySelectorAll('.nav-item-gestor').forEach((btn) => { btn.style.display = 'none'; });
      document.querySelectorAll('.nav-item-vendedor').forEach((btn) => { btn.hidden = false; btn.style.display = ''; });
    } else {
      document.querySelectorAll('.nav-item-vendedor').forEach((btn) => { btn.style.display = 'none'; });
      document.querySelectorAll('.nav-item-gestor').forEach((btn) => {
        const permiso = btn.dataset.perm;
        btn.style.display = puedeVer(permiso) ? '' : 'none';
      });
    }

    let vistaInicial = esVendedor() ? 'vendedor-panel' : 'dashboard';

    if (esVendedor()) {
      const fresco = await refrescarUsuario();
      if (fresco && fresco.perfilCompleto === false) {
        vistaInicial = 'vendedor-perfil';
        Toast.info('Completá tus datos de pago para poder cobrar tus ventas.');
      }
    }

    irAVista(vistaInicial);
    iniciarNotificaciones();
  }

  function iniciarNotificaciones() {
    clearInterval(intervaloNotificaciones);
    if (esVendedor() || !puedeVer('ventas')) return;
    const actualizar = () => { if (Views.ventas && Views.ventas.actualizarBadgeSilencioso) Views.ventas.actualizarBadgeSilencioso().catch(() => {}); };
    actualizar();
    intervaloNotificaciones = setInterval(actualizar, 30000);
  }

  async function irAVista(nombre) {
    if (!Views[nombre]) return;
    vistaActual = nombre;
    document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === nombre));
    document.getElementById('view-title').textContent = NOMBRES_VISTA[nombre] || nombre;
    document.getElementById('sidebar-nav').closest('.sidebar').classList.remove('open');

    const container = document.getElementById('view-container');
    try {
      await Views[nombre].render(container);
    } catch (err) {
      container.innerHTML = `<div class="empty-state">No se pudo cargar esta sección: ${err.message}</div>`;
    }
  }

  async function iniciar() {
    const token = Api.token();
    if (!token) return mostrarLogin();

    try {
      const { usuario } = await Api.get('/auth/me');
      usuarioActual = usuario;
      mostrarShell();
    } catch {
      mostrarLogin();
    }
  }

  function bindEventos() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('login-usuario').value.trim();
      const pass = document.getElementById('login-pass').value;
      try {
        const data = await Api.post('/auth/login', { usuario, pass });
        localStorage.setItem('jc_token', data.token);
        usuarioActual = data.usuario;
        mostrarShell();
      } catch (err) {
        document.getElementById('login-error').textContent = err.message;
        document.getElementById('login-error').hidden = false;
      }
    });

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => irAVista(btn.dataset.view));
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
      try { await Api.post('/auth/logout'); } catch { /* noop */ }
      localStorage.removeItem('jc_token');
      usuarioActual = null;
      clearInterval(intervaloNotificaciones);
      mostrarLogin();
    });

    document.getElementById('btn-mi-cuenta').addEventListener('click', () => Cuenta.abrir());

    document.getElementById('mobile-nav-toggle').addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('open');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEventos();
    iniciar();
  });

  return { usuario, mostrarLogin, irAVista, refrescarUsuario };
})();
