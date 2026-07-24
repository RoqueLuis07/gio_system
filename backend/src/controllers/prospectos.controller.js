const { makeCrudController } = require('./crud.factory');

function buildProspecto(body, isUpdate) {
  const nombre = (body.nombre || '').trim();
  const productoId = body.productoId || '';
  if (!nombre || !productoId) throw new Error('Ingresa el Nombre y selecciona un Diplomado de Interés.');

  return {
    nombre,
    productoId,
    telefono: (body.telefono || '').trim(),
    estado: body.estado || 'nuevo',
    fecha: isUpdate ? body.fecha : new Date().toISOString().slice(0, 10),
  };
}

module.exports = makeCrudController('prospectos', buildProspecto);
