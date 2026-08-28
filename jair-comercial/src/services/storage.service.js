// Fachada: elige el backend de almacenamiento según el entorno.
// - Si hay DATABASE_URL (Railway Postgres, Supabase, etc.) -> Postgres.
// - Si no -> archivo JSON local (desarrollo sin configurar nada).
// Ambos backends implementan la misma interfaz (getCollection/setCollection),
// así que el resto de la app no necesita saber cuál está activo.
const backend = process.env.DATABASE_URL ? require('./storage.pg.service') : require('./storage.local.service');

if (!process.env.DATABASE_URL) {
  console.log('[jair-comercial] Sin DATABASE_URL: usando almacenamiento local en data/db.json.');
} else {
  console.log('[jair-comercial] Usando Postgres (DATABASE_URL) como almacenamiento.');
}

module.exports = backend;
