const { Router } = require('express');
const parametrosController = require('../controllers/parametros.controller');

const router = Router();

router.get('/', parametrosController.get);
router.put('/', parametrosController.update);

module.exports = router;
