const { Router } = require('express');
const multer = require('multer');
const archivosController = require('../controllers/archivos.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.get('/', archivosController.list);
router.post('/', upload.single('archivo'), archivosController.upload);
router.delete('/:id', archivosController.remove);

module.exports = router;
