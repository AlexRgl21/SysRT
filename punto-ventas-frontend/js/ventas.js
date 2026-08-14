// CARRITO DE VENTAS Y MODAL DE COBRO

const API_URL = 'http://localhost:3000/api';

let carrito = [];
let totalConComision = 0; 
let productoEnEspera = null;


const categoriasPrecioVariable = ['Carnes Frías', 'Recargas', 'Frutas y verduras'];
// ELEMENTOS DEL DOM - PANEL PRINCIPAL
const inputEscanner = document.getElementById('inputEscanerVenta');
const tablaCarrito = document.getElementById('tablaCarrito');
const spanTotalVenta = document.getElementById('displayTotal');
const btnProcederPago = document.getElementById('btnProcesarVenta'); 

const modalCobro = document.getElementById('modalCobro');
const btnCerrarModal = document.getElementById('btnCerrarModal');
const modalSubtotal = document.getElementById('modalSubtotal');
const filaComision = document.getElementById('filaComision');
const modalComision = document.getElementById('modalComision');
const modalTotalFinal = document.getElementById('modalTotalFinal');
const selectMetodoPagoModal = document.getElementById('selectMetodoPagoModal');
const seccionEfectivoModal = document.getElementById('seccionEfectivoModal');
const inputEfectivoModal = document.getElementById('inputEfectivoModal');
const displayCambioModal = document.getElementById('displayCambioModal');
const btnConfirmarPago = document.getElementById('btnConfirmarPago'); 
const modalPrecioVariable = document.getElementById('modalPrecioVariable');
const btnCerrarModalPrecio = document.getElementById('btnCerrarModalPrecio');
const btnConfirmarPrecio = document.getElementById('btnConfirmarPrecio');
const inputPrecioVariable = document.getElementById('inputPrecioVariable');
const textoProductoVariable = document.getElementById('textoProductoVariable');
const btnCancelarVenta = document.getElementById('btnCancelarVenta')


// LÓGICA DEL CARRITO Y ESCÁNER

async function buscarYAgregarProducto(codigo) {
    try {
        const respuesta = await fetch(`${API_URL}/productos/codigo/${codigo}`);

        if (!respuesta.ok) {
            Toastify({
                text: "Producto no encontrado o código inválido",
                duration: 3000,
                gravity: "top",
                position: "center",
                style: { background: "#f59e0b"}
            }).showToast();
            return;
        }

        const producto = await respuesta.json();
        producto.codigo = producto.codigo || codigo;

        if (categoriasPrecioVariable.includes(producto.categoria)) {
            productoEnEspera = producto;
            textoProductoVariable.innerHTML = `Producto: <strong>${producto.nombre}</strong>`;
            inputPrecioVariable.value = '';
            
            modalPrecioVariable.classList.add('modal-activo');
            setTimeout(() => inputPrecioVariable.focus(), 100); 
        } else {
            agregarAlCarrito(producto);
        }
    } catch (error) {
        console.error('Error al buscar el producto:', error);
        Toastify({
            text: "Error de conexión con el servidor.",
            duration: 3000,
            gravity: "top",
            position: "center",
            style: { background: "#ef4444" }
        }).showToast();
    }
}

const agregarAlCarrito = (producto) => {
    const index = carrito.findIndex(item => item.id === producto.id);

    const stockDisponible = Number(producto.stock_actual) || 0;
    if (index !== -1) {
        if (carrito[index].cantidad + 1 > stockDisponible) {
            Toastify({
                text: `¡Stock insuficiente para "${producto.nombre}"!\nLímite: ${stockDisponible}`,
                duration: 4000,
                gravity: "top", 
                position: "center",
                style: { background: "#ef4444"}
            }).showToast();
            return;  
        }
        carrito[index].cantidad += 1;
    } else {

        if (1 > stockDisponible) {
            Toastify({
                text: `El producto "${producto.nombre}" está agotado.`,
                duration: 4000,
                gravity: "top",
                position: "center",
                style: { background: "#ef4444"}
            }).showToast();
        }

        carrito.push({
            id: producto.id,
            codigo: producto.codigo || 'S/N',
            nombre: producto.nombre,
            precio_venta: Number(producto.precio_venta),
            cantidad: 1, 
            stock_actual: stockDisponible
        });
    }
    renderizarCarrito();
};

