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
};

export function applyState(data) {
  state.productos = data.productos;
  state.ventas = data.ventas;
  state.prospectos = data.prospectos;
  state.recordatorios = data.recordatorios;
  state.plantillas = data.plantillas;
  state.parametros = data.parametros;
  state.archivos = data.archivos || [];
}
