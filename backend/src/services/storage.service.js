const fs = require('fs');
const path = require('path');

const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');

function getDbPath() {
  return process.env.DATA_PATH
    ? path.resolve(process.env.DATA_PATH)
    : path.join(__dirname, '..', '..', '.data', 'db.json');
}

function ensureDbFile() {
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dbPath)) fs.copyFileSync(SEED_PATH, dbPath);
  return dbPath;
}

function readDb() {
  const dbPath = ensureDbFile();
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDb(db) {
  fs.writeFileSync(ensureDbFile(), JSON.stringify(db, null, 2), 'utf-8');
}

function getState() {
  return readDb();
}

function getCollection(name) {
  const db = readDb();
  return db[name];
}

function setCollection(name, value) {
  const db = readDb();
  db[name] = value;
  writeDb(db);
  return db[name];
}

module.exports = { getState, getCollection, setCollection };
