import { state } from '../state.js';
import { fmt } from '../format.js';
import { showToast } from '../toast.js';

function ventasEnRango() {
  const desde = document.getElementById('rep-fecha-inicio').value;
  const hasta = document.getElementById('rep-fecha-fin').value;

  return state.ventas.filter((v) => {
    if (desde && v.fecha < desde) return false;
    if (hasta && v.fecha > hasta) return false;
    return true;
  });
}

function descargarCSV(nombre, headers, filas) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  let csv = headers.map(esc).join(',') + '\n';
  filas.forEach((fila) => { csv += fila.map(esc).join(',') + '\n'; });

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export function initReportes() {
  ['rep-fecha-inicio', 'rep-fecha-fin'].forEach((id) => {
    document.getElementById(id).addEventListener('change', renderReportesPreview);
  });

  document.getElementById('rep-export-diplomado-btn').addEventListener('click', () => {
    const ventas = ventasEnRango();
    if (ventas.length === 0) return alert('No hay ventas en el período seleccionado.');

    const porDiplomado = {};
    ventas.forEach((v) => {
      const prod = state.productos.find((p) => p.id === v.productoId);
      const nombre = prod ? prod.nombre : 'Diplomado eliminado';
      if (!porDiplomado[nombre]) porDiplomado[nombre] = { alumnos: 0, monto: 0, comision: 0 };
      porDiplomado[nombre].alumnos += 1;
      porDiplomado[nombre].monto += v.monto;
      porDiplomado[nombre].comision += v.comision;
    });

    const filas = Object.entries(porDiplomado).map(([nombre, r]) => [nombre, r.alumnos, r.monto, r.comision]);
    descargarCSV(
      `Reporte_Por_Diplomado_${rangoParaNombre()}.csv`,
      ['Diplomado', 'Cantidad de Alumnos', 'Monto Total', 'Comision Total'],
      filas
    );
    showToast('Reporte por diplomado descargado.');
  });

  document.getElementById('rep-export-alumnos-btn').addEventListener('click', () => {
    const ventas = ventasEnRango();
    if (ventas.length === 0) return alert('No hay ventas en el período seleccionado.');

    const filas = ventas.map((v) => {
      const prod = state.productos.find((p) => p.id === v.productoId);
      return [v.cliente, v.ci || '', v.telefono || '', prod ? prod.nombre : '', v.empresa || '', v.fecha, v.monto, v.descuento || 0, v.comision];
    });

    descargarCSV(
      `Reporte_Por_Alumnos_${rangoParaNombre()}.csv`,
      ['Alumno', 'CI', 'Telefono', 'Diplomado', 'Empresa', 'Fecha', 'Monto', 'Descuento(%)', 'Comision'],
      filas
    );
    showToast('Reporte por alumnos descargado.');
  });
}

function rangoParaNombre() {
  const desde = document.getElementById('rep-fecha-inicio').value || 'inicio';
  const hasta = document.getElementById('rep-fecha-fin').value || 'hoy';
  return `${desde}_a_${hasta}`;
}

export function renderReportesPreview() {
  const resumenEl = document.getElementById('rep-resumen');
  const tableEl = document.getElementById('rep-preview-table');
  if (!resumenEl || !tableEl) return;

  const ventas = ventasEnRango();
  const monto = ventas.reduce((s, v) => s + v.monto, 0);
  resumenEl.textContent = `${ventas.length} venta(s) · ${fmt(monto)}`;

  if (ventas.length === 0) {
    tableEl.innerHTML = `<div class="empty-state">No hay ventas en el rango seleccionado.</div>`;
    return;
  }

  tableEl.innerHTML = `
    <table>
      <thead><tr><th>Alumno</th><th>Diplomado</th><th>Fecha</th><th>Monto</th><th>Comisión</th></tr></thead>
      <tbody>
        ${ventas.map((v) => {
          const prod = state.productos.find((p) => p.id === v.productoId);
          return `
            <tr>
              <td><b>${v.cliente}</b></td>
              <td><span class="pill">${prod ? prod.nombre : '—'}</span></td>
              <td class="mono">${v.fecha}</td>
              <td class="amt-teal">${fmt(v.monto)}</td>
              <td class="amt-gold">${fmt(v.comision)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
