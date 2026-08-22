const pool = require('../configuracion/base_datos');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const iniciarSesion = async(req, res) => {
    const { nombre, pin } = req.body;

    if (!nombre || !pin) {
        return res.status(400).json({ mensaje: 'Por favor, proporciona el usuario y la contraseña'});
    }

    try {
        const query= `
            SELECT id, nombre, pin, rol_id, activo
            FROM usuarios
            WHERE nombre = $1 AND activo = TRUE;
        `;

        const resultado = await pool.query(query, [nombre]);

        if (resultado.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas o usuario inactivo' });
        }

        const usuario = resultado.rows[0];

        // Comparamos el pin ingresado contra el hash guardado en la base de datos
        const pinValido = await bcrypt.compare(String(pin), usuario.pin);

        if (!pinValido) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas o usuario inactivo' });
        }

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, rol_id: usuario.rol_id },
            process.env.JWT_SECRETO,
            { expiresIn: '12h' }
        );

        res.status(200).json({
            mensaje: 'Acceso autorizado',
            token,
            usuario: {
                id: usuario.id,
                nombre : usuario.nombre,
                rol_id: usuario.rol_id
            }
        });

    } catch (error) {
        console.error('Error en el login', error);
        res.status(500).json({ mensaje: 'Error interno en el servidor al procesar el acceso' });
    }
};

module.exports = {
    iniciarSesion
};