const { Router } = require('express');
const { registrarVenta, obtenerVentas } = require('../controladores/ventas.controlador');

const enrutador = Router();

enrutador.post('/ventas', registrarVenta);

enrutador.get('/ventas', obtenerVentas);

module.exports = enrutador;