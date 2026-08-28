const express = require('express');
const controller = require('../controllers/parametros.controller');
const requireAuth = require('../middleware/auth.middleware');
const requirePermiso = require('../middleware/permiso.middleware');

const router = express.Router();

router.get('/', requireAuth, controller.get);
router.put('/', requireAuth, requirePermiso('parametros'), controller.update);

module.exports = router;
