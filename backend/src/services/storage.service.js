const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
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
