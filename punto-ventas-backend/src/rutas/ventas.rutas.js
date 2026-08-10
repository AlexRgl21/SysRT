const { Router } = require('express');
const { registrarVenta } = require('../controladores/ventas.controlador');

const enrutador = Router();

enrutador.post('/ventas', registrarVenta);

module.exports = enrutador;