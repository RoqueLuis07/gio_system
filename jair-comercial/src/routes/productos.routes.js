const express = require('express');
const controller = require('../controllers/productos.controller');
const requireAuth = require('../middleware/auth.middleware');
const requirePermiso = require('../middleware/permiso.middleware');
const { upload } = require('../middleware/upload.middleware');

const router = express.Router();

// Cualquier usuario autenticado (incluidos vendedores sin permiso 'productos')
// puede consultar este catálogo interno para cargar una venta.
router.get('/para-venta', requireAuth, controller.paraVenta);

router.use(requireAuth, requirePermiso('productos'));
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/duplicar', controller.duplicar);
router.post('/imagen', upload.single('imagen'), controller.uploadImagen);

module.exports = router;
