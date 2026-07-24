const storage = require('../services/storage.service');

module.exports = {
  get(req, res) {
    res.json(storage.getCollection('parametros'));
  },

  update(req, res) {
    const metodosPago = (req.body.metodosPago || []).map((s) => s.trim()).filter(Boolean);
    const cargos = (req.body.cargos || []).map((s) => s.trim()).filter(Boolean);

    if (metodosPago.length === 0 || cargos.length === 0) {
      return res.status(400).json({ error: 'Debes ingresar al menos un método de pago y un cargo.' });
    }

    const current = storage.getCollection('parametros');
    const next = { ...current, metodosPago, cargos };
    storage.setCollection('parametros', next);
    res.json(next);
  },
};
