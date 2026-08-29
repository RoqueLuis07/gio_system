// Backend de almacenamiento en Postgres (Railway, Supabase, etc). Se activa
// automáticamente cuando existe la variable DATABASE_URL. Guarda cada
// "colección" (usuarios, productos, categorias, parametros) como una fila
// JSONB — mismo modelo simple que el backend local, pero persistente y apto
// para producción (los datos no se pierden en cada redeploy).
const { Pool } = require('pg');
const DEFAULTS = require('./defaults');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
});

let ready = null;

async function ensureSchema() {
  if (ready) return ready;
  ready = pool.query(`
    CREATE TABLE IF NOT EXISTS jair_collections (
      name TEXT PRIMARY KEY,
      data JSONB NOT NULL
    );
  `);
  await ready;
  return ready;
}

module.exports = {
  async getCollection(name) {
    await ensureSchema();
    const { rows } = await pool.query('SELECT data FROM jair_collections WHERE name = $1', [name]);
    if (rows.length === 0) {
      const value = DEFAULTS[name] ?? [];
      await this.setCollection(name, value);
      return value;
    }
    return rows[0].data;
  },

  async setCollection(name, value) {
    await ensureSchema();
    await pool.query(
      `INSERT INTO jair_collections (name, data) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data`,
      [name, JSON.stringify(value)]
    );
    return value;
  },
};
