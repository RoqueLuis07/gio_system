const storage = require('../services/storage.service');
const { uid } = require('../utils/id');
const movimientos = require('../services/movimientos.service');

function esGestor(usuario) {
  return usuario.rol === 'admin' || (usuario.permisos || []).includes('ventas');
}

module.exports = {
  async list(req, res) {
    try {
      let ventas = await storage.getCollection('ventas');

      if (!esGestor(req.usuario)) {
        ventas = ventas.filter((v) => v.vendedorId === req.usuario.id);
      } else if (req.query.vendedorId) {
        ventas = ventas.filter((v) => v.vendedorId === req.query.vendedorId);
      }
      if (req.query.estado) ventas = ventas.filter((v) => v.estado === req.query.estado);

      ventas.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
      res.json(ventas);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const cantidad = Math.max(1, Math.round(Number(req.body.cantidad) || 0));
      if (!cantidad) throw new Error('Ingresá una cantidad válida.');

      const formaPago = (req.body.formaPago || '').trim();
      if (!formaPago) throw new Error('Seleccioná una forma de pago.');

      const precioVenta = Number(req.body.precioVenta);
      if (!precioVenta || precioVenta <= 0) throw new Error('Ingresá el precio al que vendiste el producto.');

      const productos = await storage.getCollection('productos');
      const producto = productos.find((p) => p.id === req.body.productoId);
      if (!producto) throw new Error('Seleccioná un producto válido.');

      if (producto.stock !== null && producto.stock !== undefined && cantidad > producto.stock) {
        throw new Error('Stock insuficiente. Disponible: ' + producto.stock + '.');
      }

      const cliente = {
        nombre: (req.body.cliente?.nombre || '').trim(),
        telefono: (req.body.cliente?.telefono || '').trim(),
        ciudad: (req.body.cliente?.ciudad || '').trim(),
        direccion: (req.body.cliente?.direccion || '').trim(),
      };
      if (!cliente.nombre) throw new Error('Ingresá el nombre de quien recibe el pedido.');
      if (!cliente.telefono) throw new Error('Ingresá un teléfono de contacto del cliente.');

      const total = precioVenta * cantidad;
      const precioCosto = Number.isFinite(producto.precioCosto) ? producto.precioCosto : 0;
      const costoTotal = precioCosto * cantidad;
      const margen = total - costoTotal;
      // La ganancia del vendedor es directamente lo que suma por encima del costo
      // (sin ningún porcentaje aplicado): vende a 550.000 algo que cuesta 500.000 -> gana 50.000.
      const comisionMonto = Math.max(0, margen);

      const ahora = new Date().toISOString();
      const venta = {
        id: uid(),
        vendedorId: req.usuario.id,
        vendedorNombre: req.usuario.nombre,
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad,
        precioVenta,
        precioCosto,
        total,
        margen,
        formaPago,
        cliente,
        delivery: { nombre: null, asignadoPor: null, asignadoEn: null },
        comisionMonto,
        estado: 'pendiente',
        motivoRechazo: null,
        creadoEn: ahora,
        actualizadoEn: ahora,
        aprobadoEn: null,
        aprobadoPor: null,
      };

      const ventas = await storage.getCollection('ventas');
      ventas.push(venta);
      await storage.setCollection('ventas', ventas);

      await movimientos.registrar({
        usuarioId: req.usuario.id,
        usuarioNombre: req.usuario.nombre,
        tipo: 'venta_creada',
        detalle: producto.nombre + ' × ' + cantidad + ' — ' + venta.total.toLocaleString('es-PY'),
      });

      res.status(201).json(venta);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async asignarDelivery(req, res) {
    try {
      if (!esGestor(req.usuario)) return res.status(403).json({ error: 'No tenés permiso para asignar el delivery.' });

      const nombre = (req.body.nombre || '').trim();
      if (!nombre) throw new Error('Ingresá el nombre de la persona o empresa de delivery.');

      const ventas = await storage.getCollection('ventas');
      const idx = ventas.findIndex((v) => v.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Venta no encontrada.' });

      ventas[idx] = {
        ...ventas[idx],
        delivery: { nombre, asignadoPor: req.usuario.nombre, asignadoEn: new Date().toISOString() },
        actualizadoEn: new Date().toISOString(),
      };
      await storage.setCollection('ventas', ventas);
      res.json(ventas[idx]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async aprobar(req, res) {
    try {
      if (!esGestor(req.usuario)) return res.status(403).json({ error: 'No tenés permiso para aprobar ventas.' });

      const ventas = await storage.getCollection('ventas');
      const idx = ventas.findIndex((v) => v.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Venta no encontrada.' });
      if (ventas[idx].estado !== 'pendiente') return res.status(400).json({ error: 'Esta venta ya fue procesada.' });

      const productos = await storage.getCollection('productos');
      const pIdx = productos.findIndex((p) => p.id === ventas[idx].productoId);
      if (pIdx !== -1 && productos[pIdx].stock !== null && productos[pIdx].stock !== undefined) {
        if (productos[pIdx].stock < ventas[idx].cantidad) {
          return res.status(400).json({ error: 'Stock insuficiente para aprobar (disponible: ' + productos[pIdx].stock + ').' });
        }
        productos[pIdx] = { ...productos[pIdx], stock: productos[pIdx].stock - ventas[idx].cantidad, actualizadoEn: new Date().toISOString() };
        await storage.setCollection('productos', productos);
      }

      ventas[idx] = {
        ...ventas[idx],
        estado: 'aprobada',
        aprobadoEn: new Date().toISOString(),
        aprobadoPor: req.usuario.nombre,
        actualizadoEn: new Date().toISOString(),
      };
      await storage.setCollection('ventas', ventas);
      res.json(ventas[idx]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async rechazar(req, res) {
    try {
      if (!esGestor(req.usuario)) return res.status(403).json({ error: 'No tenés permiso para rechazar ventas.' });

      const ventas = await storage.getCollection('ventas');
      const idx = ventas.findIndex((v) => v.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Venta no encontrada.' });
      if (ventas[idx].estado !== 'pendiente') return res.status(400).json({ error: 'Esta venta ya fue procesada.' });

      ventas[idx] = {
        ...ventas[idx],
        estado: 'rechazada',
        motivoRechazo: (req.body.motivo || '').trim() || null,
        actualizadoEn: new Date().toISOString(),
      };
      await storage.setCollection('ventas', ventas);
      res.json(ventas[idx]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const ventas = await storage.getCollection('ventas');
      const venta = ventas.find((v) => v.id === req.params.id);
      if (!venta) return res.status(404).json({ error: 'Venta no encontrada.' });

      const puede = esGestor(req.usuario) || (venta.vendedorId === req.usuario.id && venta.estado === 'pendiente');
      if (!puede) return res.status(403).json({ error: 'No podés eliminar esta venta.' });

      await storage.setCollection('ventas', ventas.filter((v) => v.id !== req.params.id));

      await movimientos.registrar({
        usuarioId: req.usuario.id,
        usuarioNombre: req.usuario.nombre,
        tipo: 'venta_cancelada',
        detalle: venta.productoNombre + ' × ' + venta.cantidad + (venta.vendedorId !== req.usuario.id ? ' (vendedor: ' + venta.vendedorNombre + ')' : ''),
      });

      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
