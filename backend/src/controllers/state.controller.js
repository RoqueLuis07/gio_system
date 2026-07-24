const storage = require('../services/storage.service');

module.exports = {
  get(req, res) {
    const db = storage.getState();
    res.json({
      usuario: { nombre: db.usuarioActivo.nombre },
      productos: db.productos,
      ventas: db.ventas,
      prospectos: db.prospectos,
      recordatorios: db.recordatorios,
      plantillas: db.plantillas,
      parametros: db.parametros,
    });
  },
};
