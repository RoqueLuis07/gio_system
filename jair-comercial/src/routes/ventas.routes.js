const express = require('express');
const controller = require('../controllers/ventas.controller');
const requireAuth = require('../middleware/auth.middleware');

const router = express.Router();

// El control de qué puede ver/aprobar cada usuario se hace dentro del
// controlador (depende de si es dueño de la venta, no solo de un permiso fijo).
router.use(requireAuth);
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id/aprobar', controller.aprobar);
router.put('/:id/rechazar', controller.rechazar);
router.put('/:id/delivery', controller.asignarDelivery);
router.delete('/:id', controller.remove);

module.exports = router;
