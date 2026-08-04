const { Router } = require('express');
const { obtenerProductos } = require('../controladores/productos.controlador');

const enrutador = Router();

enrutador.get('/productos', obtenerProductos);

module.exports = enrutador;