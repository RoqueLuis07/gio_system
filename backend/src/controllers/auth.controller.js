const storage = require('../services/storage.service');

function sanitize(usuario) {
  const { pass, ...rest } = usuario;
  return rest;
}

module.exports = {
  login(req, res) {
    const { usuario, pass } = req.body;
    const usuarios = storage.getCollection('usuarios');
    const match = usuarios.find((u) => u.nombre === usuario && u.pass === pass);

    if (!match) return res.status(401).json({ success: false, error: 'Usuario o Contraseña incorrectos.' });
    res.json({ success: true, usuario: sanitize(match) });
  },

  updateProfile(req, res) {
    const { id } = req.body;
    const nombre = (req.body.nombre || '').trim();
    const pass = (req.body.pass || '').trim();
    if (!id || !nombre || !pass) return res.status(400).json({ error: 'Completa todos los campos' });

    const usuarios = storage.getCollection('usuarios');
    const idx = usuarios.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado.' });

    usuarios[idx] = { ...usuarios[idx], nombre, pass };
    storage.setCollection('usuarios', usuarios);
    res.json(sanitize(usuarios[idx]));
  },
};
