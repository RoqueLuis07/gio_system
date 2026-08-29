const storage = require('../services/storage.service');

module.exports = {
  // Un solo endpoint que devuelve todo lo que necesita el sitio público:
  // productos publicados, categorías y parámetros (marca, WhatsApp, banner...).
  async catalogo(req, res) {
    try {
      const [productos, categorias, parametros] = await Promise.all([
        storage.getCollection('productos'),
        storage.getCollection('categorias'),
        storage.getCollection('parametros'),
      ]);

      const previewId = req.query.previewId || null;

      const publicables = productos.filter((p) => p.publicado);
      if (previewId && !publicables.some((p) => p.id === previewId)) {
        const previa = productos.find((p) => p.id === previewId);
        if (previa) publicables.push({ ...previa, preview: true });
      }

      const ordenados = publicables.sort((a, b) => (a.orden || 0) - (b.orden || 0));

      res.json({
        productos: ordenados,
        categorias: categorias.sort((a, b) => (a.orden || 0) - (b.orden || 0)),
        parametros,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
