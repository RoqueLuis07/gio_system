const express = require('express');
const controller = require('../controllers/categorias.controller');
const requireAuth = require('../middleware/auth.middleware');
const requirePermiso = require('../middleware/permiso.middleware');

const router = express.Router();

router.use(requireAuth, requirePermiso('categorias'));
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
