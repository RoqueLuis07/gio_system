const { makeCrudController } = require('./crud.factory');

function buildPlantilla(body) {
  const titulo = (body.titulo || '').trim();
  const cuerpo = (body.cuerpo || '').trim();
  if (!titulo || !cuerpo) throw new Error('Ingresa título y texto para la plantilla.');

  return { titulo, cuerpo };
}

module.exports = makeCrudController('plantillas', buildPlantilla);
