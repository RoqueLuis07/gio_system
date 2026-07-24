const { makeCrudRouter } = require('./crud.router');
const recordatoriosController = require('../controllers/recordatorios.controller');

module.exports = makeCrudRouter(recordatoriosController);
