const session = require('../services/session.service');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const usuario = token ? session.validar(token) : null;

  if (!usuario) return res.status(401).json({ error: 'Sesión inválida o expirada. Iniciá sesión de nuevo.' });

  req.usuario = usuario;
  next();
};
