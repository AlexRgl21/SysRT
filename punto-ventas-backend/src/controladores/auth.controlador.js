const pool = require('../configuracion/base_datos');

const iniciarSesion = async(req, res) => {
    const { nombre, pin } = req.body;

    if (!nombre || !pin) {
        return res.status(400).json({ mensaje: 'Por favor, proporciona el usuario y la contraseña'});
    }

    try {
        const query= `
            SELECT id, nombre, rol_id, activo
            FROM usuarios
            WHERE nombre = $1 AND pin = $2 AND activo = TRUE;
        `;

        const valores = [nombre, pin];
        const resultado = await pool.query(query, valores);

        if (resultado.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas o usuario inactivo' });
        }

        const usuario = resultado.rows[0];

        res.status(200).json({
            mensaje: 'Acceso autorizado',
            usuario: {
                id: usuario.id,
                nombre : usuario.nombre,
                rol_id: usuario.rol_id
            }
        });

    } catch (error) {
        console.error('Error en rl login', error);
        res.status(500).json({ mensaje: 'Error interno en el servidor al procesar el acceso' });
    }
};

module.exports = {
    iniciarSesion
};