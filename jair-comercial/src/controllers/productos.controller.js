const sanitizeHtml = require('sanitize-html');
const { makeCrudController } = require('./crud.factory');
const storage = require('../services/storage.service');
const { uid } = require('../utils/id');

// La descripción se edita con un mini editor enriquecido (negrita/listas/links);
// se sanitiza acá para no permitir <script> ni atributos de evento.
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
  if (!nombre) throw new Error('El nombre del producto es obligatorio.');
  if (!precio || precio <= 0) throw new Error('Ingresá un precio válido.');

  const precioOferta = Number(body.precioOferta) || null;
  const precioCosto = Number(body.precioCosto) > 0 ? Number(body.precioCosto) : null;
  const imagenes = Array.isArray(body.imagenes) ? body.imagenes.filter(Boolean) : [];

  // stock: null/vacío = sin control de stock (ilimitado). Si viene un número, se controla.
  let stock = null;
  if (body.stock !== '' && body.stock !== null && body.stock !== undefined) {
    const n = Number(body.stock);
    stock = Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  }

  return {
    nombre,
    precio,
    precioOferta: precioOferta && precioOferta > 0 && precioOferta < precio ? precioOferta : null,
    precioCosto,
    categoriaId: body.categoriaId || null,
    descripcion: sanitizeRico(body.descripcion),
    imagenes,
    stock,
    destacado: !!body.destacado,
    disponible: body.disponible !== undefined ? !!body.disponible : true,
    publicado: !!body.publicado,
    orden: Number.isFinite(Number(body.orden)) ? Number(body.orden) : 0,
  };
}

const controller = makeCrudController('productos', buildProducto);

// Catálogo interno para cargar ventas: cualquier usuario autenticado (incluidos
// los vendedores, que no tienen permiso 'productos') necesita ver precio público,
// stock y precio de costo para poder registrar una venta con su margen real.
controller.paraVenta = async (req, res) => {
  try {
    const productos = await storage.getCollection('productos');
    const disponibles = productos
      .filter((p) => p.publicado && p.disponible !== false)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        precioOferta: p.precioOferta || null,
        precioCosto: p.precioCosto || null,
        stock: p.stock === undefined ? null : p.stock,
        categoriaId: p.categoriaId || null,
      }));
    res.json(disponibles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

controller.uploadImagen = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Seleccioná una imagen.' });
    res.json({ url: '/uploads/' + req.file.filename });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

controller.duplicar = async (req, res) => {
  try {
    const productos = await storage.getCollection('productos');
    const original = productos.find((p) => p.id === req.params.id);
    if (!original) return res.status(404).json({ error: 'No encontrado' });

    const ahora = new Date().toISOString();
    const copia = {
      ...original,
      id: uid(),
      nombre: original.nombre + ' (copia)',
      publicado: false,
      creadoEn: ahora,
      actualizadoEn: ahora,
    };
    productos.push(copia);
    await storage.setCollection('productos', productos);
    res.status(201).json(copia);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = controller;
