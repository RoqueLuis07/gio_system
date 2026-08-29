const express = require('express');
const controller = require('../controllers/gastos.controller');
const requireAuth = require('../middleware/auth.middleware');
const requirePermiso = require('../middleware/permiso.middleware');

const router = express.Router();

router.use(requireAuth, requirePermiso('gastos'));
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
