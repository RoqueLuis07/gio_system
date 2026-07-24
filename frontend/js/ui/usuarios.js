import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';

export function initUsuarios() {
  document.getElementById('usr-submit').addEventListener('click', async () => {
    const nombre = document.getElementById('usr-nombre').value.trim();
    const pass = document.getElementById('usr-pass').value.trim();
    const rol = document.getElementById('usr-rol').value;

    if (!nombre || !pass) return alert('Ingresa nombre de usuario y contraseña.');

    try {
      const nuevo = await api.usuarios.create({ nombre, pass, rol });
      state.usuarios.push(nuevo);
      document.getElementById('usr-nombre').value = '';
      document.getElementById('usr-pass').value = '';
      renderUsuarios();
      showToast('Usuario creado con éxito.');
    } catch (err) {
      alert(err.message);
    }
  });
}

// Refresca la visibilidad de la sección "Usuarios" y carga el listado solo si
// el usuario autenticado tiene rol superadmin (gestión de usuarios por categorías).
export async function refreshUsuariosVisibility() {
  const navBtn = document.getElementById('nav-usuarios');
  const esSuperadmin = !!state.usuario && state.usuario.rol === 'superadmin';

  navBtn.style.display = esSuperadmin ? '' : 'none';

  if (!esSuperadmin) {
    state.usuarios = [];
    return;
  }

  try {
    state.usuarios = await api.usuarios.list();
  } catch (err) {
    state.usuarios = [];
  }
}

window.editarUsuario = async function editarUsuario(id) {
  const u = state.usuarios.find((x) => x.id === id);
  if (!u) return;

  const nuevoNombre = prompt('Editar nombre de usuario:', u.nombre);
  if (nuevoNombre === null) return;
  const nuevoRol = prompt('Rol (superadmin / vendedor):', u.rol);
  if (nuevoRol === null) return;
  const nuevaPass = prompt('Nueva contraseña (dejar vacío para no cambiarla):', '');
  if (nuevaPass === null) return;

  try {
    const actualizado = await api.usuarios.update(id, {
      nombre: nuevoNombre.trim(),
      rol: nuevoRol.trim(),
      pass: nuevaPass.trim(),
    });
    Object.assign(u, actualizado);
    renderUsuarios();
    showToast('Usuario actualizado.');
  } catch (err) {
    alert(err.message);
  }
};

window.borrarUsuario = async function borrarUsuario(id) {
  if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
  try {
    await api.usuarios.remove(id);
    state.usuarios = state.usuarios.filter((x) => x.id !== id);
    renderUsuarios();
    showToast('Usuario eliminado.');
  } catch (err) {
    alert(err.message);
  }
};

export function renderUsuarios() {
  const el = document.getElementById('usr-table');
  if (!el) return;

  if (!state.usuario || state.usuario.rol !== 'superadmin') {
    el.innerHTML = '';
    return;
  }

  if (state.usuarios.length === 0) {
    el.innerHTML = `<div class="empty-state">No hay usuarios para mostrar.</div>`;
    return;
  }

  el.innerHTML = `
    <table>
      <thead><tr><th>Usuario</th><th>Categoría / Rol</th><th>Acción</th></tr></thead>
      <tbody>
        ${state.usuarios.map((u) => `
          <tr>
            <td><b>${u.nombre}</b>${u.id === state.usuario.id ? ' <span class="pill">tú</span>' : ''}</td>
            <td><span class="pill" style="color:var(--gold);">${u.rol.toUpperCase()}</span></td>
            <td style="white-space:nowrap;">
              <button class="btn secondary btn-sm" onclick="editarUsuario('${u.id}')">✏️ Editar</button>
              <button class="btn danger btn-sm" onclick="borrarUsuario('${u.id}')">🗑️ Borrar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
