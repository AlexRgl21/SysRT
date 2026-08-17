const { Router } = require('express');
const comprasControlador = require('../controladores/compras.controlador');

const router = Router();

router.get('/agenda', comprasControlador.obtenerAgendaDia);
router.put('/agenda/:id', comprasControlador.actualizarVisita);
router.post('/agenda/generar', comprasControlador.generarAgendaHoy);

router.get('/proveedores', comprasControlador.obtenerProveedores);
router.post('/proveedores', comprasControlador.crearProveedor);


module.exports = router;