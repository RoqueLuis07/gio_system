import { showToast } from '../toast.js';

const THEME_KEY = 'gmVentasProTema';
const ACCENT_KEY = 'gmVentasProAcento';

const ACENTOS = [
  { id: 'violeta', label: 'Violeta', hex: '#7C6CFF' },
  { id: 'teal', label: 'Turquesa', hex: '#2FD9C3' },
  { id: 'gold', label: 'Dorado', hex: '#E7B65C' },
  { id: 'coral', label: 'Coral', hex: '#FF6B5D' },
  { id: 'azul', label: 'Azul', hex: '#3B82F6' },
  { id: 'rosa', label: 'Rosa', hex: '#EC4899' },
];

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function leerTema() {
  return localStorage.getItem(THEME_KEY) || 'oscuro';
}

function leerAcento() {
  return localStorage.getItem(ACCENT_KEY) || 'violeta';
}

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema === 'claro' ? 'light' : 'dark');
}

function aplicarAcento(id) {
  const acento = ACENTOS.find((a) => a.id === id) || ACENTOS[0];
  document.documentElement.style.setProperty('--violet', acento.hex);
  document.documentElement.style.setProperty('--violet-rgb', hexToRgb(acento.hex));
}

function renderThemeControls() {
  const temaSel = document.getElementById('param-tema');
  if (temaSel) temaSel.value = leerTema();

  const wrap = document.getElementById('param-acentos');
  if (!wrap) return;
  const actual = leerAcento();
  wrap.innerHTML = ACENTOS.map((a) => `
    <button type="button" data-acento="${a.id}" class="acento-swatch ${actual === a.id ? 'acento-swatch-active' : ''}" style="background:${a.hex};" title="${a.label}"></button>
  `).join('');
}

export function initTheme() {
  aplicarTema(leerTema());
  aplicarAcento(leerAcento());
  renderThemeControls();

  document.getElementById('param-tema').addEventListener('change', (e) => {
    localStorage.setItem(THEME_KEY, e.target.value);
    aplicarTema(e.target.value);
    showToast('Tema actualizado.');
  });

  document.getElementById('param-acentos').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-acento]');
    if (!btn) return;
    localStorage.setItem(ACCENT_KEY, btn.dataset.acento);
    aplicarAcento(btn.dataset.acento);
    renderThemeControls();
    showToast('Color de acento actualizado.');
  });
}
