import { loadState } from './state.js';
import { attachMoneyInput } from './format.js';
import { initNav } from './nav.js';
import { renderAll } from './render.js';
import { initAuth } from './ui/auth.js';
import { initClock } from './ui/clock.js';
import { initProductos } from './ui/productos.js';
import { initVentas } from './ui/ventas.js';
import { initCrm } from './ui/crm.js';
import { initExportar } from './ui/exportar.js';
import { initRecordatorios } from './ui/recordatorios.js';
import { initCalculadora, calcularEnTiempoReal } from './ui/calculadora.js';
import { initParametros } from './ui/parametros.js';
import { initWaModulo } from './ui/wa-modulo.js';
import { initRepositorio } from './ui/repositorio.js';
import { initReportes } from './ui/reportes.js';
import { initComisiones } from './ui/comisiones.js';
import { initHistorico } from './ui/historico.js';
import { initDiplomadosConcluidos } from './ui/diplomados-concluidos.js';
import { initNavOrden } from './ui/nav-orden.js';
import { initFuturosClientes } from './ui/futuros-clientes.js';

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
  initExportar();
  initRecordatorios();
  initCalculadora();
  initParametros();
  initWaModulo();
  initRepositorio();
  initReportes();
  initComisiones();
  initHistorico();
  initDiplomadosConcluidos();
  initNavOrden();
  initFuturosClientes();

  const result = await loadState();
  if (!result.ok) {
    alert(`No se pudo cargar el estado inicial desde el servidor.\n\nDetalle: ${result.error.message}`);
  }

  await renderAll();
}

init();
