// Estado inicial de cada "colección". Compartido por los dos backends de
// almacenamiento (archivo local en JSON y Postgres) para que ambos arranquen
// con la misma forma de datos.
module.exports = {
  usuarios: [],
  categorias: [],
  productos: [],
  ventas: [],
  gastos: [],
  movimientos: [],
  parametros: {
    empresa: {
      nombre: 'Jair Comercial',
      eslogan: 'Electrodomésticos, vehículos a batería y juguetes premium',
      descripcion:
        'En Jair Comercial encontrás electrodomésticos, autos y motos a batería para niños, juguetes de primera calidad y mucho más. Variedad, calidad y atención directa por WhatsApp.',
      logoUrl: null,
    },
    contacto: {
      whatsapp: '595981000000',
      telefono: '',
      email: '',
      direccion: '',
      horario: 'Lunes a sábado, 8:00 - 18:00',
    },
    redes: { facebook: '', instagram: '', tiktok: '' },
    mensajeWhatsapp: 'Hola, quiero más información sobre {producto}.',
    banner: {
      titulo: 'Todo lo que buscás, en un solo lugar',
      subtitulo: 'Electrodomésticos, autos a batería y juguetes premium — variedad y calidad garantizada.',
      imagenUrl: null,
      textoBoton: 'Ver catálogo',
    },
    tema: { colorPrimario: '#0ea5e9', colorSecundario: '#f97316' },
    catalogo: { productosPorCategoriaHome: 10 },
    metodosPago: ['Efectivo', 'Transferencia bancaria', 'Tarjeta de crédito', 'Tarjeta de débito'],
  },
};
