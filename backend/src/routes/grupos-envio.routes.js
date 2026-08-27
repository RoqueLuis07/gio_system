const { makeCrudRouter } = require('./crud.router');
const gruposEnvioController = require('../controllers/grupos-envio.controller');

module.exports = makeCrudRouter(gruposEnvioController);
