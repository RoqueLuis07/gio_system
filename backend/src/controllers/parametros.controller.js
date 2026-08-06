const storage = require('../services/storage.service');

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
      const metodosPago = (req.body.metodosPago || []).map((s) => s.trim()).filter(Boolean);
      const cargos = (req.body.cargos || []).map((s) => s.trim()).filter(Boolean);

      if (metodosPago.length === 0 || cargos.length === 0) {
        return res.status(400).json({ error: 'Debes ingresar al menos un método de pago y un cargo.' });
      }

      const current = await storage.getCollection('parametros');
      const next = { ...current, metodosPago, cargos };
      await storage.setCollection('parametros', next);
      res.json(next);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
