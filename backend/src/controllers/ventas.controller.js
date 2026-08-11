const storage = require('../services/storage.service');
const { uid } = require('../utils/id');

function calcularComision(monto, porcentaje, descuento) {
  const base = monto - monto * (descuento / 100);
  return base * (porcentaje / 100);
}

function buildVenta(body) {
  const productoId = body.productoId || '';
  const cliente = (body.cliente || '').trim();
  const monto = Number(body.monto) || 0;
  const porcentaje = parseFloat(body.porcentaje) || 8.5;
  const descuento = parseFloat(body.descuento) || 0;

  if (!productoId || !cliente || !monto) {
    throw new Error('Ingresa diplomado, cliente y monto.');
  }

  return {
    productoId,
    cliente,
    telefono: body.telefono || '',
    ci: (body.ci || '').trim(),
    empresa: body.empresa || '',
    cargo: body.cargo || '',
    metodoPago: body.metodoPago || '',
    fecha: body.fecha || new Date().toISOString().slice(0, 10),
    monto,
    porcentaje,
    descuento,
    comision: calcularComision(monto, porcentaje, descuento),
    cobrado: !!body.cobrado,
  };
}

// Parses lines like "Nombre, Telefono, Empresa, Monto, CI, Descuento" into venta entries.
function parseCsvLine(line, productoId, defaultMonto) {
  const cols = line.split(',').map((s) => s.trim());
  const [nombre, telefono, empresa, montoRaw, ci, descuentoRaw] = cols;
  if (!nombre) return null;

  const monto = Number(String(montoRaw || '').replace(/\D/g, '')) || defaultMonto || 0;
  const porcentaje = 8.5;
  const descuento = parseFloat(descuentoRaw) || 0;

  return {
    productoId,
    cliente: nombre,
    telefono: telefono || '',
    ci: (ci || '').trim(),
    empresa: empresa || 'Particular',
    cargo: '',
    metodoPago: '',
    fecha: new Date().toISOString().slice(0, 10),
    monto,
    porcentaje,
    descuento,
    comision: calcularComision(monto, porcentaje, descuento),
  };
}

module.exports = {
  async list(req, res) {
    try {
      res.json(await storage.getCollection('ventas'));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const venta = { id: uid(), ...buildVenta(req.body) };
      const ventas = await storage.getCollection('ventas');
      ventas.push(venta);
      await storage.setCollection('ventas', ventas);
      res.status(201).json(venta);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const ventas = await storage.getCollection('ventas');
      const idx = ventas.findIndex((v) => v.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

      const patch = buildVenta({ ...ventas[idx], ...req.body });
      ventas[idx] = { ...ventas[idx], ...patch };
      await storage.setCollection('ventas', ventas);
      res.json(ventas[idx]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const ventas = await storage.getCollection('ventas');
      const next = ventas.filter((v) => v.id !== req.params.id);
      if (next.length === ventas.length) return res.status(404).json({ error: 'No encontrado' });
      await storage.setCollection('ventas', next);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async bulkCreate(req, res) {
    try {
      const { productoId, defaultMonto, texto } = req.body;
      if (!productoId) return res.status(400).json({ error: 'Selecciona un diplomado para la carga.' });
      if (!texto || !texto.trim()) return res.status(400).json({ error: 'Pega la lista de alumnos a cargar.' });

      const lines = texto.split('\n').map((l) => l.trim()).filter(Boolean);
      const nuevas = lines
        .map((line) => parseCsvLine(line, productoId, Number(defaultMonto) || 0))
        .filter(Boolean)
        .map((entry) => ({ id: uid(), ...entry }));

      if (nuevas.length === 0) return res.status(400).json({ error: 'No se encontraron alumnos válidos en el texto.' });

      const ventas = await storage.getCollection('ventas');
      ventas.push(...nuevas);
      await storage.setCollection('ventas', ventas);
      res.status(201).json(nuevas);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
