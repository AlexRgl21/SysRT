// Uso:  node scripts/hashear_pines.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/configuracion/base_datos');

const yaEsHash = (valor) => typeof valor === 'string' && valor.startsWith('$2');

async function hashearPines() {
    try {
        const { rows: usuarios } = await pool.query('SELECT id, nombre, pin FROM usuarios');

        let actualizados = 0;

        for (const usuario of usuarios) {
            if (yaEsHash(usuario.pin)) {
                console.log(`- ${usuario.nombre}: ya tiene un PIN hasheado, se omite.`);
                continue;
            }

            const pinHasheado = await bcrypt.hash(String(usuario.pin), 10);
            await pool.query('UPDATE usuarios SET pin = $1 WHERE id = $2', [pinHasheado, usuario.id]);
            console.log(`✓ ${usuario.nombre}: PIN hasheado correctamente.`);
            actualizados++;
        }

        console.log(`\nListo. ${actualizados} usuario(s) actualizado(s) de ${usuarios.length} total.`);
    } catch (error) {
        console.error('Error al hashear los PINs:', error);
    } finally {
        await pool.end();
    }
}

hashearPines();