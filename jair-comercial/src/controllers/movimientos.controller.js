const storage = require('../services/storage.service');

function esGestor(usuario) {
  return usuario.rol === 'admin' || (usuario.permisos || []).includes('usuarios') || (usuario.permisos || []).includes('ventas');
}

module.exports = {
  async list(req, res) {
    try {
      let movimientos = await storage.getCollection('movimientos');

      if (!esGestor(req.usuario)) {
        movimientos = movimientos.filter((m) => m.usuarioId === req.usuario.id);
      } else if (req.query.usuarioId) {
        movimientos = movimientos.filter((m) => m.usuarioId === req.query.usuarioId);
      }

      movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      res.json(movimientos.slice(0, 300));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
