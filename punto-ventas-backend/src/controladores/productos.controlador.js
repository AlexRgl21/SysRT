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


// REGISTRAR PRODUCTOS
const crearProducto = async(req, res) => {
    const {nombre, categoria_id, precio_compra, precio_venta, stock_actual, codigo } = req.body;

    try {
        await pool.query('BEGIN');

        const queryProducto = `
        INSERT INTO productos (nombre, categoria_id, precio_compra, precio_venta, stock_actual)
        VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre;
        `;
        const valoresProducto = [nombre, categoria_id || null, precio_compra || 0.00, precio_venta, stock_actual || 0.000];
        const resultadoProducto = await pool.query(queryProducto, valoresProducto);
        const nuevoProducto = resultadoProducto.rows[0];

        if (codigo) {
            const queryCodigo = `
                INSERT INTO codigos_barras (producto_id, codigo) 
                VALUES ($1, $2);
            `;
            await pool.query(queryCodigo, [nuevoProducto.id, codigo]);
        }

        await pool.query('COMMIT');

        res.status(201).json({
            mensaje: 'Producto registrado exitosamente',
            producto: nuevoProducto
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error al registrar el producto:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar el producto' });
    }
};

module.exports = {
    obtenerProductos,
    crearProducto
};