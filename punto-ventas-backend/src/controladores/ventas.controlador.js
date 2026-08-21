const pool = require('../configuracion/base_datos');

const registrarVenta = async (req, res) => {
    const { usuario_id, metodo_pago, total, productos } = req.body;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ mensaje: 'El carrito de ventas esta vacío.'});
    }

    try {
        await pool.query('BEGIN');

        const queryVenta = `
            INSERT INTO ventas (usuario_id, metodo_pago, total)
            VALUES($1, $2, $3)
            RETURNING id, fecha;
        `;
        
        const resultadoVenta = await pool.query(queryVenta, [usuario_id || 1, metodo_pago, total]);
        const ventaId = resultadoVenta.rows[0].id;

        for (const item of productos) {

            const subtotal = item.cantidad * item.precio_venta;
            const costoUnitario = item.costo_unitario || 0.00;

            const queryDetalle = `
                INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, costo_unitario, subtotal)
                VALUES ($1, $2, $3, $4, $5, $6);
            `;
            await pool.query(queryDetalle, [ventaId, item.id, item.cantidad, item.precio_venta, costoUnitario, subtotal]);

            const queryStock = `
                UPDATE productos
                SET stock_actual = stock_actual - $1
                WHERE id = $2 AND deleted_at IS NULL;
                
            `;
            await pool.query(queryStock, [item.cantidad, item.id]);

            const queryKardex = `
                INSERT INTO kardex_inventario (producto_id, tipo_movimiento, cantidad)
                VALUES ($1, 'SALIDA', $2);
            `;
            await pool.query(queryKardex, [item.id, item.cantidad]);
        }

        await pool.query('COMMIT');

        res.status(201).json({
            mensaje: 'Venta procesada y cobrada con éxito.',
            venta_id: ventaId
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error crítico al procesar la venta:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar el cobro.' });
    }
};

// FUNCION PARA EL DASHBOARD PRINCIPAL 
const obtenerVentas = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id, 
                v.fecha, 
                v.total,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'nombre', p.nombre,
                            'cantidad', dv.cantidad,
                            'precio_venta', dv.precio_unitario,
                            'precio_compra', p.precio_compra 
                        )
                    ) FILTER (WHERE p.id IS NOT NULL), '[]'
                ) as productos
            FROM ventas v
            LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
            LEFT JOIN productos p ON dv.producto_id = p.id
            GROUP BY v.id
            ORDER BY v.fecha DESC;
        `;
        
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);
        
    } catch (error) {
        console.error('Error al obtener las ventas para el dashboard:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar el historial de ventas.' });
    }
};


module.exports = {
    registrarVenta,
    obtenerVentas
};

