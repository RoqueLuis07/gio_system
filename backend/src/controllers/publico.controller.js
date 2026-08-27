const storage = require('../services/storage.service');

module.exports = {
  async listarDiplomados(req, res) {
    try {
      const productos = await storage.getCollection('productos');
      const previewId = req.query.previewId || null;

      const publicar = (p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        precioOferta: p.precioOferta || null,
        fotoUrl: p.fotoUrl || null,
        docentes: p.docentes || '',
        descripcionPromo: p.descripcionPromo || '',
        brochurePdfUrl: p.brochurePdfUrl || null,
      });

      const publicados = productos.filter((p) => p.publicado && p.estado !== 'concluido').map(publicar);

      // Si se pide un preview de un diplomado puntual (desde el panel admin, antes
      // de publicarlo), se incluye igual aunque todavía no esté publicado.
      if (previewId && !publicados.some((p) => p.id === previewId)) {
        const previa = productos.find((p) => p.id === previewId);
        if (previa) publicados.push({ ...publicar(previa), preview: true });
      }

      res.json(publicados);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
