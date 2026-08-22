const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const encabezado = req.headers['authorization'];

    if (!encabezado || !encabezado.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó un token.' });
    }

    const token = encabezado.split(' ')[1];

    try {
        const datosUsuario = jwt.verify(token, process.env.JWT_SECRETO);
        req.usuario = datosUsuario; 
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado. Inicia sesión de nuevo.' });
    }
};

const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol_id)) {
            return res.status(403).json({ mensaje: 'No tienes permisos para realizar esta acción.' });
        }
        next();
    };
};

module.exports = { verificarToken, verificarRol };