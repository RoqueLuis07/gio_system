const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/productos', require('./productos.routes'));
router.use('/categorias', require('./categorias.routes'));
router.use('/ventas', require('./ventas.routes'));
router.use('/gastos', require('./gastos.routes'));
router.use('/movimientos', require('./movimientos.routes'));
router.use('/parametros', require('./parametros.routes'));
router.use('/upload', require('./upload.routes'));
router.use('/publico', require('./publico.routes'));

module.exports = router;
