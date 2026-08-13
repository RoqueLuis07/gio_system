import { showToast } from '../toast.js';

const STORAGE_KEY = 'gmVentasProNavOrden';

function getNavButtons() {
  return Array.from(document.querySelectorAll('.sidebar .navbtn[data-view]'));
}

function leerOrdenGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function ordenActual() {
  const guardado = leerOrdenGuardado();
  const disponibles = getNavButtons().map((btn) => btn.dataset.view);

  // Empieza con el orden guardado (filtrando vistas que ya no existan) y agrega
  // al final cualquier vista nueva que todavía no esté en el orden guardado.
  const orden = guardado.filter((id) => disponibles.includes(id));
  disponibles.forEach((id) => { if (!orden.includes(id)) orden.push(id); });
  return orden;
}

function aplicarOrden(orden) {
  const botones = getNavButtons();
  orden.forEach((id, index) => {
    const btn = botones.find((b) => b.dataset.view === id);
    if (btn) btn.style.order = index + 1;
  });
}

function guardarOrden(orden) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orden));
  aplicarOrden(orden);
}

export function initNavOrden() {
  aplicarOrden(ordenActual());

  document.getElementById('nav-orden-lista').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mover]');
    if (!btn) return;

    const orden = ordenActual();
    const idx = orden.indexOf(btn.dataset.id);
    const destino = btn.dataset.mover === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || destino < 0 || destino >= orden.length) return;

    [orden[idx], orden[destino]] = [orden[destino], orden[idx]];
    guardarOrden(orden);
    renderNavOrden();
    showToast('Orden del menú actualizado.');
  });
}

export function renderNavOrden() {
  const el = document.getElementById('nav-orden-lista');
  if (!el) return;

  const botones = getNavButtons();
  const orden = ordenActual();

  el.innerHTML = orden.map((id, index) => {
    const btn = botones.find((b) => b.dataset.view === id);
    const label = btn ? btn.textContent.trim() : id;
    return `
      <div class="nav-orden-row">
        <span class="nav-orden-label">${label}</span>
        <div class="nav-orden-btns">
          <button data-mover="up" data-id="${id}" ${index === 0 ? 'disabled' : ''} title="Subir">▲</button>
          <button data-mover="down" data-id="${id}" ${index === orden.length - 1 ? 'disabled' : ''} title="Bajar">▼</button>
        </div>
      </div>
    `;
  }).join('');
}
