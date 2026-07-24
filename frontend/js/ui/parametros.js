import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';

export function initParametros() {
  document.getElementById('param-save-btn').addEventListener('click', async () => {
    const metodosPago = document.getElementById('param-metodos-pago').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const cargos = document.getElementById('param-cargos').value.split('\n').map((s) => s.trim()).filter(Boolean);

    if (metodosPago.length === 0 || cargos.length === 0) return alert('Debes ingresar al menos un método de pago y un cargo.');

    try {
      state.parametros = await api.parametros.update({ metodosPago, cargos });
      await renderAll();
      showToast('Parámetros actualizados correctamente.');
    } catch (err) {
      alert(err.message);
    }
  });
}

export function renderParametros() {
  document.getElementById('param-metodos-pago').value = state.parametros.metodosPago.join('\n');
  document.getElementById('param-cargos').value = state.parametros.cargos.join('\n');
}
