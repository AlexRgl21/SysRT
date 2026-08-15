const API_URL = 'http://localhost:3000/api/productos';

const tbody = document.getElementById('tablaProductos');
let listaProductosGlobal = [];

let paginaActual = 1;
const filasPorPagina = 15;

/// Función encargada de dibujar las filas en el HTML
const actualizarEstadisticas = (productos) => {
    const total = productos.length;
    // Si tiene más de 0, está en stock (sano o bajo)
    const enStock = productos.filter(p => Number(p.stock_actual) > 0).length;
    // Consideramos stock bajo si tiene 10 o menos unidades
    const stockBajo = productos.filter(p => Number(p.stock_actual)  > 0 && Number(p.stock_actual) <= 10).length;
    const agotados = productos.filter (p => Number(p.stock_actual) === 0).length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statConStock').textContent = enStock;
    document.getElementById('statStockBajo').textContent = stockBajo;
    document.getElementById('statAgotados').textContent = agotados;
};

const renderizarPaginacion = (totalItems) => {
    const totalPaginas = Math.ceil(totalItems / filasPorPagina) || 1;
    const controles = document.getElementById('controlesPaginacion');
    const texto = document.getElementById('textoPaginacion');

    const inicioText = totalItems === 0 ? 0 : ((paginaActual - 1) * filasPorPagina) + 1;
    const finText = Math.min(paginaActual * filasPorPagina, totalItems);
    
    texto.textContent = `Mostrando ${inicioText}-${finText} de ${totalItems}`;
    controles.innerHTML = '';

    // Botón Anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.innerHTML = '&larr;';
    btnAnterior.className = 'btn-pagina';
    btnAnterior.disabled = paginaActual === 1;
    btnAnterior.onclick = () => { if(paginaActual > 1) { paginaActual--; renderizarTabla(listaFiltradaGlobal); } }; 
    controles.appendChild(btnAnterior);

    // Números
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `btn-pagina ${i === paginaActual ? 'activa' : ''}`;
        btn.onclick = () => { paginaActual = i; renderizarTabla(listaFiltradaGlobal); };
        controles.appendChild(btn);
    }

    // Botón Siguiente
    const btnSiguiente = document.createElement('button');
    btnSiguiente.innerHTML = '&rarr;';
    btnSiguiente.className = 'btn-pagina';
    btnSiguiente.disabled = paginaActual === totalPaginas;
    btnSiguiente.onclick = () => { if(paginaActual < totalPaginas) { paginaActual++; renderizarTabla(listaFiltradaGlobal); } };
    controles.appendChild(btnSiguiente);
};

