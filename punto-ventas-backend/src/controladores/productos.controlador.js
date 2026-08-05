const pool = require('../configuracion/base_datos');

// LECTURA
const obtenerProductos = async(req, res) => {
    try{
        const query = `
    SELECT 
        p.id, 
        p.nombre, 
        c.nombre AS categoria, /* <-- Extraemos el nombre de la categoría */
        p.precio_compra, 
        p.precio_venta, 
        p.stock_actual,
        COALESCE(JSON_AGG(cb.codigo) FILTER (WHERE cb.codigo IS NOT NULL), '[]') AS codigos
    FROM productos p
    LEFT JOIN codigos_barras cb ON p.id = cb.producto_id
    LEFT JOIN categorias c ON p.categoria_id = c.id /* <-- Unimos la tabla categorias */
    WHERE p.deleted_at IS NULL
    GROUP BY p.id, c.nombre /* <-- Agrupamos también por la categoría */
    ORDER BY p.id ASC;
    `;
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows)
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({mensaje: 'Error interno del servidor al consultar el inventario'});
    }
};

// CREACIÓN 
const crearProducto = async (req, res) => {
    const { nombre, categoria_id, precio_compra, precio_venta, stock_actual, codigo } = req.body;

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

// ACTUALIZACIÓN (UPDATE)
const actualizarProducto = async (req, res) => {
    const { id } = req.params; // Capturamos el ID que viene en la URL
    const { nombre, categoria_id, precio_compra, precio_venta, stock_actual } = req.body;

    try {
        const query = `
            UPDATE productos 
            SET nombre = $1, categoria_id = $2, precio_compra = $3, precio_venta = $4, stock_actual = $5
            WHERE id = $6 AND deleted_at IS NULL
            RETURNING *;
        `;
        const valores = [nombre, categoria_id || null, precio_compra, precio_venta, stock_actual, id];
        const resultado = await pool.query(query, valores);

        // Validamos si el producto existe o si ya estaba "eliminado"
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado o inactivo' });
        }

        res.status(200).json({
            mensaje: 'Producto actualizado correctamente',
            producto: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar el producto' });
    }
};

// BORRADO LÓGICO 
const eliminarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            UPDATE productos 
            SET deleted_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING id, nombre;
        `;
        const resultado = await pool.query(query, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado o ya estaba eliminado' });
        }

        res.status(200).json({
            mensaje: 'Producto eliminado del inventario (borrado lógico)',
            producto: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ mensaje: 'Error interno al eliminar el producto' });
    }
};

// RESTAURAR PRODUCTO
const restaurarProducto = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            UPDATE productos 
            SET deleted_at = NULL 
            WHERE id = $1 AND deleted_at IS NOT NULL
            RETURNING id, nombre;
        `;
        const resultado = await pool.query(query, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado o ya se encuentra activo' });
        }

        res.status(200).json({
            mensaje: 'Producto restaurado exitosamente al catálogo',
            producto: resultado.rows[0]
        });
    } catch (error) {
        console.error('Error al restaurar el producto:', error);
        res.status(500).json({ mensaje: 'Error interno al restaurar el producto' });
    }
};

module.exports = {
    obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto, 
    restaurarProducto
};