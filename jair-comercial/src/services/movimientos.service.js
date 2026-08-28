// Registro de actividad: cada acción relevante de un usuario (venta cargada,
// venta cancelada, perfil actualizado, inicio de sesión) queda anotada acá
// para que el admin pueda ver "todo lo que hizo" cada vendedor.
const storage = require('./storage.service');
const { uid } = require('../utils/id');

async function registrar({ usuarioId, usuarioNombre, tipo, detalle }) {
  const movimientos = await storage.getCollection('movimientos');
  movimientos.push({
    id: uid(),
    usuarioId,
    usuarioNombre,
    tipo,
    detalle: detalle || '',
    fecha: new Date().toISOString(),
  });
  await storage.setCollection('movimientos', movimientos);
}

module.exports = { registrar };
