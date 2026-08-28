const express = require('express');
const requireAuth = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/', requireAuth, upload.single('archivo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Seleccioná una imagen.' });
  res.json({ url: '/uploads/' + req.file.filename });
});

module.exports = router;
