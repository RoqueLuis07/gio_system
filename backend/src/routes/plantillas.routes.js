const { makeCrudRouter } = require('./crud.router');
const plantillasController = require('../controllers/plantillas.controller');

module.exports = makeCrudRouter(plantillasController);
