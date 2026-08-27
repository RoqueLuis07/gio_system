const { makeCrudController } = require('./crud.factory');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildGrupo(body) {
  const nombre = (body.nombre || '').trim();
  if (!nombre) throw new Error('Ingresa un nombre para el grupo.');

  const ventaIds = Array.isArray(body.ventaIds) ? body.ventaIds.filter((id) => typeof id === 'string') : [];
  const emailsManuales = Array.isArray(body.emailsManuales)
    ? body.emailsManuales.map((e) => (e || '').trim()).filter((e) => EMAIL_REGEX.test(e))
    : [];

  if (ventaIds.length === 0 && emailsManuales.length === 0) {
    throw new Error('El grupo necesita al menos un cliente existente o un correo.');
  }

  return { nombre, ventaIds, emailsManuales };
}

module.exports = makeCrudController('grupos_envio', buildGrupo);
