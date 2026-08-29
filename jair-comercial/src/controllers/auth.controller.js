const storage = require('../services/storage.service');
const session = require('../services/session.service');
const movimientos = require('../services/movimientos.service');

function sanitize(usuario) {
  const { pass, ...rest } = usuario;
  return rest;
}

module.exports = {
  async login(req, res) {
    try {
      const { usuario, pass } = req.body;
      const usuarios = await storage.getCollection('usuarios');
      const match = usuarios.find((u) => u.usuario === (usuario || '').trim().toLowerCase() && u.pass === pass);

      if (!match) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
      if (!match.activo) return res.status(403).json({ error: 'Este usuario está desactivado. Consultá con un administrador.' });

      const token = session.crear(sanitize(match));
      await movimientos.registrar({ usuarioId: match.id, usuarioNombre: match.nombre, tipo: 'inicio_sesion', detalle: '' });
      res.json({ token, usuario: sanitize(match) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async logout(req, res) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) session.destruir(token);
    res.status(204).end();
  },

  async me(req, res) {
    res.json({ usuario: req.usuario });
  },

  async cambiarClave(req, res) {
    try {
      const { passActual, passNueva } = req.body;
      const usuarios = await storage.getCollection('usuarios');
      const idx = usuarios.findIndex((u) => u.id === req.usuario.id);
      if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado.' });
      if (usuarios[idx].pass !== passActual) return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
      if (!passNueva || passNueva.trim().length < 4) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      }

      usuarios[idx] = { ...usuarios[idx], pass: passNueva.trim(), actualizadoEn: new Date().toISOString() };
      await storage.setCollection('usuarios', usuarios);
      res.status(204).end();
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
