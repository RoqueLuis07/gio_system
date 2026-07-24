const { makeCrudRouter } = require('./crud.router');
const productosController = require('../controllers/productos.controller');

module.exports = makeCrudRouter(productosController);
