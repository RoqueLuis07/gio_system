const { makeCrudRouter } = require('./crud.router');
const enlacesController = require('../controllers/enlaces.controller');

module.exports = makeCrudRouter(enlacesController);
