import { api } from '../api.js';
import { state } from '../state.js';
import { fmt, moneyVal } from '../format.js';
import { showToast } from '../toast.js';
import { switchView } from '../nav.js';
import { renderAll } from '../render.js';
import { calcularEnTiempoReal } from './calculadora.js';

export function initProductos() {
  document.getElementById('p-submit').addEventListener('click', async () => {
    const nombre = document.getElementById('p-nombre').value.trim();
    const precio = moneyVal('p-precio');
    const meta = parseInt(document.getElementById('p-meta').value, 10) || 0;
    const valor = parseFloat(document.getElementById('p-valor').value) || 8.5;

    if (!nombre || !precio) return alert('Completa los datos del diplomado.');

    try {
      const producto = await api.productos.create({ nombre, precio, meta, valor });
      state.productos.push(producto);
      document.getElementById('p-nombre').value = '';
      await renderAll();
      showToast('Diplomado creado con éxito.');
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('csv-process-btn').addEventListener('click', async () => {
    const productoId = document.getElementById('csv-diplomado-select').value;
    const defaultMonto = moneyVal('csv-default-monto');
    const texto = document.getElementById('csv-text-input').value;

    try {
      const nuevas = await api.ventas.bulkCreate({ productoId, defaultMonto, texto });
      state.ventas.push(...nuevas);
      document.getElementById('csv-text-input').value = '';
      await renderAll();
      showToast(`${nuevas.length} alumno(s) cargado(s) con éxito.`);
    } catch (err) {
      alert(err.message);
    }
  });
}

window.editarDiplomado = async function editarDiplomado(id) {
  const p = state.productos.find((x) => x.id === id);
  if (!p) return;
  const nuevoNombre = prompt('Editar Nombre del Diplomado:', p.nombre);
  if (!nuevoNombre) return;
  const nuevoPrecio = prompt('Editar Precio (₲):', p.precio);
  const nuevaMeta = prompt('Editar Meta de Alumnos:', p.meta);
  const nuevaComision = prompt('Editar % Comisión:', p.valor);

  try {
    const actualizado = await api.productos.update(id, {
      nombre: nuevoNombre,
      precio: parseInt(nuevoPrecio, 10) || p.precio,
      meta: parseInt(nuevaMeta, 10) || p.meta,
      valor: parseFloat(nuevaComision) || p.valor,
    });
    Object.assign(p, actualizado);
    await renderAll();
    showToast('Diplomado actualizado.');
  } catch (err) {
    alert(err.message);
  }
};

window.concluirDiplomado = async function concluirDiplomado(id) {
  const p = state.productos.find((x) => x.id === id);
  if (!p) return;
  const nuevoEstado = p.estado === 'concluido' ? 'activo' : 'concluido';
  const confirmMsg = nuevoEstado === 'concluido'
    ? '¿Marcar este diplomado como concluido? No se borra ningún dato: los alumnos y ventas quedan intactos, solo deja de estar disponible para nuevas inscripciones.'
    : '¿Reabrir este diplomado para nuevas inscripciones?';
  if (!confirm(confirmMsg)) return;

  try {
    const actualizado = await api.productos.update(id, { estado: nuevoEstado });
    Object.assign(p, actualizado);
    await renderAll();
    showToast(nuevoEstado === 'concluido' ? 'Diplomado marcado como concluido.' : 'Diplomado reabierto.');
  } catch (err) {
    alert(err.message);
  }
};

window.borrarDiplomado = async function borrarDiplomado(id) {
  if (!confirm('¿Seguro que deseas eliminar este diplomado?')) return;
  try {
    await api.productos.remove(id);
    state.productos = state.productos.filter((x) => x.id !== id);
    await renderAll();
    showToast('Diplomado eliminado.');
  } catch (err) {
    alert(err.message);
  }
};

window.venderDiplomadoDirecto = function venderDiplomadoDirecto(id) {
  document.getElementById('v-producto').value = id;
  const p = state.productos.find((x) => x.id === id);
  if (p) {
    document.getElementById('v-monto').value = Math.round(p.precio).toLocaleString('es-PY');
    document.getElementById('v-porcentaje').value = p.valor;
  }
  switchView('ventas');
  calcularEnTiempoReal();
  showToast('Diplomado seleccionado para la venta.');
};

export function renderProductosCards(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  if (state.productos.length === 0) {
    el.innerHTML = `<div class="empty-state">Sin diplomados registrados.</div>`;
    return;
  }

  el.innerHTML = state.productos.map((p) => {
    const vs = state.ventas.filter((v) => v.productoId === p.id);
    const totalComision = vs.reduce((s, v) => s + v.comision, 0);
    const concluido = p.estado === 'concluido';

    return `
      <div class="diploma-card" style="${concluido ? 'opacity:0.75;' : ''}">
        <div class="diploma-title">${p.nombre} ${concluido ? '<span class="pill" style="color:var(--coral);">CONCLUIDO</span>' : ''}</div>
        <div class="diploma-price">${fmt(p.precio)} · ${p.valor}% com.</div>
        <div class="diploma-count mono">${vs.length}</div>
        <div class="diploma-count-label">Alumnos Inscritos (Meta: ${p.meta || 0})</div>
        <div class="diploma-earn">${fmt(totalComision)} comisiones</div>

        <div class="diploma-actions">
          ${concluido ? '' : `<button class="btn btn-sm" onclick="venderDiplomadoDirecto('${p.id}')">🛍️ Vender</button>`}
          <button class="btn secondary btn-sm" onclick="editarDiplomado('${p.id}')">✏️ Editar</button>
          <button class="btn secondary btn-sm" onclick="concluirDiplomado('${p.id}')">${concluido ? '↩️ Reabrir' : '✅ Concluir'}</button>
          <button class="btn danger btn-sm" onclick="borrarDiplomado('${p.id}')">🗑️ Borrar</button>
        </div>
      </div>
    `;
  }).join('');
}
