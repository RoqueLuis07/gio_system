const { makeCrudRouter } = require('./crud.router');
const usuariosController = require('../controllers/usuarios.controller');

module.exports = makeCrudRouter(usuariosController);
