const path = require('path');
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');

const FRONTEND_DIR = path.join(__dirname, '..', '..', 'frontend');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' })); // 5mb to allow base64 reminder images

  app.use('/api', apiRoutes);

  // Si PUBLIC_ROOT=true (usado en el servicio dedicado a la página pública),
  // la raíz del dominio muestra directo el catálogo, sin pasar por el CRM.
  if (process.env.PUBLIC_ROOT === 'true') {
    app.get('/', (req, res) => res.redirect('/diplomados'));
  }

  // Página pública (sin login) de diplomados: catálogo compartible por link.
  app.get('/diplomados', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'publico', 'diplomados.html')));
  app.get('/diplomados/:id', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'publico', 'diplomados.html')));

  app.use(express.static(FRONTEND_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });

  return app;
}

module.exports = createApp;
