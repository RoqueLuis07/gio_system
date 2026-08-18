const storage = require('../services/storage.service');
const { uid } = require('../utils/id');

const CATEGORIAS = ['flyer', 'documento', 'foto'];
const MAX_BYTES = 10 * 1024 * 1024;

module.exports = {
  async list(req, res) {
    try {
      res.json(await storage.listArchivos());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Selecciona un archivo para subir.' });
      if (req.file.size > MAX_BYTES) return res.status(400).json({ error: 'El archivo supera el máximo de 10MB.' });

      const categoria = CATEGORIAS.includes(req.body.categoria) ? req.body.categoria : 'documento';
      const archivo = await storage.insertArchivo({
        id: uid(),
        nombre: req.file.originalname,
        categoria,
        tipo: req.file.mimetype,
        buffer: req.file.buffer,
      });
      res.status(201).json(archivo);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async rename(req, res) {
    try {
      const nombre = (req.body.nombre || '').trim();
      if (!nombre) return res.status(400).json({ error: 'Ingresa un nombre válido.' });

      const archivo = await storage.renameArchivo(req.params.id, nombre);
      if (!archivo) return res.status(404).json({ error: 'No encontrado' });
      res.json(archivo);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const removed = await storage.removeArchivo(req.params.id);
      if (!removed) return res.status(404).json({ error: 'No encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
