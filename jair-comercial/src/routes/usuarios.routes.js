const express = require('express');
const controller = require('../controllers/usuarios.controller');
const requireAuth = require('../middleware/auth.middleware');
const requirePermiso = require('../middleware/permiso.middleware');

const router = express.Router();

// Cualquier usuario autenticado puede ver/editar su propio perfil (sin
// necesitar el permiso 'usuarios', que es solo para administrar a otros).
router.get('/me', requireAuth, controller.me);
router.put('/me/datos-pago', requireAuth, controller.actualizarDatosPago);

router.use(requireAuth, requirePermiso('usuarios'));
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
