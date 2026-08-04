const pool = require('../configuracion/base_datos');
const obtenerProductos = async(req, res) => {
    
    try{
        const resultado = await pool.query(
            'SELECT * FROM productos WHERE deleted_at IS NULL'
        );

    res.status(200).json(resultado.rows)
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({mensaje: 'Error interno del servidor al consultar el inventario'});
    }
};

module.exports = {
    obtenerProductos
};