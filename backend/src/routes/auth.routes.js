const { Router } = require('express');
const multer = require('multer');
const authController = require('../controllers/auth.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.post('/login', authController.login);
router.put('/profile', authController.updateProfile);
router.post('/profile/foto', upload.single('foto'), authController.uploadFoto);

module.exports = router;
