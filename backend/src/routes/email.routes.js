const { Router } = require('express');
const emailController = require('../controllers/email.controller');

const router = Router();

router.post('/enviar', emailController.enviarUno);
router.post('/bulk', emailController.enviarMasivo);

module.exports = router;