const renderizarCarrito = () => {
    tablaCarrito.innerHTML = '';
    let totalAcumulado = 0;

    if (carrito.length === 0) {
        tablaCarrito.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">El carrito está vacío. Escanea un producto.</td></tr>`;
        spanTotalVenta.textContent = '$0.00';
        return;
    }

    carrito.forEach((item, index) => {
        const subtotal = item.cantidad * item.precio_venta;
        totalAcumulado += subtotal;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${item.codigo}</td>
            <td><strong>${item.nombre}</strong></td>
            <td style="text-align: center;">
                <div class="control-cantidad">
                    <button class="btn-restar" onclick="cambiarCantidad(${index}, -1)">-</button>
                    <input type="number" value="${item.cantidad}" readonly>
                    <button class="btn-sumar" onclick="cambiarCantidad(${index}, 1)">+</button>
                </div>
            </td>
            <td>$${item.precio_venta.toFixed(2)}</td>
            <td><strong>$${subtotal.toFixed(2)}</strong></td>
            <td style="text-align: center;">
                <button class="btn-eliminar-fila" onclick="eliminarDelCarrito(${index})" title="Quitar del carrito">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </td>
        `;
        tablaCarrito.appendChild(fila);
    });

    spanTotalVenta.textContent = `$${totalAcumulado.toFixed(2)}`;
};

window.cambiarCantidad = (index, delta) => {
    const item = carrito[index];

    if (delta > 0) {
        if (item.cantidad + delta > item.stock_actual) {
            Toastify({
                text: `Limite alcanzado. No puedes agregar más de ${item.stock_actual} unidades.`,
                duration: 3000,
                gravity: "top",
                position: "center",
                style: { background: "#f59e0b"}
            }).showToast();
            return; 
        }
    }
    carrito[index].cantidad += delta;
    
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    renderizarCarrito();
};

window.eliminarDelCarrito = (index) => {
    carrito.splice(index, 1);
    renderizarCarrito();
    if (inputEscanner) inputEscanner.focus();
};

if (inputEscanner) {
    inputEscanner.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const codigo = inputEscanner.value.trim();
            if (codigo) {
                buscarYAgregarProducto(codigo);
                inputEscanner.value = ''; 
            }
        }
    });
}


// LÓGICA DEL MODAL Y COBRO FINAL

if (btnProcederPago) {
    btnProcederPago.addEventListener('click', () => {
        if (carrito.length === 0) {
            Toastify({
                text: "El carrito está vacío. Agrega productos antes de cobrar.",
                duration: 3000,
                gravity: "top", 
                position: "center",
                style: { background: "#f59e0b" } // Naranja
            }).showToast();
            return;
        }

        const subtotal = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
        totalConComision = subtotal; // Inicializamos con el subtotal normal

        // Llenar textos del modal
        modalSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        modalTotalFinal.textContent = `$${subtotal.toFixed(2)}`;
        
        // Resetear la vista del modal a efectivo por defecto
        selectMetodoPagoModal.value = 'efectivo';
        seccionEfectivoModal.style.display = 'block';
        filaComision.style.display = 'none';
        inputEfectivoModal.value = '';
        displayCambioModal.textContent = '$0.00';

        modalCobro.classList.add('modal-activo');
    });
}

// CERRAR MODAL
if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
        modalCobro.classList.remove('modal-activo');
        if (inputEscanner) inputEscanner.focus();
    });
}

// DETECTAR MÉTODO DE PAGO Y APLICAR 5%
if (selectMetodoPagoModal) {
    selectMetodoPagoModal.addEventListener('change', (e) => {
        const subtotal = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
        
        if (e.target.value === 'tarjeta') {
            const comision = subtotal * 0.05; // 5% extra
            totalConComision = subtotal + comision;
            
            modalComision.textContent = `$${comision.toFixed(2)}`;
            filaComision.style.display = 'block';
            seccionEfectivoModal.style.display = 'none'; // Sin cambio en tarjeta
        } else {
            totalConComision = subtotal;
            filaComision.style.display = 'none';
            seccionEfectivoModal.style.display = 'block';
        }
        
        modalTotalFinal.textContent = `$${totalConComision.toFixed(2)}`;
    });
}

// CALCULAR CAMBIO EN EL MODAL
if (inputEfectivoModal) {
    inputEfectivoModal.addEventListener('input', () => {
        const recibido = Number(inputEfectivoModal.value) || 0;
        const cambio = recibido - totalConComision;
        displayCambioModal.textContent = cambio >= 0 ? `$${cambio.toFixed(2)}` : '$0.00';
    });
}

// CONFIRMAR Y ENVIAR AL BACKEND
if (btnConfirmarPago) {
    btnConfirmarPago.addEventListener('click', async () => {
        if (selectMetodoPagoModal.value === 'efectivo') {
            const recibido = Number(inputEfectivoModal.value) || 0;
            if (recibido < totalConComision) {
                Toastify({
                    text: "El monto recibido es menor al total a pagar.",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: { background: "#ef4444" }
                }).showToast();
                return;
            }
        }
        btnConfirmarPago.disabled = true;
        const textoOriginal = btnConfirmarPago.textContent;
        btnConfirmarPago.textContent = 'Procesando...';

        const datosVenta = {
            usuario_id: 1, 
            metodo_pago: selectMetodoPagoModal.value,
            total: totalConComision, // Enviamos el total ya afectado por la comisión
            productos: carrito.map(item => ({
                id: item.id,
                cantidad: item.cantidad,
                precio_venta: item.precio_venta
            }))
        };

        try {
            const respuesta = await fetch(`${API_URL}/ventas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosVenta)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                Swal.fire('Error', `Error al procesar la venta: ${resultado.mensaje || 'Error desconocido'}`, 'error');
                return;
            }

            await Swal.fire({
                title: '¡Cobro Exitoso!',
                text: `Ticket #${resultado.venta_id} registrado correctamente.`,
                icon: 'success',
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Aceptar'
            })
            
            // Éxito: Limpiamos todo y cerramos el modal
            carrito = [];
            renderizarCarrito();
            modalCobro.classList.remove('modal-activo');

            if (inputEscanner) inputEscanner.focus();

        } catch (error) {
            console.error('Error de red al procesar el cobro:', error);
            Swal.fire('Error de Conexión', 'No se pudo conectar con el servidor para procesar el cobro.', 'error');
        } finally {
            btnConfirmarPago.disabled = false;
            btnConfirmarPago.textContent = textoOriginal;
        }
    });
}


