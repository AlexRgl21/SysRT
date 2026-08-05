const { Router } = require('express');

const { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto } = require('../controladores/productos.controlador');

const enrutador = Router();

enrutador.get('/productos', obtenerProductos);

enrutador.post('/productos', crearProducto);

enrutador.put('/productos/:id', actualizarProducto);

enrutador.delete('/productos/:id', eliminarProducto);


module.exports = enrutador;