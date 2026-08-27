const { Router } = require('express');

const router = Router();

router.use('/state', require('./state.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/productos', require('./productos.routes'));
router.use('/ventas', require('./ventas.routes'));
router.use('/prospectos', require('./prospectos.routes'));
router.use('/recordatorios', require('./recordatorios.routes'));
router.use('/plantillas', require('./plantillas.routes'));
router.use('/parametros', require('./parametros.routes'));
router.use('/archivos', require('./archivos.routes'));
router.use('/enlaces', require('./enlaces.routes'));
router.use('/email', require('./email.routes'));
router.use('/grupos-envio', require('./grupos-envio.routes'));
router.use('/publico', require('./publico.routes'));

module.exports = router;
