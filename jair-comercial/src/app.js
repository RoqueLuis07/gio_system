const path = require('path');
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes');
const { UPLOADS_DIR } = require('./middleware/upload.middleware');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  app.use('/api', apiRoutes);
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.use('/admin', express.static(path.join(PUBLIC_DIR, 'admin')));
  app.get('/admin*', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin', 'index.html')));

  app.use(express.static(PUBLIC_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  return app;
}

module.exports = createApp;
