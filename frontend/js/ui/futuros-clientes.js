import { state } from '../state.js';
import { showToast } from '../toast.js';
import { descargarExcel } from '../xlsx-export.js';
import { abrirWhatsapp } from '../whatsapp.js';

function sugerenciasPorCargo(cargo) {
  const coincidencias = state.ventas.filter((v) => v.cargo === cargo);
  const porContacto = new Map();

  coincidencias.forEach((v) => {
    const clave = v.telefono || v.ci || v.cliente;
    const existente = porContacto.get(clave);
    if (!existente || (v.fecha || '') > (existente.fecha || '')) porContacto.set(clave, v);
  });

  return [...porContacto.values()].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
}

export function initFuturosClientes() {
  document.getElementById('fc-cargo-select').addEventListener('change', renderFuturosClientes);

  document.getElementById('fc-export-btn').addEventListener('click', () => {
    const cargo = document.getElementById('fc-cargo-select').value;
    if (!cargo) return;

    const sugerencias = sugerenciasPorCargo(cargo);
    if (sugerencias.length === 0) return alert('No hay sugerencias para este cargo.');

    const filas = sugerencias.map((v) => {
      const prod = state.productos.find((p) => p.id === v.productoId);
      return [v.cliente, v.telefono || '', v.email || '', v.empresa || '', v.cargo || '', prod ? prod.nombre : '', v.fecha];
    });

    descargarExcel(`Futuros_Clientes_${cargo.replace(/[^a-zA-Z0-9]+/g, '_')}.xls`, [
      {
        nombre: 'Sugerencias',
        headers: ['Cliente', 'Telefono', 'Email', 'Empresa', 'Cargo', 'Ultimo Diplomado', 'Fecha'],
        filas,
        anchos: [140, 100, 170, 130, 110, 200, 90],
      },
    ]);
    showToast('Sugerencias exportadas correctamente.');
  });

  document.getElementById('fc-resultados').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-contactar]');
    if (!btn) return;
    abrirWhatsapp(btn.dataset.contactar);
  });
}

export function renderFuturosClientes() {
  const select = document.getElementById('fc-cargo-select');
  const resumen = document.getElementById('fc-resumen');
  const tabla = document.getElementById('fc-resultados');
  const exportBtn = document.getElementById('fc-export-btn');
  if (!select) return;

  const valorPrevio = select.value;
  const cargos = state.parametros.cargos || [];
  select.innerHTML = '<option value="">— Seleccionar Cargo —</option>' + cargos.map((c) => `<option value="${c}">${c}</option>`).join('');
  if (cargos.includes(valorPrevio)) select.value = valorPrevio;

  const cargo = select.value;
  if (!cargo) {
    resumen.textContent = 'Seleccioná un cargo';
    exportBtn.disabled = true;
    tabla.innerHTML = `<div class="empty-state">Elegí un cargo para ver sugerencias de clientes.</div>`;
    return;
  }

  const sugerencias = sugerenciasPorCargo(cargo);
  resumen.textContent = `${sugerencias.length} sugerencia(s) para "${cargo}"`;
  exportBtn.disabled = sugerencias.length === 0;

  if (sugerencias.length === 0) {
    tabla.innerHTML = `<div class="empty-state">No hay clientes registrados con este cargo todavía.</div>`;
    return;
  }

  tabla.innerHTML = `
    <table>
      <thead><tr><th>Cliente</th><th>Empresa</th><th>Último Diplomado</th><th>Teléfono</th><th>Fecha</th><th>Acción</th></tr></thead>
      <tbody>
        ${sugerencias.map((v) => {
          const prod = state.productos.find((p) => p.id === v.productoId);
          return `
            <tr>
              <td><b>${v.cliente}</b></td>
              <td>${v.empresa || '—'}</td>
              <td><span class="pill">${prod ? prod.nombre : '—'}</span></td>
              <td class="mono">${v.telefono || '—'}</td>
              <td class="mono">${v.fecha}</td>
              <td>${v.telefono ? `<button class="btn wa btn-sm" data-contactar="${v.telefono}">💬 Contactar</button>` : '—'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
