import { state } from '../state.js';
import { fmt } from '../format.js';
import { showToast } from '../toast.js';
import { descargarExcel } from '../xlsx-export.js';

export function initExportar() {
  document.getElementById('exp-diplomado-select').addEventListener('change', renderExportView);

  document.getElementById('exp-download-btn').addEventListener('click', () => {
    const selId = document.getElementById('exp-diplomado-select').value;
    let list = state.ventas;
    if (selId !== 'todos') list = state.ventas.filter((v) => v.productoId === selId);

    if (list.length === 0) return alert('No hay alumnos para exportar.');

    const filas = list.map((v) => {
      const prod = state.productos.find((x) => x.id === v.productoId);
      return [v.cliente, v.ci || '', v.email || '', v.telefono || '', prod ? prod.nombre : '', v.empresa || '', v.cargo || '', v.fecha, v.monto, v.descuento || 0, v.comision];
    });

    descargarExcel(`Alumnos_Exportados_${selId}_${new Date().toISOString().slice(0, 10)}.xls`, [
      {
        nombre: 'Alumnos',
        headers: ['Alumno', 'CI', 'Email', 'Telefono', 'Diplomado', 'Empresa', 'Cargo', 'Fecha', 'Monto', 'Descuento(%)', 'Comision'],
        filas,
        anchos: [140, 90, 170, 100, 200, 130, 110, 90, 100, 90, 100],
      },
    ]);
    showToast('Base descargada correctamente.');
  });
}

export function renderExportView() {
  const selId = document.getElementById('exp-diplomado-select').value;
  const tableEl = document.getElementById('exp-preview-table');
  const btnExp = document.getElementById('exp-download-btn');
  const cantLabel = document.getElementById('exp-cant-label');

  let filtrados = state.ventas;
  if (selId !== 'todos') {
    filtrados = state.ventas.filter((v) => v.productoId === selId);
  }

  cantLabel.textContent = `${filtrados.length} Registros encontrados`;

  if (filtrados.length === 0) {
    btnExp.disabled = true;
    tableEl.innerHTML = `<div class="empty-state">No hay alumnos registrados para este diplomado.</div>`;
    return;
  }

  btnExp.disabled = false;
  tableEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Alumno</th>
          <th>CI</th>
          <th>Email</th>
          <th>Teléfono</th>
          <th>Diplomado</th>
          <th>Empresa</th>
          <th>Fecha</th>
          <th>Monto</th>
          <th>Descuento</th>
        </tr>
      </thead>
      <tbody>
        ${filtrados.map((v) => {
          const prod = state.productos.find((x) => x.id === v.productoId);
          return `
            <tr>
              <td><b>${v.cliente}</b></td>
              <td class="mono">${v.ci || '—'}</td>
              <td>${v.email || '—'}</td>
              <td>${v.telefono || '—'}</td>
              <td><span class="pill">${prod ? prod.nombre : 'Desconocido'}</span></td>
              <td>${v.empresa || 'Particular'}</td>
              <td class="mono">${v.fecha}</td>
              <td class="amt-teal">${fmt(v.monto)}</td>
              <td class="mono">${v.descuento || 0}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
