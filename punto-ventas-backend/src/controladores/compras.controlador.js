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
        const query = `
            INSERT INTO registro_visita (proveedor_id, fecha_visita)
            SELECT id, CURRENT_DATE
            FROM proveedores
            WHERE activo = TRUE
            ON CONFLICT (proveedor_id, fecha_visita) DO NOTHING
            RETURNING id;
        `;
        const { rows } = await pool.query(query);
        
        res.json({ 
            mensaje: 'Agenda generada exitosamente', 
            nuevosRegistros: rows.length 
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

module.exports = {
    obtenerAgendaDia, 
    actualizarVisita,
    generarAgendaHoy, 
    obtenerProveedores, 
    crearProveedor
};