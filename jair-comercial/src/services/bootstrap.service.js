const storage = require('./storage.service');
const { uid } = require('../utils/id');
const { slugUnico } = require('../utils/slug');
const { PERMISOS_VALIDOS } = require('../controllers/usuarios.controller');

// Imagen de relleno para los productos de demostración: un SVG con gradiente +
// emoji, embebido como data URI (no depende de ningún archivo ni de internet).
function placeholder(emoji, from, to) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#g)"/>
    <text x="300" y="330" font-size="220" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

const CATEGORIAS_DEMO = [
  { nombre: 'Electrodomésticos', icono: '🔌', orden: 1 },
  { nombre: 'Autos a Batería', icono: '🚙', orden: 2 },
  { nombre: 'Juguetes', icono: '🧸', orden: 3 },
  { nombre: 'Bebés', icono: '🍼', orden: 4 },
];

function productosDemo(catId) {
  return [
    {
      nombre: 'Smart TV 55" 4K UHD',
      precio: 3890000,
      precioOferta: 3390000,
      categoriaId: catId('Electrodomésticos'),
      descripcion:
        '<p>Smart TV de <strong>55 pulgadas</strong> con resolución 4K UHD, sistema operativo con apps integradas y control remoto por voz.</p><ul><li>HDR10 para mayor contraste</li><li>3x HDMI, 2x USB</li><li>Garantía de fábrica</li></ul>',
      imagenes: [placeholder('📺', '#0ea5e9', '#22d3ee')],
      destacado: true,
      publicado: true,
    },
    {
      nombre: 'Heladera No Frost 300L',
      precio: 4590000,
      categoriaId: catId('Electrodomésticos'),
      descripcion:
        '<p>Heladera <strong>No Frost</strong> de 300 litros, bajo consumo energético y freezer independiente. Ideal para toda la familia.</p>',
      imagenes: [placeholder('🧊', '#38bdf8', '#0ea5e9')],
      destacado: false,
      publicado: true,
    },
    {
      nombre: 'Aire Acondicionado Split 12000 BTU',
      precio: 2990000,
      precioOferta: 2590000,
      categoriaId: catId('Electrodomésticos'),
      descripcion: '<p>Split frío/calor de <strong>12000 BTU</strong>, tecnología inverter de bajo consumo, control remoto incluido.</p>',
      imagenes: [placeholder('❄️', '#0284c7', '#38bdf8')],
      destacado: true,
      publicado: true,
    },
    {
      nombre: 'Auto a Batería 4x4 Todo Terreno',
      precio: 1690000,
      precioOferta: 1390000,
      categoriaId: catId('Autos a Batería'),
      descripcion:
        '<p>Auto a batería todo terreno con control remoto para los padres, luces y sonido. Batería recargable incluida.</p><ul><li>Vel. regulable en 2 marchas</li><li>Suspensión independiente</li><li>Entrada USB / MP3</li></ul>',
      imagenes: [placeholder('🚙', '#ef4444', '#f87171')],
      destacado: true,
      publicado: true,
    },
    {
      nombre: 'Moto a Batería tipo Vespa',
      precio: 990000,
      categoriaId: catId('Autos a Batería'),
      descripcion: '<p>Moto eléctrica infantil estilo Vespa, con luces, bocina y arranque suave. Para chicos de 2 a 5 años.</p>',
      imagenes: [placeholder('🛵', '#f97316', '#fb923c')],
      destacado: false,
      publicado: true,
    },
    {
      nombre: 'Cuatriciclo a Batería UTV',
      precio: 1890000,
      categoriaId: catId('Autos a Batería'),
      descripcion: '<p>Cuatriciclo a batería con control remoto parental, doble asiento y cinturón de seguridad.</p>',
      imagenes: [placeholder('🏎️', '#a855f7', '#ec4899')],
      destacado: false,
      publicado: true,
    },
    {
      nombre: 'Set de Bloques de Construcción Premium (500 pzs)',
      precio: 450000,
      categoriaId: catId('Juguetes'),
      descripcion: '<p>Set de bloques compatibles, 500 piezas, para estimular la creatividad. Incluye maletín de almacenamiento.</p>',
      imagenes: [placeholder('🧱', '#eab308', '#facc15')],
      destacado: false,
      publicado: true,
    },
    {
      nombre: 'Cocina de Juguete de Madera con Luces y Sonido',
      precio: 850000,
      precioOferta: 690000,
      categoriaId: catId('Juguetes'),
      descripcion: '<p>Cocina de juguete de madera maciza, con efectos de luz y sonido realistas. Fabricación premium.</p>',
      imagenes: [placeholder('🍳', '#22c55e', '#4ade80')],
      destacado: true,
      publicado: true,
    },
    {
      nombre: 'Corral Pelotero + 50 Pelotitas',
      precio: 350000,
      categoriaId: catId('Bebés'),
      descripcion: '<p>Corral pelotero plegable con 50 pelotitas de regalo. Espacio seguro y divertido para los más chicos.</p>',
      imagenes: [placeholder('🎈', '#22c55e', '#4ade80')],
      destacado: false,
      publicado: true,
    },
  ];
}

async function ensureAdmin() {
  const usuarioEnv = (process.env.ADMIN_USER || 'admin').trim().toLowerCase();
  const passEnv = (process.env.ADMIN_PASS || 'jair2026').trim();

  if (!process.env.ADMIN_PASS) {
    console.warn(
      '[jair-comercial] ADMIN_PASS no está definida: se usó una contraseña por defecto insegura. Definila en el .env para producción.'
    );
  }

  const usuarios = await storage.getCollection('usuarios');
  const idx = usuarios.findIndex((u) => u.usuario === usuarioEnv);
  const ahora = new Date().toISOString();

  if (idx === -1) {
    usuarios.push({
      id: uid(),
      nombre: 'Administrador',
      usuario: usuarioEnv,
      pass: passEnv,
      rol: 'admin',
      permisos: PERMISOS_VALIDOS,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
    await storage.setCollection('usuarios', usuarios);
  }

  // Primer arranque: sembramos categorías y productos de demostración para
  // que el catálogo no se vea vacío. Si ya hay datos, no se toca nada.
  let categorias = await storage.getCollection('categorias');
  if (categorias.length === 0) {
    categorias = CATEGORIAS_DEMO.map((c) => ({ id: uid(), slug: slugUnico(c.nombre, []), ...c }));
    await storage.setCollection('categorias', categorias);

    const catId = (nombre) => categorias.find((c) => c.nombre === nombre)?.id || null;
    const productosActuales = await storage.getCollection('productos');
    if (productosActuales.length === 0) {
      const productos = productosDemo(catId).map((p) => ({
        id: uid(),
        creadoEn: ahora,
        actualizadoEn: ahora,
        ...p,
      }));
      await storage.setCollection('productos', productos);
    }
  } else if (categorias.some((c) => !c.slug)) {
    // Migración liviana: categorías creadas antes de tener slug (link propio) lo reciben acá.
    for (const c of categorias) {
      if (!c.slug) c.slug = slugUnico(c.nombre, categorias, c.id);
    }
    await storage.setCollection('categorias', categorias);
  }
}

module.exports = { ensureAdmin };
