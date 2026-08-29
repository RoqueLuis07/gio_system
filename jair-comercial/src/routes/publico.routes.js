const express = require('express');
const controller = require('../controllers/publico.controller');

const router = express.Router();

router.get('/catalogo', controller.catalogo);

module.exports = router;
