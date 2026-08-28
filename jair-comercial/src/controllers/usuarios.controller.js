const storage = require('../services/storage.service');
const { uid } = require('../utils/id');
const movimientos = require('../services/movimientos.service');

const PERMISOS_VALIDOS = ['productos', 'categorias', 'parametros', 'usuarios', 'ventas', 'gastos'];
const ROLES_VALIDOS = ['admin', 'funcionario', 'vendedor'];

// Campos que, si cambian, quedan anotados en el historial del usuario (solo visible para el admin).
const CAMPOS_AUDITADOS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'usuario', label: 'Usuario de acceso' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'ci', label: 'Cédula de identidad' },
  { key: 'activo', label: 'Activo' },
  { key: 'rol', label: 'Rol' },
];

function sanitize(usuario) {
  const { pass, ...rest } = usuario;
  return rest;
}

function buildUsuario(body, esUpdate) {
  const nombre = (body.nombre || '').trim();
  const usuario = (body.usuario || '').trim().toLowerCase();
  const rol = ROLES_VALIDOS.includes(body.rol) ? body.rol : 'funcionario';
  const permisos = Array.isArray(body.permisos) ? body.permisos.filter((p) => PERMISOS_VALIDOS.includes(p)) : [];

  if (!nombre) throw new Error('El nombre es obligatorio.');
  if (!usuario) throw new Error('El usuario (para iniciar sesión) es obligatorio.');
  if (!esUpdate && !(body.pass || '').trim()) throw new Error('La contraseña es obligatoria.');

  const out = {
    nombre,
    usuario,
    rol,
    permisos: rol === 'admin' ? PERMISOS_VALIDOS : rol === 'vendedor' ? [] : permisos,
    activo: body.activo !== undefined ? !!body.activo : true,
    telefono: (body.telefono || '').trim(),
    ci: (body.ci || '').trim(),
  };

  if ((body.pass || '').trim()) out.pass = body.pass.trim();
  return out;
}

function registrarCambios(usuarios, idx, patch, editadoPor) {
  const anterior = usuarios[idx];
  const cambios = CAMPOS_AUDITADOS
    .filter((c) => patch[c.key] !== undefined && patch[c.key] !== anterior[c.key])
    .map((c) => ({ campo: c.label, anterior: anterior[c.key] ?? '', nuevo: patch[c.key] }));

  if (cambios.length === 0) return usuarios[idx].historialCambios || [];

  const historial = usuarios[idx].historialCambios || [];
  historial.push({ id: uid(), fecha: new Date().toISOString(), editadoPor, cambios });
  return historial;
}

module.exports = {
  async list(req, res) {
    try {
      const usuarios = await storage.getCollection('usuarios');
      res.json(usuarios.map(sanitize));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Perfil propio: cualquier usuario autenticado puede consultar su registro
  // actualizado (la sesión guarda una foto del login, esto siempre es fresco).
  async me(req, res) {
    try {
      const usuarios = await storage.getCollection('usuarios');
      const usuario = usuarios.find((u) => u.id === req.usuario.id);
      if (!usuario) return res.status(404).json({ error: 'No encontrado' });
      res.json(sanitize(usuario));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const usuarios = await storage.getCollection('usuarios');
      const entrada = buildUsuario(req.body, false);

      if (usuarios.some((u) => u.usuario === entrada.usuario)) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese nombre de acceso.' });
      }

      const ahora = new Date().toISOString();
      const nuevo = {
        id: uid(),
        creadoEn: ahora,
        actualizadoEn: ahora,
        ...entrada,
        datosPago: { banco: '', numeroCuenta: '', titular: '', telefono: '' },
        perfilCompleto: entrada.rol !== 'vendedor', // solo los vendedores necesitan completar datos de pago
        historialCambios: [],
      };
      usuarios.push(nuevo);
      await storage.setCollection('usuarios', usuarios);
      res.status(201).json(sanitize(nuevo));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const usuarios = await storage.getCollection('usuarios');
      const idx = usuarios.findIndex((u) => u.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

      const patch = buildUsuario({ ...usuarios[idx], ...req.body }, true);

      if (usuarios.some((u) => u.id !== req.params.id && u.usuario === patch.usuario)) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese nombre de acceso.' });
      }

      // No permitir que el último admin activo se degrade o desactive a sí mismo.
      const adminsActivos = usuarios.filter((u) => u.rol === 'admin' && u.activo);
      const eraUnicoAdmin = adminsActivos.length === 1 && adminsActivos[0].id === req.params.id;
      if (eraUnicoAdmin && (patch.rol !== 'admin' || !patch.activo)) {
        return res.status(400).json({ error: 'Debe quedar al menos un usuario administrador activo.' });
      }

      const historialCambios = registrarCambios(usuarios, idx, patch, req.usuario.nombre);
      usuarios[idx] = { ...usuarios[idx], ...patch, historialCambios, actualizadoEn: new Date().toISOString() };
      await storage.setCollection('usuarios', usuarios);
      res.json(sanitize(usuarios[idx]));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // El vendedor carga (o corrige) sus propios datos de pago. Queda registrado
  // en su historial de cambios y en el registro de actividad.
  async actualizarDatosPago(req, res) {
    try {
      const datosPago = {
        banco: (req.body.banco || '').trim(),
        numeroCuenta: (req.body.numeroCuenta || '').trim(),
        titular: (req.body.titular || '').trim(),
        telefono: (req.body.telefono || '').trim(),
      };
      if (!datosPago.banco || !datosPago.numeroCuenta || !datosPago.titular) {
        throw new Error('Completá banco, número de cuenta y titular.');
      }

      const usuarios = await storage.getCollection('usuarios');
      const idx = usuarios.findIndex((u) => u.id === req.usuario.id);
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });

      const anterior = usuarios[idx].datosPago || {};
      const cambios = ['banco', 'numeroCuenta', 'titular', 'telefono']
        .filter((k) => (anterior[k] || '') !== datosPago[k])
        .map((k) => ({ campo: 'Datos de pago: ' + k, anterior: anterior[k] || '', nuevo: datosPago[k] }));

      const historial = usuarios[idx].historialCambios || [];
      if (cambios.length > 0) {
        historial.push({ id: uid(), fecha: new Date().toISOString(), editadoPor: req.usuario.nombre, cambios });
      }

      usuarios[idx] = {
        ...usuarios[idx],
        datosPago,
        perfilCompleto: true,
        historialCambios: historial,
        actualizadoEn: new Date().toISOString(),
      };
      await storage.setCollection('usuarios', usuarios);

      await movimientos.registrar({
        usuarioId: req.usuario.id,
        usuarioNombre: req.usuario.nombre,
        tipo: 'perfil_actualizado',
        detalle: 'Actualizó sus datos de pago.',
      });

      res.json(sanitize(usuarios[idx]));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const usuarios = await storage.getCollection('usuarios');
      const objetivo = usuarios.find((u) => u.id === req.params.id);
      if (!objetivo) return res.status(404).json({ error: 'No encontrado' });

      const adminsActivos = usuarios.filter((u) => u.rol === 'admin' && u.activo);
      if (objetivo.rol === 'admin' && adminsActivos.length === 1) {
        return res.status(400).json({ error: 'Debe quedar al menos un usuario administrador.' });
      }

      await storage.setCollection('usuarios', usuarios.filter((u) => u.id !== req.params.id));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports.PERMISOS_VALIDOS = PERMISOS_VALIDOS;
