const express = require('express');
const cors = require('cors');

require('dotenv').config();
require('./configuracion/base_datos');
const productosRutas = require('./rutas/productos.rutas'); 
const ventasRutas = require('./rutas/ventas.rutas');
const authRutas = require('./rutas/auth.rutas');
const comprasRutas = require('./rutas/compras.rutas');
const { verificarToken } = require('./middleware/autenticacion');

const app = express();
const PUERTO = process.env.PUERTO_SERVIDOR || 3000;


app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
    res.json({ mensaje: 'El backend está funcionando' });
});

// Rutas públicas (no requieren sesión)
app.use('/api', authRutas);

// A partir de aquí, todas las rutas requieren un token válido
app.use('/api', verificarToken, productosRutas);
app.use('/api', verificarToken, ventasRutas);
app.use('/api', verificarToken, comprasRutas);

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejador de errores global (por si algo no capturado llega hasta aquí)
app.use((err, req, res, next) => {
    console.error('Error no controlado:', err);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
});

app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});