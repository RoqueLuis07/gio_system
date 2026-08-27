const { Router } = require('express');
const publicoController = require('../controllers/publico.controller');

const router = Router();

router.get('/diplomados', publicoController.listarDiplomados);

module.exports = router;
