const express = require('express');
const controller = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);
router.put('/clave', requireAuth, controller.cambiarClave);

module.exports = router;
