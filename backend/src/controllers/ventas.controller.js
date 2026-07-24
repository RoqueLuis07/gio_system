const storage = require('../services/storage.service');
const { uid } = require('../utils/id');

function buildVenta(body) {
  const productoId = body.productoId || '';
  const cliente = (body.cliente || '').trim();
  const monto = Number(body.monto) || 0;
  const porcentaje = parseFloat(body.porcentaje) || 8.5;

  if (!productoId || !cliente || !monto) {
    throw new Error('Ingresa diplomado, cliente y monto.');
  }

  return {
    productoId,
    cliente,
    telefono: body.telefono || '',
    empresa: body.empresa || '',
    cargo: body.cargo || '',
    metodoPago: body.metodoPago || '',
    fecha: body.fecha || new Date().toISOString().slice(0, 10),
    monto,
    porcentaje,
    comision: monto * (porcentaje / 100),
  };
}

// Parses lines like "Nombre, Telefono, Empresa, Monto" into venta entries.
function parseCsvLine(line, productoId, defaultMonto) {
  const cols = line.split(',').map((s) => s.trim());
  const [nombre, telefono, empresa, montoRaw] = cols;
  if (!nombre) return null;

  const monto = Number(String(montoRaw || '').replace(/\D/g, '')) || defaultMonto || 0;

  return {
    productoId,
    cliente: nombre,
    telefono: telefono || '',
    empresa: empresa || 'Particular',
    cargo: '',
    metodoPago: '',
    fecha: new Date().toISOString().slice(0, 10),
    monto,
    porcentaje: 8.5,
    comision: monto * 0.085,
  };
}

module.exports = {
  list(req, res) {
    res.json(storage.getCollection('ventas'));
  },

  create(req, res) {
    try {
      const venta = { id: uid(), ...buildVenta(req.body) };
      const ventas = storage.getCollection('ventas');
      ventas.push(venta);
      storage.setCollection('ventas', ventas);
      res.status(201).json(venta);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  update(req, res) {
    const ventas = storage.getCollection('ventas');
    const idx = ventas.findIndex((v) => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

    try {
      const patch = buildVenta({ ...ventas[idx], ...req.body });
      ventas[idx] = { ...ventas[idx], ...patch };
      storage.setCollection('ventas', ventas);
      res.json(ventas[idx]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  remove(req, res) {
    const ventas = storage.getCollection('ventas');
    const next = ventas.filter((v) => v.id !== req.params.id);
    if (next.length === ventas.length) return res.status(404).json({ error: 'No encontrado' });
    storage.setCollection('ventas', next);
    res.status(204).end();
  },

  bulkCreate(req, res) {
    const { productoId, defaultMonto, texto } = req.body;
    if (!productoId) return res.status(400).json({ error: 'Selecciona un diplomado para la carga.' });
    if (!texto || !texto.trim()) return res.status(400).json({ error: 'Pega la lista de alumnos a cargar.' });

    const lines = texto.split('\n').map((l) => l.trim()).filter(Boolean);
    const nuevas = lines
      .map((line) => parseCsvLine(line, productoId, Number(defaultMonto) || 0))
      .filter(Boolean)
      .map((entry) => ({ id: uid(), ...entry }));

    if (nuevas.length === 0) return res.status(400).json({ error: 'No se encontraron alumnos válidos en el texto.' });

    const ventas = storage.getCollection('ventas');
    ventas.push(...nuevas);
    storage.setCollection('ventas', ventas);
    res.status(201).json(nuevas);
  },
};
