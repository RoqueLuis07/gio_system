const { makeCrudController } = require('./crud.factory');

function buildProducto(body) {
  const nombre = (body.nombre || '').trim();
  const precio = Number(body.precio) || 0;
  if (!nombre || !precio) throw new Error('Completa los datos del diplomado.');

  return {
    nombre,
    precio,
    meta: parseInt(body.meta, 10) || 0,
    valor: parseFloat(body.valor) || 8.5,
  };
}

module.exports = makeCrudController('productos', buildProducto);
