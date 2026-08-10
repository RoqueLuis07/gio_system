import { api } from '../api.js';
import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderAll } from '../render.js';
import { switchView } from '../nav.js';
import { calcularEnTiempoReal } from './calculadora.js';

const STAGES = [
  { key: 'nuevo', label: 'Nuevo', dot: 'stage-nuevo' },
  { key: 'negociacion', label: 'En Negociación', dot: 'stage-negociacion' },
  { key: 'ganado', label: 'Ganado', dot: 'stage-ganado' },
  { key: 'perdido', label: 'Perdido', dot: 'stage-perdido' },
];

let dragId = null;

export function initCrm() {
  document.getElementById('crm-submit').addEventListener('click', async () => {
    const nombre = document.getElementById('crm-nombre').value.trim();
    const telefono = document.getElementById('crm-telefono').value.trim();
    const productoId = document.getElementById('crm-producto').value;

    if (!nombre || !productoId) return alert('Por favor ingresa el Nombre y selecciona un Diplomado de Interés.');

    try {
      const prospecto = await api.prospectos.create({ nombre, telefono, productoId });
      state.prospectos.push(prospecto);
      document.getElementById('crm-nombre').value = '';
      document.getElementById('crm-telefono').value = '';
      await renderAll();
      showToast('Prospecto agregado al pipeline.');
    } catch (err) {
      alert(err.message);
    }
  });
}

window.borrarProspecto = async function borrarProspecto(id) {
  try {
    await api.prospectos.remove(id);
    state.prospectos = state.prospectos.filter((p) => p.id !== id);
    await renderAll();
    showToast('Prospecto eliminado.');
  } catch (err) {
    alert(err.message);
  }
};

window.moverProspecto = async function moverProspecto(id, estado) {
  const prospecto = state.prospectos.find((p) => p.id === id);
  if (!prospecto || prospecto.estado === estado) return;

  try {
    const actualizado = await api.prospectos.update(id, { estado });
    Object.assign(prospecto, actualizado);
    await renderAll();
  } catch (err) {
    alert(err.message);
  }
};

window.convertirProspecto = function convertirProspecto(id) {
  const prospecto = state.prospectos.find((p) => p.id === id);
  if (!prospecto) return;

  document.getElementById('v-producto').value = prospecto.productoId;
  document.getElementById('v-cliente').value = prospecto.nombre;
  document.getElementById('v-telefono').value = prospecto.telefono || '';

  switchView('ventas');
  calcularEnTiempoReal();
  showToast(`Convirtiendo a ${prospecto.nombre} en venta.`);
};

function attachDragHandlers() {
  document.querySelectorAll('.kanban-card').forEach((card) => {
    card.addEventListener('dragstart', () => {
      dragId = card.dataset.id;
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  document.querySelectorAll('.kanban-col').forEach((col) => {
    col.addEventListener('dragover', (e) => e.preventDefault());
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragId) window.moverProspecto(dragId, col.dataset.estado);
      dragId = null;
    });
  });
}

export function renderCRM() {
  const el = document.getElementById('crm-kanban');
  if (!el) return;

  el.innerHTML = STAGES.map((stage, si) => {
    const items = state.prospectos.filter((p) => p.estado === stage.key);
    return `
      <div class="kanban-col" data-estado="${stage.key}">
        <div class="kanban-col-head">
          <span class="stage-dot ${stage.dot}"></span>
          <span class="stage-title">${stage.label}</span>
          <span class="stage-count">${items.length}</span>
        </div>
        <div class="kanban-cards">
          ${items.length === 0 ? '<div class="kanban-empty">Sin prospectos</div>' : items.map((p) => {
            const prod = state.productos.find((x) => x.id === p.productoId);
            return `
              <div class="kanban-card" draggable="true" data-id="${p.id}">
                <div class="kanban-card-top">
                  <span class="kanban-card-name">${p.nombre}</span>
                  <button class="kanban-card-x" onclick="borrarProspecto('${p.id}')">✕</button>
                </div>
                <div class="kanban-card-sub">${prod ? prod.nombre : '—'}</div>
                ${p.telefono ? `<div class="kanban-card-phone">📞 ${p.telefono}</div>` : ''}
                <div class="kanban-card-actions">
                  ${si > 0 ? `<button class="mini-btn" onclick="moverProspecto('${p.id}','${STAGES[si - 1].key}')">←</button>` : ''}
                  ${si < STAGES.length - 1 ? `<button class="mini-btn flex1" onclick="moverProspecto('${p.id}','${STAGES[si + 1].key}')">Avanzar →</button>` : ''}
                  ${stage.key === 'ganado' ? `<button class="mini-btn flex1 mini-teal" onclick="convertirProspecto('${p.id}')">Convertir →</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  attachDragHandlers();
}
