const { Router } = require('express');
const { obtenerProductos, crearProducto } = require('../controladores/productos.controlador');

const enrutador = Router();

enrutador.get('/productos', obtenerProductos);

enrutador.post('/productos', crearProducto);

module.exports = enrutador;