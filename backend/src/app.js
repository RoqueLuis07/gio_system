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

  app.use(express.static(FRONTEND_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });

  return app;
}

module.exports = createApp;
