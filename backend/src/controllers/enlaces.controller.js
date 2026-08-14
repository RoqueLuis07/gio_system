const { makeCrudController } = require('./crud.factory');

function buildEnlace(body) {
  const titulo = (body.titulo || '').trim();
  let url = (body.url || '').trim();
  if (!titulo || !url) throw new Error('Ingresa título y URL del enlace.');

  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  return { titulo, url };
}

module.exports = makeCrudController('enlaces', buildEnlace);
