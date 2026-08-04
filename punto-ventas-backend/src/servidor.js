const express = require('express');
const cors = require('cors');

require('./configuracion/base_datos');

const app = express();
const PUERTO = process.env.PUERTO_SERVIDOR || 3000;

app.use(cors());
app.use(express.json())

app.get('/api', (req, res) => {
    res.json({ mensaje: 'El backend está funcionando' });
});

app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});


const productosRutas = require('./rutas/productos.rutas');
app.use('/api', productosRutas);