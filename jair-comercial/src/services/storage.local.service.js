// Backend de almacenamiento local (archivo JSON). Se usa automáticamente
// cuando no hay DATABASE_URL configurada — ideal para desarrollo sin depender
// de una base de datos externa. En producción (Railway) se usa Postgres
// (ver storage.pg.service.js), seleccionado por storage.service.js.
const fs = require('fs/promises');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

const DEFAULTS = require('./defaults');

let cache = null;
let writeChain = Promise.resolve();

async function ensureFile() {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULTS, null, 2), 'utf8');
  }
}

async function load() {
  if (cache) return cache;
  await ensureFile();
  const raw = await fs.readFile(DB_FILE, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  cache = { ...DEFAULTS, ...parsed };
  return cache;
}

async function persist() {
  const data = cache;
  writeChain = writeChain.then(() => fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8'));
  return writeChain;
}

module.exports = {
  async getCollection(name) {
    const db = await load();
    return db[name] ?? DEFAULTS[name] ?? [];
  },

  async setCollection(name, value) {
    const db = await load();
    db[name] = value;
    await persist();
    return value;
  },
};
