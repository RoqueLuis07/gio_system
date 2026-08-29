window.Views = window.Views || {};

// Reutiliza la vista de Productos, filtrada a solo los que tienen precio de oferta.
Views.ofertas = {
  render: (container) => Views.productos.render(container, { soloOfertas: true }),
};
