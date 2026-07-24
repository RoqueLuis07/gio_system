import { api } from './api.js';
import { applyState } from './state.js';
import { attachMoneyInput } from './format.js';
import { initNav } from './nav.js';
import { renderAll } from './render.js';
import { initAuth } from './ui/auth.js';
import { initClock } from './ui/clock.js';
import { initProductos } from './ui/productos.js';
import { initVentas } from './ui/ventas.js';
import { initCrm } from './ui/crm.js';
import { initWhatsapp } from './ui/whatsapp.js';
import { initExportar } from './ui/exportar.js';
import { initRecordatorios } from './ui/recordatorios.js';
import { initCalculadora, calcularEnTiempoReal } from './ui/calculadora.js';
import { initParametros } from './ui/parametros.js';
import { initUsuarios } from './ui/usuarios.js';

async function init() {
  document.getElementById('v-fecha').value = new Date().toISOString().slice(0, 10);
  document.getElementById('rec-fecha').value = new Date().toISOString().slice(0, 10);

  ['v-monto', 'p-precio', 'c-monto', 'csv-default-monto'].forEach((id) => attachMoneyInput(id, calcularEnTiempoReal));

  initNav();
  initAuth();
  initClock();
  initProductos();
  initVentas();
  initCrm();
  initWhatsapp();
  initExportar();
  initRecordatorios();
  initCalculadora();
  initParametros();
  initUsuarios();

  try {
    const data = await api.getState();
    applyState(data);
  } catch (err) {
    alert('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
  }

  await renderAll();
}

init();
