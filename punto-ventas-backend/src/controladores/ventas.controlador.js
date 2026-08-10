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


module.exports = {
    registrarVenta
};

