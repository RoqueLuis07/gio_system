const multer = require('multer');
const { makeCrudRouter } = require('./crud.router');
const productosController = require('../controllers/productos.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const router = makeCrudRouter(productosController);
router.post('/:id/foto', upload.single('foto'), productosController.uploadFoto);
router.post('/:id/brochure', upload.single('brochure'), productosController.uploadBrochure);

module.exports = router;
