const pool = require('../configuracion/base_datos');

// AGENDA DEL DÍA
const obtenerAgendaDia = async (req, res) => {
    try {
        const query = `
            SELECT rv.id, rv.proveedor_id, p.nombre, rv.asistio, rv.notas
            FROM registro_visita rv
            JOIN proveedores p ON rv.proveedor_id = p.id
            WHERE rv.fecha_visita = CURRENT_DATE
            ORDER BY p.nombre ASC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener la agenda del día:', error);
        res.status(500).json({ error: 'Error interno al cargar la agenda' });
    }
};

const actualizarVisita = async (req, res) => {
    try { 
        const { id } = req.params;
        const { asistio, notas } = req.body;

        const query = `
            UPDATE registro_visita
            SET asistio = $1, notas = COALESCE($2, notas)
            WHERE id = $3
            RETURNING *
        `;
        const { rows } = await pool.query(query, [asistio, notas, id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Registro de visita no encontrado' });
        }

        res.json({ mensaje: 'Visita actualizada correctamente', visita: rows[0] });
    } catch (error) {
        console.error('Error al actualizar la visita:', error);
        res.status(500).json({ error: 'Error interno al actualizar la agenda' });
    }
};

// AGENDA DE HOY 
const generarAgendaHoy = async (req, res) => {
    try {

        const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
        const diaHoy = diaSemana[new Date().getDay()];

        const parametroBusqueda = `%${diaHoy}%`;
        const query = `
            INSERT INTO registro_visita (proveedor_id, fecha_visita)
            SELECT id, CURRENT_DATE
            FROM proveedores
            WHERE activo = TRUE 
            AND dias_visita ILIKE $1
            ON CONFLICT (proveedor_id, fecha_visita) DO NOTHING
            RETURNING id;
        `;
        const { rows } = await pool.query(query, [parametroBusqueda]);
        
        res.json({ 
            mensaje: `Agenda del ${diaHoy} generada exitosamente`, 
            nuevosRegistros: rows.length,
            dia_detectado: diaHoy 
        });
    } catch (error) {
        console.error('Error al generar la agenda de hoy:', error);
        res.status(500).json({ error: 'Error interno al generar la agenda' });
    }
};


// MÓDULO DIRECTORIO DE PROVEEDORES
const obtenerProveedores = async (req, res) => {
    try {
        const query = 'SELECT id, nombre, telefono, dias_visita FROM proveedores WHERE activo = TRUE ORDER BY nombre ASC';
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener proveedores', error);
        res.status(500).json({ error: 'Error interno al cargar el directorio' });
    }
};

const crearProveedor = async (req, res) => {
    try {
        const { nombre, telefono, dias_visita } = req.body;

        const query = `
            INSERT INTO proveedores (nombre, telefono, dias_visita)
            VALUES ($1, $2, $3)
            RETURNING id, nombre, telefono, dias_visita
        `;
        const { rows } = await pool.query(query, [nombre, telefono, dias_visita]);

        res.status(201).json({ mensaje: 'Proveedor creado con éxito', proveedor: rows[0] });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ error: 'Error interno al registrar al proveedor' });
    }
};

// REGISTRO DE COMPRAS
const registrarCompra = async (req, res) => {
    try {
        const { proveedor_id, total_compra, estatus_pago, saldo_pendiente, notas } = req.body;

        const saldoFinal = estatus_pago === 'pagada' ? 0 : saldo_pendiente;

        const query = `
            INSERT INTO compras (proveedor_id, total_compra, estatus_pago, saldo_pendiente, notas)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, fecha, total_compra, estatus_pago
        `;
        const { rows } = await pool.query(query, [proveedor_id, total_compra, estatus_pago, saldoFinal, notas]);

        res.status(201).json({
            mensaje: 'Compra registradaa con éxito.',
            compra: rows[0]
        });
    } catch (error) {
        console.error('Error al registrar compra:', error);
        res.status(500).json({ error: 'Error interno al guardar la factura' });
    }
};

// OBTENER EL HISTORIAL DE COMPRAS
const obtenerCompras = async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.fecha, p.nombre AS proveedor, c.total_compra, c.estatus_pago, c.saldo_pendiente
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            ORDER BY c.fecha DESC, c.id DESC
        `;

        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener el historial de compras:', error);
        res.status(500).json({ error: 'Error interno al cargar las compras '});
    }
};