const renderizarTabla = (productos = listaFiltradaGlobal.length > 0 ? listaFiltradaGlobal : listaProductosGlobal) => {
    tbody.innerHTML = '';

    // Las estadísticas siempre se basan en el catálogo global
    actualizarEstadisticas(listaProductosGlobal);

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No se encontraron productos.</td></tr>';
        renderizarPaginacion(0);
        return;
    }

    // Calcular el segmento de productos que toca mostrar en la página actual
    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const productosPaginados = productos.slice(inicio, fin);

    productosPaginados.forEach(producto => {
        const codigoMostrar = (producto.codigos && producto.codigos.length > 0)
            ? producto.codigos[0]
            : 'Sin Código';

        const stockNum = Number(producto.stock_actual);

        const claseStock = stockNum <= 10 ? 'stock-bajo' : 'stock-normal';

        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${codigoMostrar}</td>
            <td><strong>${producto.nombre}</strong></td>
            <td>${producto.categoria ? producto.categoria : 'Sin categoría'}</td>
            <td>$${Number(producto.precio_compra).toFixed(2)}</td>
            <td>$${Number(producto.precio_venta).toFixed(2)}</td>
            <td style="text-align: center;"> 
                <span class="${claseStock}">
                    ${stockNum}
                </span>
            </td>
            <td>
                <div style="display: flex; justify-content: center; gap: 8px; align-items: center;">
                    <!-- Tus SVG de editar y eliminar se mantienen idénticos -->
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

    renderizarPaginacion(productos.length);
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
    
    const confirmacion = await Swal.fire({
        title: '¿Dar de baja el producto?',
        text: "El producto se ocultará de la pagina principal.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (respuesta.ok) {
            Toastify({
                text: "Producto eliminado correctamente.",
                duration: 3000,
                gravity: "top",
                position: "center",
                style: { background: "#10b981"}
            }).showToast();

            cargarInventario(); 
        } else {
            Swal.fire('Error', 'Hubo un problema al eliminar el producto', 'error');
        }
    } catch (error) {
        console.error('Error en la petición DELETE:', error);
        Toastify({
            text: "Error de conexión",
            duration: 3000,
            style: { background: "#ef4444"}
        }).showToast();
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
        Toastify({
            text: "Por favor, completa el nombre y los precios",
            duration: 3000,
            gravity: "buttom", 
            position: "center",
            style: { background: "#f59e0b" }
        }).showToast();
        return;
    }

    if (parseFloat(precio_compra) < 0 || parseFloat(precio_venta) < 0) {
        Toastify({
            text: "Los precios no pueden ser números negativos",
            duration: 3000,
            gravity: "top", 
            position: "center",
            style: { background: "#ef4444" }
        }).showToast();
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
            Toastify({
                text: "¡Producto registrado exitosamente!",
                duration: 3000,
                gravity: "top", 
                position: "center",
                style: { background: "#10b981" }
            }).showToast();
            
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
            Swal.fire('Error', `Hubo un problema: ${error.mensaje}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar el producto:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
});


// INGRESO DE STOCK A PRODCUTO EXISTENTE 
const btnGuardarStock = document.getElementById('btnGuardarStock');

btnGuardarStock.addEventListener('click', async () => {
    const productoId = btnGuardarStock.dataset.productoId;

    const cantidadInput = document.getElementById('inputNuevasUnidades').value;
    const cantidad = parseInt(cantidadInput);

    if (!cantidad || cantidad <= 0) {
        Toastify({
            text: "Ingresa una cantidad valida mayor a cero",
            duration: 3000,
            gravity: "top",
            position: "center",
            style: { background: "#f59e0b" }
        }).showToast();
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
            Toastify({
                text: "¡Inventario actualizado exitosamente!",
                duration: 3000,
                gravity: "top",
                position: "center",
                style: { background: "#10b981" }
            }).showToast();

            modalProducto.classList.add('oculto');
            document.getElementById('inputNuevasUnidades').value = '1';
            inputCodigoBuscador.value = '';

            seccionEscaner.classList.remove('oculto');
            seccionIngresoStock.classList.add('oculto');

            cargarInventario();

        } else {
            const error = await respuesta.json();
            Swal.fire('Error', `Hubo un problema: ${error.mensaje}`, 'error');
        } 
    } catch (error) {
        console.error('Error al actualizar el stock:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
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
        Toastify({
            text: "Por favor, completa el nombre y ambos precios",
            duration: 3000,
            gravity: "top",
            position: "center",
            style: { background: "#f59e0b"}
        }).showToast();
        return;
    }

    if (parseFloat(precio_compra) < 0 || parseFloat(precio_venta) < 0) {
        Toastify({
            text: "Los precios no pueden ser números negativos",
            duration: 3000,
            gravity: "top", 
            position: "center",
            style: { background: "#ef4444" }
        }).showToast();
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
            Toastify({
                text: "¡Producto actualizado correctamente!",
                duration: 3000,
                gravity: "top", 
                position: "center", 
                style: { background: "#10b981"}
            }).showToast();
            
            document.getElementById('modalProducto').classList.add('oculto');
            document.getElementById('seccionEditarProducto').classList.add('oculto');
            document.getElementById('seccionEscaner').classList.remove('oculto'); 
            
            cargarInventario();
        } else {
            const error = await respuesta.json();
            Swal.fire('Error', `Hubo un problema: ${error.mensaje}`, 'error');
        }
    } catch (error) {
        console.error('Error al actualizar:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
});


// Función para descargar y pintar las categorías dinámicamente
const cargarCategorias = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/categorias');
        if (!respuesta.ok) throw new Error('Error al conectar');
        
        const categorias = await respuesta.json();
        
        const selectFiltro = document.getElementById('selectFiltroCategoria');
        const selectNueva = document.getElementById('selectNuevaCategoria');

        selectNueva.innerHTML = '<option value="" disabled selected>Selecciona una categoría</option>';
        selectFiltro.innerHTML = '<option value="todas">Todas las categorías</option>';
        
        categorias.forEach(cat => {
            selectNueva.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
        });

        categorias.forEach(cat => {
            selectFiltro.innerHTML += `<option value="${cat.nombre}">${cat.nombre}</option>`;
        });

    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    cargarInventario();
    cargarCategorias(); 
});


// Filtros Múltiples (Texto + Categoría)
const inputBuscadorTabla = document.getElementById('inputBuscadorTabla');
const selectFiltroCategoria = document.getElementById('selectFiltroCategoria');

const filtrarTabla = () => {
    const terminoBusqueda = inputBuscadorTabla.value.toLowerCase();
    const categoriaSeleccionada = selectFiltroCategoria.value;

    const productosFiltrados = listaProductosGlobal.filter(producto => {
        
        // Verificamos si coincide el texto (nombre o código)
        const nombre = producto.nombre.toLowerCase();
        const codigo = (producto.codigos && producto.codigos.length > 0) ? producto.codigos[0].toLowerCase() : '';
        const coincideTexto = nombre.includes(terminoBusqueda) || codigo.includes(terminoBusqueda);

        // Verificamos si coincide la categoría
        const categoriaProducto = producto.categoria ? producto.categoria : 'Sin categoría';
        const coincideCategoria = categoriaSeleccionada === 'todas' || categoriaProducto === categoriaSeleccionada;

        return coincideTexto && coincideCategoria;
    });

    listaFiltradaGlobal = productosFiltrados;
    renderizarTabla(listaFiltradaGlobal);
};

inputBuscadorTabla.addEventListener('input', filtrarTabla);
selectFiltroCategoria.addEventListener('change', filtrarTabla);