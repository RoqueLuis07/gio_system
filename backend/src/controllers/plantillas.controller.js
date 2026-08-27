const { makeCrudController } = require('./crud.factory');

function buildPlantilla(body) {
  const titulo = (body.titulo || '').trim();
  const cuerpo = (body.cuerpo || '').trim();
  const canal = (body.canal || 'whatsapp').trim();
  const asunto = (body.asunto || '').trim();

  if (!titulo || !cuerpo) throw new Error('Ingresa título y texto para la plantilla.');
  if (!['whatsapp', 'email'].includes(canal)) throw new Error('Canal de plantilla inválido.');
  if (canal === 'email' && !asunto) throw new Error('Ingresa el asunto para la plantilla de email.');

  return { titulo, cuerpo, canal, asunto: asunto || null };
}

module.exports = makeCrudController('plantillas', buildPlantilla);
