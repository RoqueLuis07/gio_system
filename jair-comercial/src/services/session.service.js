const crypto = require('crypto');

// Sesiones en memoria: simples y suficientes para un panel de un solo admin.
// Se pierden al reiniciar el servidor (obliga a un nuevo login), lo cual es
// aceptable para este caso de uso.
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
const sesiones = new Map(); // token -> { usuario, expira }

function crear(usuario) {
  const token = crypto.randomBytes(24).toString('hex');
  sesiones.set(token, { usuario, expira: Date.now() + TTL_MS });
  return token;
}

function validar(token) {
  const sesion = sesiones.get(token);
  if (!sesion) return null;
  if (sesion.expira < Date.now()) {
    sesiones.delete(token);
    return null;
  }
  return sesion.usuario;
}

function destruir(token) {
  sesiones.delete(token);
}

module.exports = { crear, validar, destruir };
