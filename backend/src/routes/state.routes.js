const { Router } = require('express');
const stateController = require('../controllers/state.controller');

const router = Router();

router.get('/', stateController.get);

module.exports = router;
