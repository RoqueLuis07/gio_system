const storage = require('../services/storage.service');
const { uid } = require('../utils/id');

/**
 * Generic CRUD controller factory for simple id-based collections.
 * `buildEntity` maps a raw request body into the stored shape (and validates it),
 * throwing an Error with a user-facing message on invalid input.
 */
function makeCrudController(collectionName, buildEntity) {
  return {
    list(req, res) {
      res.json(storage.getCollection(collectionName));
    },

    create(req, res) {
      try {
        const entity = { id: uid(), ...buildEntity(req.body) };
        const items = storage.getCollection(collectionName);
        items.push(entity);
        storage.setCollection(collectionName, items);
        res.status(201).json(entity);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    update(req, res) {
      const items = storage.getCollection(collectionName);
      const idx = items.findIndex((x) => x.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

      try {
        const patch = buildEntity({ ...items[idx], ...req.body }, true);
        items[idx] = { ...items[idx], ...patch };
        storage.setCollection(collectionName, items);
        res.json(items[idx]);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    },

    remove(req, res) {
      const items = storage.getCollection(collectionName);
      const next = items.filter((x) => x.id !== req.params.id);
      if (next.length === items.length) return res.status(404).json({ error: 'No encontrado' });
      storage.setCollection(collectionName, next);
      res.status(204).end();
    },
  };
}

module.exports = { makeCrudController };
