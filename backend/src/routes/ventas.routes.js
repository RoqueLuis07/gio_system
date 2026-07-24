const { Router } = require('express');
const ventasController = require('../controllers/ventas.controller');

const router = Router();

router.get('/', ventasController.list);
router.post('/', ventasController.create);
router.post('/bulk', ventasController.bulkCreate);
router.put('/:id', ventasController.update);
router.delete('/:id', ventasController.remove);

module.exports = router;
