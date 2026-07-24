export const state = {
  usuario: { nombre: 'GM Ventas' },
  productos: [],
  ventas: [],
  prospectos: [],
  recordatorios: [],
  plantillas: [],
  parametros: { metodosPago: [], cargos: [], moneda: '₲' },
};

export function applyState(data) {
  state.usuario = data.usuario;
  state.productos = data.productos;
  state.ventas = data.ventas;
  state.prospectos = data.prospectos;
  state.recordatorios = data.recordatorios;
  state.plantillas = data.plantillas;
  state.parametros = data.parametros;
}
