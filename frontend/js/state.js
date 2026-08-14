import { api } from './api.js';

export const state = {
  usuario: null,
  usuarios: [],
  productos: [],
  ventas: [],
  prospectos: [],
  recordatorios: [],
  plantillas: [],
  parametros: { metodosPago: [], cargos: [], moneda: '₲' },
  archivos: [],
  enlaces: [],
};

export function applyState(data) {
  state.productos = data.productos;
  state.ventas = data.ventas;
  state.prospectos = data.prospectos;
  state.recordatorios = data.recordatorios;
  state.plantillas = data.plantillas;
  state.parametros = data.parametros;
  state.archivos = data.archivos || [];
  state.enlaces = data.enlaces || [];
}

// Reintenta la carga del estado ante fallas transitorias (ej. errores intermitentes
// de conexión con Supabase) para no dejar la app con datos vacíos por una falla puntual.
export async function loadState(retries = 3, delayMs = 1200) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await api.getState();
      applyState(data);
      return { ok: true };
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return { ok: false, error: lastError };
}
