const { makeCrudController } = require('./crud.factory');

function buildRecordatorio(body) {
  const titulo = (body.titulo || '').trim();
  const fecha = body.fecha || '';
  if (!titulo || !fecha) throw new Error('Ingresa un título y fecha para el recordatorio.');

  return {
    titulo,
    fecha,
    cliente: (body.cliente || '').trim(),
    completado: !!body.completado,
    comentario: body.comentario || '',
    imagen: body.imagen || null,
  };
}

module.exports = makeCrudController('recordatorios', buildRecordatorio);
