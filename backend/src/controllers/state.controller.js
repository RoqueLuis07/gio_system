const storage = require('../services/storage.service');

module.exports = {
  async get(req, res) {
    try {
      const db = await storage.getState();
      res.json({
        productos: db.productos,
        ventas: db.ventas,
        prospectos: db.prospectos,
        recordatorios: db.recordatorios,
        plantillas: db.plantillas,
        parametros: db.parametros,
        archivos: db.archivos,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
