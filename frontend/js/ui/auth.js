import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { updateClockAndGreeting } from './clock.js';

export function initAuth() {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const u = document.getElementById('login-user-input').value.trim();
    const p = document.getElementById('login-pass-input').value.trim();

    try {
      const result = await api.login(u, p);
      state.usuario = result.usuario;
      document.getElementById('login-overlay').style.display = 'none';
      updateClockAndGreeting();
      showToast(`¡Bienvenido/a, ${u}!`);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    document.getElementById('login-overlay').style.display = 'flex';
  });

  document.getElementById('prof-save-btn').addEventListener('click', async () => {
    const u = document.getElementById('prof-user').value.trim();
    const p = document.getElementById('prof-pass').value.trim();
    if (!u || !p) return alert('Completa todos los campos');

    try {
      state.usuario = await api.updateProfile(u, p);
      updateClockAndGreeting();
      showToast('Perfil y clave actualizados correctamente.');
    } catch (err) {
      alert(err.message);
    }
  });
}

export function renderPerfil() {
  document.getElementById('prof-user').value = state.usuario.nombre;
}
