const { makeCrudRouter } = require('./crud.router');
const prospectosController = require('../controllers/prospectos.controller');

module.exports = makeCrudRouter(prospectosController);