// LOGICA DEL MODAL DE PRECIO VARIABLE
if (btnCerrarModalPrecio) {
    btnCerrarModalPrecio.addEventListener('click', () => {
        modalPrecioVariable.classList.remove('modal-activo');
        productoEnEspera = null;
    });
}

if (btnConfirmarPrecio) {
    btnConfirmarPrecio.addEventListener('click', () => {
        const nuevoPrecio = Number(inputPrecioVariable.value);
        
        if (nuevoPrecio <= 0) {
            Toastify({
                text: "Por favor ingresa un monto válido mayor a $0.00",
                duration: 3000,
                gravity: "top", 
                position: "center",
                style: { background: "#f59e0b" }
            }).showToast();
            return;
        }

        productoEnEspera.precio_venta = nuevoPrecio;
        
        agregarAlCarrito(productoEnEspera);
        
        modalPrecioVariable.classList.remove('modal-activo');
        productoEnEspera = null;
        if (inputEscanner) inputEscanner.focus();
    });
}

if (inputPrecioVariable) {
    inputPrecioVariable.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnConfirmarPrecio.click();
        }
    });
}

// LOGICA PARA CANCELAR LA VENTA
if (btnCancelarVenta) {
    btnCancelarVenta.addEventListener('click', async () => {
        if (carrito.length === 0) {
            Toastify({
                text: "No hay productos en la venta actual.",
                duration: 3000,
                gravity: "top", position: "center",
                style: { background: "#f59e0b" }
            }).showToast();
            return;
        }

        const confirmacion = await Swal.fire({
            title: '¿Cancelar toda la venta?',
            text: "Se vaciará el carrito y tendrás que escanear todo de nuevo.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', 
            cancelButtonColor: '#64748b',  
            confirmButtonText: 'Sí, cancelar venta',
            cancelButtonText: 'Volver'
        });

        if (confirmacion.isConfirmed) {
            carrito = [];

            renderizarCarrito();

            Toastify({
                text: "Venta cancelada.",
                duration: 3000,
                gravity: "top", position: "center",
                style: { background: "#64748b" }
            }).showToast();

            if (inputEscanner) {
                inputEscanner.focus();
            }
        }
    });

}