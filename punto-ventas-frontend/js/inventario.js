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



// Lógica de la Ventana Modal
const btnNuevoProducto = document.getElementById('btnNuevoProducto');
const modalProducto = document.getElementById('modalProducto');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const inputCodigoBuscador = document.getElementById('inputCodigoBuscador');

btnNuevoProducto.addEventListener('click', () => {

    modalProducto.classList.remove('oculto');
    
    setTimeout(() => {
        inputCodigoBuscador.focus();
    }, 100); 
});

 btnCerrarModal.addEventListener('click', () => {
    modalProducto.classList.add('oculto');
    inputCodigoBuscador.value = '';
    
    seccionEscaner.classList.remove('oculto');
    seccionIngresoStock.classList.add('oculto');
    seccionNuevoProducto.classList.add('oculto');
});

modalProducto.addEventListener('click', (evento) => {
    if (evento.target === modalProducto) {
        modalProducto.classList.add('oculto');
        inputCodigoBuscador.value = '';
    }
});



// Lógica de Búsqueda 
const btnBuscarCodigo = document.getElementById('btnBuscarCodigo');
const seccionEscaner = document.getElementById('seccionEscaner');
const seccionIngresoStock = document.getElementById('seccionIngresoStock');
const seccionNuevoProducto = document.getElementById('seccionNuevoProducto');
const nombreProductoExistente = document.getElementById('nombreProductoExistente');
const inputNuevoCodigo = document.getElementById('inputNuevoCodigo');

btnBuscarCodigo.addEventListener('click', async () => {
    const codigo = inputCodigoBuscador.value.trim();

    if (!codigo) {
        alert('Por favor, ingresa un código de barras.');
        return;
    }

    try {
        const respuesta = await fetch(`http://localhost:3000/api/productos/codigo/${codigo}`);

        if (respuesta.ok) {
            const producto = await respuesta.json();
            
            seccionEscaner.classList.add('oculto');
            seccionIngresoStock.classList.remove('oculto');
            
            nombreProductoExistente.textContent = producto.nombre;
            
            document.getElementById('btnGuardarStock').dataset.productoId = producto.id; 

        } else if (respuesta.status === 404) {
            seccionEscaner.classList.add('oculto');
            seccionNuevoProducto.classList.remove('oculto');
            
            inputNuevoCodigo.value = codigo;
        } else {
            alert('Error al procesar la solicitud en el servidor.');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Error al conectar con el servidor.');
    }
});

// ALTA DE PRODUCTO 

const btnGuardarNuevoProducto = document.getElementById('btnGuardarNuevoProducto');

btnGuardarNuevoProducto.addEventListener('click', async () => {
    const codigo = inputNuevoCodigo.value; 
    const nombre = document.getElementById('inputNuevoNombre').value.trim();
    const categoria_id = document.getElementById('selectNuevaCategoria').value;
    const precio_compra = document.getElementById('inputNuevoPrecioCompra').value;
    const precio_venta = document.getElementById('inputNuevoPrecioVenta').value;

    if (!nombre || !precio_compra || !precio_venta) {
        alert('Por favor, completa el nombre y los precios del producto.');
        return;
    }

    const nuevoProducto = {
        nombre: nombre,
        categoria_id: parseInt(categoria_id),
        precio_compra: parseFloat(precio_compra),
        precio_venta: parseFloat(precio_venta),
        stock_actual: 0, 
        codigo: codigo
    };

    try {
        const respuesta = await fetch('http://localhost:3000/api/productos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoProducto)
        });

        if (respuesta.ok) {
            alert('¡Producto registrado exitosamente en el catálogo!');
            
            modalProducto.classList.add('oculto');
            document.getElementById('inputNuevoNombre').value = '';
            document.getElementById('inputNuevoPrecioCompra').value = '';
            document.getElementById('inputNuevoPrecioVenta').value = '';
            inputCodigoBuscador.value = '';
            
            seccionEscaner.classList.remove('oculto');
            seccionNuevoProducto.classList.add('oculto');

            cargarInventario();
            
        } else {
            const error = await respuesta.json();
            alert(`Hubo un problema: ${error.mensaje}`);
        }
    } catch (error) {
        console.error('Error al guardar el producto:', error);
        alert('Error al conectar con el servidor para guardar el producto.');
    }
});