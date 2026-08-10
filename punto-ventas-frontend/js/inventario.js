const API_URL = 'http://localhost:3000/api/productos';

const tbody = document.getElementById('tablaProductos');
let listaProductosGlobal = [];

/// Función encargada de dibujar las filas en el HTML
const renderizarTabla = (productos) => {
    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No se encontraron productos.</td></tr>';
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
            <td>${producto.categoria ? producto.categoria : 'Sin categoría'}</td>
            <td>$${Number(producto.precio_compra).toFixed(2)}</td>
            <td>$${Number(producto.precio_venta).toFixed(2)}</td>
            <td>
                <span class="${producto.stock_actual < 10 ? 'stock-bajo' : 'stock-normal'}">
                    ${producto.stock_actual}
                </span>
            </td>
            <td>
                <div style="display: flex; justify-content: center; gap: 8px; align-items: center;">
                    <button onclick="editarProducto(${producto.id})" class="btn-editar" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button onclick="eliminarProducto(${producto.id})" class="btn-eliminar" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(fila);
    });
};

// Función principal para extraer los productos de la base de datos
const cargarInventario = async () => {
    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error('Error al conectar con el servidor');
        }

        const productos = await respuesta.json();
        listaProductosGlobal = productos; 

        renderizarTabla(listaProductosGlobal);

    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar el inventario. Verifica que el backend esté encendido.</td></tr>';
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
    document.getElementById('seccionEditarProducto').classList.add('oculto');
});

modalProducto.addEventListener('click', (evento) => {
    if (evento.target === modalProducto) {
        modalProducto.classList.add('oculto');
        inputCodigoBuscador.value = '';

        seccionEscaner.classList.remove('oculto');
        seccionIngresoStock.classList.add('oculto');
        seccionNuevoProducto.classList.add('oculto');
        document.getElementById('seccionEditarProducto').classList.add('oculto');
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


// INGRESO DE STOCK A PRODCUTO EXISTENTE 
const btnGuardarStock = document.getElementById('btnGuardarStock');

btnGuardarStock.addEventListener('click', async () => {
    const productoId = btnGuardarStock.dataset.productoId;

    const cantidadInput = document.getElementById('inputNuevasUnidades').value;
    const cantidad = parseInt(cantidadInput);

    if (!cantidad || cantidad <= 0) {
        alert('Por favor, ingresa una cantidad válida mayor a cero.');
        return;
    }

    try {
        const respuesta = await fetch(`http://localhost:3000/api/productos/${productoId}/entrada`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cantidad: cantidad })
        });

        if (respuesta.ok) {
            alert('¡Inventario actualizado exitosamente!');

            modalProducto.classList.add('oculto');
            document.getElementById('inputNuevasUnidades').value = '1';
            inputCodigoBuscador.value = '';

            seccionEscaner.classList.remove('oculto');
            seccionIngresoStock.classList.add('oculto');

            cargarInventario();

        } else {
            const error = await respuesta.json();
            alert(`Hubo un problema: ${error.mensaje}`);
        } 
    } catch (error) {
        console.error('Error al actualizar el stock:', error);
        alert('Error al conectar con el servidor.');
    }
});


// MODIFICAR UN PRODUCTO 
window.editarProducto = (id) => {
    const producto = listaProductosGlobal.find(p => p.id === id);
    if (!producto) return;

    document.getElementById('inputEditarId').value = producto.id;
    document.getElementById('inputEditarNombre').value = producto.nombre;
    document.getElementById('inputEditarPrecioCompra').value = producto.precio_compra;
    document.getElementById('inputEditarPrecioVenta').value = producto.precio_venta;

    const btnGuardar = document.getElementById('btnGuardarEdicion');
    btnGuardar.dataset.categoriaId = producto.categoria_id;
    btnGuardar.dataset.stockActual = producto.stock_actual;

    // 4. Transformamos el modal
    document.getElementById('seccionEscaner').classList.add('oculto');
    document.getElementById('seccionIngresoStock').classList.add('oculto');
    document.getElementById('seccionNuevoProducto').classList.add('oculto');
    
    document.getElementById('seccionEditarProducto').classList.remove('oculto');
    document.getElementById('modalProducto').classList.remove('oculto');
};

document.getElementById('btnGuardarEdicion').addEventListener('click', async () => {
    const id = document.getElementById('inputEditarId').value;
    const nombre = document.getElementById('inputEditarNombre').value.trim();
    const precio_compra = document.getElementById('inputEditarPrecioCompra').value;
    const precio_venta = document.getElementById('inputEditarPrecioVenta').value;
    
    const btnGuardar = document.getElementById('btnGuardarEdicion');
    const categoria_id = btnGuardar.dataset.categoriaId;
    const stock_actual = btnGuardar.dataset.stockActual;

    if (!nombre || !precio_compra || !precio_venta) {
        alert('Por favor, completa el nombre y ambos precios.');
        return;
    }

    const productoActualizado = {
        nombre: nombre,
        categoria_id: categoria_id && categoria_id !== "null" ? parseInt(categoria_id) : null,
        precio_compra: parseFloat(precio_compra),
        precio_venta: parseFloat(precio_venta),
        stock_actual: parseFloat(stock_actual)
    };

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productoActualizado)
        });

        if (respuesta.ok) {
            alert('¡Producto actualizado exitosamente!');
            
            document.getElementById('modalProducto').classList.add('oculto');
            document.getElementById('seccionEditarProducto').classList.add('oculto');
            document.getElementById('seccionEscaner').classList.remove('oculto'); 
            
            cargarInventario();
        } else {
            const error = await respuesta.json();
            alert(`Hubo un problema: ${error.mensaje}`);
        }
    } catch (error) {
        console.error('Error al actualizar:', error);
        alert('Error al conectar con el servidor.');
    }
});


// Buscador 
const inputBuscadorTabla = document.getElementById('inputBuscadorTabla');

inputBuscadorTabla.addEventListener('input', (evento) => {
    const terminoBusqueda = evento.target.value.toLowerCase();

    const productosFiltrados = listaProductosGlobal.filter(producto => {
        const nombre = producto.nombre.toLowerCase();
        const codigo = (producto.codigos && producto.codigos.length > 0) ? producto.codigos[0].toLowerCase() : '';

        return nombre.includes(terminoBusqueda) || codigo.includes(terminoBusqueda);
    });

    renderizarTabla(productosFiltrados);
});