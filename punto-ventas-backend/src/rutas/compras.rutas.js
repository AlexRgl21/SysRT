const { Router } = require('express');
const comprasControlador = require('../controladores/compras.controlador');

const router = Router();

router.get('/agenda', comprasControlador.obtenerAgendaDia);
router.put('/agenda/:id', comprasControlador.actualizarVisita);
router.post('/agenda/generar', comprasControlador.generarAgendaHoy);
router.get('/compras', comprasControlador.obtenerCompras);
router.post('/compras', comprasControlador.registrarCompra);

router.get('/deudas', comprasControlador.obtenerDeudas);
router.post('/deudas/:id/abono', comprasControlador.registrarAbono);

router.get('/reportes/resumen', comprasControlador.obtenerResumenReportes);

router.put('/proveedores/:id', comprasControlador.actualizarProveedor);
router.delete('/proveedores/:id', comprasControlador.eliminarProveedor);


router.get('/proveedores', comprasControlador.obtenerProveedores);
router.post('/proveedores', comprasControlador.crearProveedor);


module.exports = router;