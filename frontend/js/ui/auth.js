import { api } from '../api.js';
import { state, loadState } from '../state.js';
import { showToast } from '../toast.js';
import { updateClockAndGreeting } from './clock.js';
import { renderAll } from '../render.js';

function updateSidebarAvatar() {
  const img = document.getElementById('sidebar-avatar');
  const seal = document.getElementById('sidebar-seal');
  const fotoUrl = state.usuario ? state.usuario.fotoUrl : null;

  img.src = fotoUrl || '';
  img.style.display = fotoUrl ? 'inline-block' : 'none';
  seal.style.display = fotoUrl ? 'none' : 'inline-block';
}

export function initAuth() {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const u = document.getElementById('login-user-input').value.trim();
    const p = document.getElementById('login-pass-input').value.trim();

    try {
      const result = await api.login(u, p);
      state.usuario = result.usuario;
      document.getElementById('login-overlay').style.display = 'none';
      updateClockAndGreeting();
      updateSidebarAvatar();

      const estadoResult = await loadState();
      if (!estadoResult.ok) {
        alert(`Sesión iniciada, pero no se pudieron cargar los datos del servidor.\n\nDetalle: ${estadoResult.error.message}`);
      }

      await renderAll();
      showToast(`¡Bienvenido/a, ${state.usuario.nombre}!`);
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('prof-foto-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !state.usuario) return;

    const formData = new FormData();
    formData.append('id', state.usuario.id);
    formData.append('foto', file);

    try {
      const actualizado = await api.uploadFoto(formData);
      state.usuario = { ...state.usuario, ...actualizado };
      renderPerfil();
      updateSidebarAvatar();
      showToast('Foto de perfil actualizada.');
    } catch (err) {
      alert(err.message);
    } finally {
      e.target.value = '';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    state.usuario = null;
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
      updateClockAndGreeting();
      updateSidebarAvatar();
      showToast('Perfil y clave actualizados correctamente.');
    } catch (err) {
      alert(err.message);
    }
  });
}

export function renderPerfil() {
  document.getElementById('prof-user').value = state.usuario ? state.usuario.nombre : '';

  const preview = document.getElementById('prof-foto-preview');
  const fotoUrl = state.usuario ? state.usuario.fotoUrl : null;
  preview.src = fotoUrl || '';
  preview.style.display = fotoUrl ? 'block' : 'none';
}
