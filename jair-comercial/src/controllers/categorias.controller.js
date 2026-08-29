const storage = require('../services/storage.service');
const { uid } = require('../utils/id');
const { slugUnico } = require('../utils/slug');

function buildCategoria(body) {
  const nombre = (body.nombre || '').trim();
  if (!nombre) throw new Error('El nombre de la categoría es obligatorio.');

  return {
    nombre,
    icono: (body.icono || '📦').trim(),
    orden: Number.isFinite(Number(body.orden)) ? Number(body.orden) : 0,
  };
}

module.exports = {
  async list(req, res) {
    try {
      res.json(await storage.getCollection('categorias'));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const entidad = buildCategoria(req.body);
      const categorias = await storage.getCollection('categorias');
      const ahora = new Date().toISOString();

      const nueva = { id: uid(), slug: slugUnico(entidad.nombre, categorias), creadoEn: ahora, actualizadoEn: ahora, ...entidad };
      categorias.push(nueva);
      await storage.setCollection('categorias', categorias);
      res.status(201).json(nueva);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const categorias = await storage.getCollection('categorias');
      const idx = categorias.findIndex((c) => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

      const patch = buildCategoria({ ...categorias[idx], ...req.body });
      // Si cambia el nombre, se regenera el slug (manteniendo unicidad); si no, se conserva el link existente.
      const slug = patch.nombre !== categorias[idx].nombre ? slugUnico(patch.nombre, categorias, req.params.id) : categorias[idx].slug;

      categorias[idx] = { ...categorias[idx], ...patch, slug, actualizadoEn: new Date().toISOString() };
      await storage.setCollection('categorias', categorias);
      res.json(categorias[idx]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const categorias = await storage.getCollection('categorias');
      const next = categorias.filter((c) => c.id !== req.params.id);
      if (next.length === categorias.length) return res.status(404).json({ error: 'No encontrado' });
      await storage.setCollection('categorias', next);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
