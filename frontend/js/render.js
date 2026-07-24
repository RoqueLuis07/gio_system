import { state } from './state.js';
import { fmt } from './format.js';
import { renderProductosCards } from './ui/productos.js';
import { renderVentasTable } from './ui/ventas.js';
import { renderRecordatorios } from './ui/recordatorios.js';
import { renderPlantillas, renderWaSelects } from './ui/whatsapp.js';
import { renderCRM } from './ui/crm.js';
import { renderExportView } from './ui/exportar.js';
import { renderParametros } from './ui/parametros.js';
import { renderPerfil } from './ui/auth.js';
import { calcularEnTiempoReal } from './ui/calculadora.js';

export async function renderAll() {
  const pOptions = state.productos.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join('');

  document.getElementById('v-producto').innerHTML = pOptions;
  document.getElementById('crm-producto').innerHTML = '<option value="">— Seleccionar Diplomado —</option>' + pOptions;
  document.getElementById('csv-diplomado-select').innerHTML = pOptions;
  document.getElementById('exp-diplomado-select').innerHTML = '<option value="todos">Todos los Diplomados</option>' + pOptions;

  document.getElementById('v-metodo-pago').innerHTML = state.parametros.metodosPago.map((m) => `<option value="${m}">${m}</option>`).join('');
  document.getElementById('v-cargo').innerHTML = '<option value="">— Opcional —</option>' + state.parametros.cargos.map((c) => `<option value="${c}">${c}</option>`).join('');

  renderPerfil();
  renderParametros();

  document.getElementById('stat-ganancia').textContent = fmt(state.ventas.reduce((s, v) => s + v.comision, 0));
  document.getElementById('stat-monto-total').textContent = fmt(state.ventas.reduce((s, v) => s + v.monto, 0));
  document.getElementById('stat-ventas').textContent = state.ventas.length;

  renderProductosCards('dash-cards');
  renderProductosCards('productos-cards');
  renderVentasTable();
  renderRecordatorios();
  renderPlantillas();
  renderCRM();
  renderExportView();
  calcularEnTiempoReal();
  renderWaSelects();
}
