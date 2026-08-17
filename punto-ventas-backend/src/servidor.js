const express = require('express');
const cors = require('cors');


require('./configuracion/base_datos');
const productosRutas = require('./rutas/productos.rutas'); 
const ventasRutas = require('./rutas/ventas.rutas');
const authRutas = require('./rutas/auth.rutas');
const comprasRutas = require('./rutas/compras.rutas');

const app = express();
const PUERTO = process.env.PUERTO_SERVIDOR || 3000;


app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
    res.json({ mensaje: 'El backend está funcionando' });
});
app.use('/api', productosRutas); 
app.use('/api', ventasRutas);
app.use('/api', authRutas);
app.use('/api', comprasRutas);

app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});