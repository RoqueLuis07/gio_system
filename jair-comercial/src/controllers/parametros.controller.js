const storage = require('../services/storage.service');

function deepMerge(base, patch) {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) return patch ?? base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    out[key] = deepMerge(base?.[key], patch[key]);
  }
  return out;
}

module.exports = {
  async get(req, res) {
    try {
      res.json(await storage.getCollection('parametros'));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const actual = await storage.getCollection('parametros');
      const siguiente = deepMerge(actual, req.body);

      if (!siguiente?.contacto?.whatsapp || !String(siguiente.contacto.whatsapp).trim()) {
        return res.status(400).json({ error: 'El número de WhatsApp es obligatorio.' });
      }
      // Solo dígitos, con código de país (formato esperado por wa.me / api.whatsapp.com).
      siguiente.contacto.whatsapp = String(siguiente.contacto.whatsapp).replace(/\D/g, '');

      await storage.setCollection('parametros', siguiente);
      res.json(siguiente);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
