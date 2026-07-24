const storage = require('../services/storage.service');

function publicUser(usuario) {
  return { nombre: usuario.nombre };
}

module.exports = {
  login(req, res) {
    const { usuario, pass } = req.body;
    const db = storage.getState();

    if (usuario === db.usuarioActivo.nombre && pass === db.usuarioActivo.pass) {
      return res.json({ success: true, usuario: publicUser(db.usuarioActivo) });
    }
    res.status(401).json({ success: false, error: 'Usuario o Contraseña incorrectos.' });
  },

  me(req, res) {
    const db = storage.getState();
    res.json(publicUser(db.usuarioActivo));
  },

  updateProfile(req, res) {
    const nombre = (req.body.nombre || '').trim();
    const pass = (req.body.pass || '').trim();
    if (!nombre || !pass) return res.status(400).json({ error: 'Completa todos los campos' });

    const usuarioActivo = { nombre, pass };
    storage.setCollection('usuarioActivo', usuarioActivo);
    res.json(publicUser(usuarioActivo));
  },
};
