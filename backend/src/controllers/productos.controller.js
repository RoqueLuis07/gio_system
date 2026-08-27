const sanitizeHtml = require('sanitize-html');
const { makeCrudController } = require('./crud.factory');
const storage = require('../services/storage.service');

const ESTADOS = ['activo', 'concluido'];

// Los campos de texto enriquecido (editor con negrita/listas/links) se guardan como
// HTML: se sanitizan acá para no permitir <script>, atributos de evento, etc.
function sanitizeRico(html) {
  return sanitizeHtml((html || '').trim(), {
    allowedTags: ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'br', 'p', 'div', 'span'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
  });
}

function buildProducto(body) {
  const nombre = (body.nombre || '').trim();
  const precio = Number(body.precio) || 0;
  if (!nombre || !precio) throw new Error('Completa los datos del diplomado.');

  const precioOferta = Number(body.precioOferta) || null;

  return {
    nombre,
    precio,
    meta: parseInt(body.meta, 10) || 0,
    valor: parseFloat(body.valor) || 8.5,
    estado: ESTADOS.includes(body.estado) ? body.estado : 'activo',
    fotoUrl: body.fotoUrl || null,
    docentes: (body.docentes || '').trim(),
    descripcionPromo: sanitizeRico(body.descripcionPromo),
    brochurePdfUrl: body.brochurePdfUrl || null,
    precioOferta: precioOferta && precioOferta < precio ? precioOferta : null,
    publicado: !!body.publicado,
  };
}

const controller = makeCrudController('productos', buildProducto);

controller.uploadFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen.' });

    const productos = await storage.getCollection('productos');
    const idx = productos.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Diplomado no encontrado.' });

    const fotoUrl = await storage.subirFotoDiplomado({ productoId: req.params.id, buffer: req.file.buffer, tipo: req.file.mimetype });
    productos[idx] = { ...productos[idx], fotoUrl };
    await storage.setCollection('productos', productos);
    res.json(productos[idx]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

controller.uploadBrochure = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Selecciona un archivo PDF.' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'El broshure debe ser un archivo PDF.' });

    const productos = await storage.getCollection('productos');
    const idx = productos.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Diplomado no encontrado.' });

    const brochurePdfUrl = await storage.subirBrochureDiplomado({ productoId: req.params.id, buffer: req.file.buffer, tipo: req.file.mimetype });
    productos[idx] = { ...productos[idx], brochurePdfUrl };
    await storage.setCollection('productos', productos);
    res.json(productos[idx]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = controller;
