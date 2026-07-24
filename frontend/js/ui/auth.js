import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { updateClockAndGreeting } from './clock.js';
import { renderAll } from '../render.js';

const SESSION_KEY = 'gmVentasProSession';

function saveSession(usuario) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function initAuth() {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const u = document.getElementById('login-user-input').value.trim();
    const p = document.getElementById('login-pass-input').value.trim();

    try {
      const result = await api.login(u, p);
      state.usuario = result.usuario;
      saveSession(state.usuario);
      document.getElementById('login-overlay').style.display = 'none';
      updateClockAndGreeting();
      await renderAll();
      showToast(`¡Bienvenido/a, ${state.usuario.nombre}!`);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    state.usuario = null;
    clearSession();
    document.getElementById('login-overlay').style.display = 'flex';
  });

  document.getElementById('prof-save-btn').addEventListener('click', async () => {
    if (!state.usuario) return;
    const u = document.getElementById('prof-user').value.trim();
    const p = document.getElementById('prof-pass').value.trim();
    if (!u || !p) return alert('Completa todos los campos');

    try {
      const actualizado = await api.updateProfile(state.usuario.id, u, p);
      state.usuario = { ...state.usuario, ...actualizado };
      saveSession(state.usuario);
      updateClockAndGreeting();
      showToast('Perfil y clave actualizados correctamente.');
    } catch (err) {
      alert(err.message);
    }
  });
}

// Restaura la sesión guardada en el navegador (si existe) para que un refresh
// de la página no obligue a volver a iniciar sesión. Los datos de la app viven
// siempre en el backend; esto solo evita repetir el login en cada recarga.
export function restoreSession() {
  const usuario = loadSession();
  if (!usuario) return;

  state.usuario = usuario;
  document.getElementById('login-overlay').style.display = 'none';
  updateClockAndGreeting();
}

export function renderPerfil() {
  document.getElementById('prof-user').value = state.usuario ? state.usuario.nombre : '';
}
