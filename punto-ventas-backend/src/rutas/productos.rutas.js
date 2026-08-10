const { Router } = require('express');

const { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto, restaurarProducto, buscarPorCodigo, registrarEntradaStock } = require('../controladores/productos.controlador');

const enrutador = Router();

enrutador.get('/productos', obtenerProductos);

enrutador.get('/productos/codigo/:codigo', buscarPorCodigo);

enrutador.post('/productos', crearProducto);

enrutador.put('/productos/:id', actualizarProducto);

enrutador.delete('/productos/:id', eliminarProducto);

enrutador.put('/productos/:id/restaurar', restaurarProducto);

enrutador.put('/productos/:id/entrada', registrarEntradaStock)


module.exports = enrutador;