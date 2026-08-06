const storage = require('../services/storage.service');
const { uid } = require('../utils/id');

/**
 * Generic CRUD controller factory for simple id-based collections.
 * `buildEntity` maps a raw request body into the stored shape (and validates it),
 * throwing an Error with a user-facing message on invalid input.
 */
function makeCrudController(collectionName, buildEntity) {
  return {
    async list(req, res) {
      try {
        res.json(await storage.getCollection(collectionName));
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },

    async create(req, res) {
      try {
        const entity = { id: uid(), ...buildEntity(req.body) };
        const items = await storage.getCollection(collectionName);
        items.push(entity);
        await storage.setCollection(collectionName, items);
        res.status(201).json(entity);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async update(req, res) {
      try {
        const items = await storage.getCollection(collectionName);
        const idx = items.findIndex((x) => x.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

        const patch = buildEntity({ ...items[idx], ...req.body }, true);
        items[idx] = { ...items[idx], ...patch };
        await storage.setCollection(collectionName, items);
        res.json(items[idx]);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    async remove(req, res) {
      try {
        const items = await storage.getCollection(collectionName);
        const next = items.filter((x) => x.id !== req.params.id);
        if (next.length === items.length) return res.status(404).json({ error: 'No encontrado' });
        await storage.setCollection(collectionName, next);
        res.status(204).end();
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
}

module.exports = { makeCrudController };
