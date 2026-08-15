const { Router } = require('express');
const { iniciarSesion } = require('../controladores/auth.controlador');

const enrutador = Router();

enrutador.post('/login', iniciarSesion);

module.exports = enrutador;