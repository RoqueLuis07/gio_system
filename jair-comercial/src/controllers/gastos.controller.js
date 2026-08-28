const { makeCrudController } = require('./crud.factory');

const TIPOS_VALIDOS = ['compra', 'reposicion', 'otro'];

function buildGasto(body) {
  const descripcion = (body.descripcion || '').trim();
  const monto = Number(body.monto);
  if (!descripcion) throw new Error('La descripción es obligatoria.');
  if (!monto || monto <= 0) throw new Error('Ingresá un monto válido.');

  return {
    tipo: TIPOS_VALIDOS.includes(body.tipo) ? body.tipo : 'otro',
    descripcion,
    monto,
    fecha: body.fecha || new Date().toISOString().slice(0, 10),
  };
}

module.exports = makeCrudController('gastos', buildGasto);
