const storage = require('../services/storage.service');
const { uid } = require('../utils/id');

const ROLES = ['superadmin', 'vendedor'];

function sanitize(usuario) {
  const { pass, ...rest } = usuario;
  return rest;
}

function countSuperadmins(usuarios) {
  return usuarios.filter((u) => u.rol === 'superadmin').length;
}

module.exports = {
  list(req, res) {
    res.json(storage.getCollection('usuarios').map(sanitize));
  },

  create(req, res) {
    const nombre = (req.body.nombre || '').trim();
    const pass = (req.body.pass || '').trim();
    const rol = ROLES.includes(req.body.rol) ? req.body.rol : 'vendedor';

    if (!nombre || !pass) return res.status(400).json({ error: 'Ingresa nombre de usuario y contraseña.' });

    const usuarios = storage.getCollection('usuarios');
    if (usuarios.some((u) => u.nombre.toLowerCase() === nombre.toLowerCase())) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese nombre.' });
    }

    const usuario = { id: uid(), nombre, pass, rol };
    usuarios.push(usuario);
    storage.setCollection('usuarios', usuarios);
    res.status(201).json(sanitize(usuario));
  },

  update(req, res) {
    const usuarios = storage.getCollection('usuarios');
    const idx = usuarios.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

    const actual = usuarios[idx];
    const nombre = (req.body.nombre || '').trim() || actual.nombre;
    const pass = (req.body.pass || '').trim() || actual.pass;
    const rol = ROLES.includes(req.body.rol) ? req.body.rol : actual.rol;

    if (actual.rol === 'superadmin' && rol !== 'superadmin' && countSuperadmins(usuarios) <= 1) {
      return res.status(400).json({ error: 'Debe existir al menos un superadministrador.' });
    }
    if (nombre.toLowerCase() !== actual.nombre.toLowerCase() &&
        usuarios.some((u) => u.id !== actual.id && u.nombre.toLowerCase() === nombre.toLowerCase())) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese nombre.' });
    }

    usuarios[idx] = { ...actual, nombre, pass, rol };
    storage.setCollection('usuarios', usuarios);
    res.json(sanitize(usuarios[idx]));
  },

  remove(req, res) {
    const usuarios = storage.getCollection('usuarios');
    const target = usuarios.find((u) => u.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'No encontrado' });

    if (target.rol === 'superadmin' && countSuperadmins(usuarios) <= 1) {
      return res.status(400).json({ error: 'Debe existir al menos un superadministrador.' });
    }

    storage.setCollection('usuarios', usuarios.filter((u) => u.id !== req.params.id));
    res.status(204).end();
  },
};
