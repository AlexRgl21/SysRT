const API_URL = 'http://localhost:3000/api/productos';

const tbody = document.getElementById('tablaProductos');

// Función principal para extraer y renderizar los productos
const cargarInventario = async() => {
    try{
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error('Error al conectar con el servidor');
        }

        const productos = await respuesta.json();

        tbody.innerHTML = '';

        if (productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No hay productos activos en el inventario.</td></tr>';
            return;
        }

        productos.forEach(producto => {
            const codigoMostrar = (producto.codigos && producto.codigos.length > 0)
            ? producto.codigos[0]
            : 'Sin Código';

        const fila = document.createElement('tr');
            
            fila.innerHTML = `
                <td>${codigoMostrar}</td>
                <td><strong>${producto.nombre}</strong></td>
                <td>${producto.categoria ? producto.categoria : 'Sin categoría'}</td> <!-- NUEVO DATO -->
                <td>$${Number(producto.precio_compra).toFixed(2)}</td>
                <td>$${Number(producto.precio_venta).toFixed(2)}</td>
                <td>
                    <span class="${producto.stock_actual < 10 ? 'stock-bajo' : 'stock-normal'}">
                        ${producto.stock_actual}
                    </span>
                </td>
                <td>
                    <button onclick="editarProducto(${producto.id})" class="btn-editar">✏️</button>
                    <button onclick="eliminarProducto(${producto.id})" class="btn-eliminar">🗑️</button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar el inventario. Verifica que el backend esté encendido.</td></tr>';
    }
};

// Función para el borrado logico
const eliminarProducto = async (id) => {
    
    if (!confirm('¿Estás seguro de que deseas dar de baja este producto?')) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (respuesta.ok) {
            alert('Producto eliminado lógicamente');
            cargarInventario(); 
        } else {
            alert('Hubo un problema al eliminar el producto');
        }
    } catch (error) {
        console.error('Error en la petición DELETE:', error);
    }
};

document.addEventListener('DOMContentLoaded', cargarInventario);