// OBTENER DEUDAS 
const obtenerDeudas = async (req, res) => {
    try{
        const query = `
            SELECT c.id, c.fecha, p.nombre AS proveedor, c.total_compra, c.saldo_pendiente
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            WHERE c.estatus_pago = 'pendiente' AND c.saldo_pendiente > 0
            ORDER BY c.fecha ASC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener deudas:', error);
        res.status(500).json({ error: 'Error interno al cargar las deudas' });
    }
};

// REGISTRAR ABONO
const registrarAbono = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto_abono } = req.body;

        const queryConsulta = 'SELECT saldo_pendiente FROM compras WHERE id = $1';
        const { rows: compras } = await pool.query(queryConsulta, [id]);

        if (compras.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const saldoActual = parseFloat(compras[0].saldo_pendiente);
        const abono = parseFloat(monto_abono);

        if (abono > saldoActual) {
            return res.status(400).json({ error: 'El abono no puede ser mayor al saldo que debes.' });
        }

        const nuevoSaldo = saldoActual - abono;
        const nuevoEstatus = nuevoSaldo <= 0 ? 'pagada' : 'pendiente';

        const queryUpdate = `
            UPDATE compras 
            SET saldo_pendiente = $1, estatus_pago = $2
            WHERE id = $3
            RETURNING id, saldo_pendiente, estatus_pago
        `;
        const { rows: actualizadas } = await pool.query(queryUpdate, [nuevoSaldo, nuevoEstatus, id]);

        res.json({ mensaje: 'Abono registrado correctamente', compra: actualizadas[0] });
    } catch (error) {
        console.error('Error al registrar el abono', error);
        res.status(500).json({ error: 'Error interno al procesar el pago' });
    }
};


// RESUMEN DE REPORTEs
const obtenerResumenReportes = async (req, res) => {
    try {
        // DEUDAS TOTALES
        const queryDeuda = `
            SELECT 
                COALESCE(SUM(saldo_pendiente), 0) AS deuda_total,
                COUNT(id) AS facturas_pendientes
            FROM compras
            WHERE estatus_pago = 'pendiente' AND saldo_pendiente > 0
        `;
        const { rows: resDeuda } = await pool.query(queryDeuda);

        // GASTO DEL MES ACTUAL Y FACTURAS
        const queryGastoActual = `
            SELECT 
                COALESCE(SUM(total_compra), 0) AS gasto_mes,
                COUNT(id) AS total_facturas
            FROM compras
            WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)
        `;
        const { rows: resGastoActual } = await pool.query(queryGastoActual);

        // GASTO DEL MES ANTERIOR
        const queryGastoAnterior = `
            SELECT COALESCE(SUM(total_compra), 0) AS gasto_mes_anterior
            FROM compras
            WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
        `;
        const { rows: resGastoAnterior } = await pool.query(queryGastoAnterior);

        // TOP PROVEEDORES (5 MAS COMPRADOS)
        const queryTopProveedores = `
            SELECT p.nombre, SUM(c.total_compra) as total_comprado
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            WHERE date_trunc('month', c.fecha) = date_trunc('month', CURRENT_DATE)
            GROUP BY p.id, p.nombre
            ORDER BY total_comprado DESC
            LIMIT 5
        `;
        const { rows: resTopProveedores } = await pool.query(queryTopProveedores);

        // ULTIMAS 5 COMPRAS
        const queryUltimasCompras = `
            SELECT c.id, c.fecha, p.nombre AS proveedor, c.total_compra, c.estatus_pago
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            ORDER BY c.fecha DESC, c.id DESC
            LIMIT 5
        `;

        // GASTOS DE LA SEMANA ACTUAL (Lunes a Domingo)
        const querySemana = `
            SELECT 
                EXTRACT(ISODOW FROM fecha) AS dia_indice,
                COALESCE(SUM(total_compra), 0) AS total_gastado
            FROM compras
            WHERE date_trunc('week', fecha) = date_trunc('week', CURRENT_DATE)
            GROUP BY dia_indice
            ORDER BY dia_indice ASC
        `;
        const { rows: resSemana } = await pool.query(querySemana);
        const { rows: resUltimasCompras } = await pool.query(queryUltimasCompras);

        // TOP PROVEEDORES DE LA SEMANA
        const queryTopProveedoresSemana = `
            SELECT p.nombre, SUM(c.total_compra) as total_comprado
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            WHERE date_trunc('week', c.fecha) = date_trunc('week', CURRENT_DATE)
            GROUP BY p.id, p.nombre
            ORDER BY total_comprado DESC
            LIMIT 5
        `;
        const { rows: resTopProveedoresSemana } = await pool.query(queryTopProveedoresSemana);

        // GASTOS DE LA SEMANA ANTERIOR
        const querySemanaAnterior = `
            SELECT 
                EXTRACT(ISODOW FROM fecha) AS dia_indice,
                COALESCE(SUM(total_compra), 0) AS total_gastado
            FROM compras
            WHERE date_trunc('week', fecha) = date_trunc('week', CURRENT_DATE - INTERVAL '1 week')
            GROUP BY dia_indice
            ORDER BY dia_indice ASC
        `;
        const { rows: resSemanaAnterior } = await pool.query(querySemanaAnterior);

        const gastoMes = parseFloat(resGastoActual[0].gasto_mes);
        const totalFacturas = parseInt(resGastoActual[0].total_facturas);
        const promedioFactura = totalFacturas > 0 ? (gastoMes / totalFacturas) : 0;

        res.json({
            deuda_total: resDeuda[0].deuda_total,
            facturas_pendientes: resDeuda[0].facturas_pendientes,
            gasto_mes: gastoMes,
            promedio_factura: promedioFactura,
            gasto_mes_anterior: parseFloat(resGastoAnterior[0].gasto_mes_anterior),
            proveedor_top: resTopProveedores.length > 0 ? resTopProveedores[0].nombre : 'Ninguno aún',
            grafica_proveedores: resTopProveedores,
            grafica_proveedores_semana: resTopProveedoresSemana, 
            ultimas_compras: resUltimasCompras, 
            grafica_semana: resSemana,
            grafica_semana_anterior: resSemanaAnterior
        });
    } catch (error) {
        console.error('Error al obtener reporte', error);
        res.status(500).json({ error: 'Error interno al cargar reportes' });
    } 
};

// ACTUALIZAR PROOVEDOR
const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, dias_visita } = req.body;

        const query = `
            UPDATE proveedores
            SET nombre = $1, telefono = $2, dias_visita = $3
            WHERE id = $4 RETURNING *
        `;

        const { rows } = await pool.query(query, [nombre, telefono, dias_visita, id ]);

        if (rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json({ mensaje: 'Proveedor actualizado con éxito', proveedor: rows[0] });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ error: 'Error interno al actualizar' });
    }
};

// ELIMINAR PROVEEDOR
const eliminarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE proveedores SET activo = FALSE WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json({ mensaje: 'Proveedor eliminado del directorio' });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({ error: 'Error interno al eliminar' });
    }
};

module.exports = {
    obtenerAgendaDia, 
    actualizarVisita,
    generarAgendaHoy, 
    obtenerProveedores, 
    crearProveedor,
    registrarCompra,
    obtenerCompras, 
    obtenerDeudas,
    registrarAbono,
    obtenerResumenReportes,
    actualizarProveedor,
    eliminarProveedor
};