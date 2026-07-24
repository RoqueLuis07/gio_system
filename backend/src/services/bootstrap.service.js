const storage = require('./storage.service');

const SUPERADMIN_ID = 'superadmin';
const DEFAULT_ADMIN_PASS = 'CambiaEstaClave123';

function ensureSuperadmin() {
  const nombre = process.env.ADMIN_USER || 'superadmin';
  const pass = process.env.ADMIN_PASS || DEFAULT_ADMIN_PASS;

  const usuarios = storage.getCollection('usuarios');
  const idx = usuarios.findIndex((u) => u.id === SUPERADMIN_ID);

  if (idx === -1) {
    usuarios.push({ id: SUPERADMIN_ID, nombre, pass, rol: 'superadmin' });
  } else {
    usuarios[idx] = { ...usuarios[idx], nombre, pass, rol: 'superadmin' };
  }
  storage.setCollection('usuarios', usuarios);

  if (!process.env.ADMIN_PASS) {
    console.warn(
      `[GM Ventas Pro] ADMIN_PASS no está definido: el superadmin "${nombre}" quedó con la contraseña por defecto. Configura ADMIN_USER/ADMIN_PASS antes de desplegar en producción.`
    );
  }
}

module.exports = { ensureSuperadmin };
