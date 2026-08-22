const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.USUARIO_BD,
    host: process.env.HOST_BD,
    database: process.env.NOMBRE_BD,
    password: process.env.PASSWORD_BD,
    port: process.env.PUERTO_BD
})

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar con PostgreSQL:', err.stack);
    } else {
        console.log('Conexión exitosa a la base de datos');
        release();
    }
});

module.exports = pool;