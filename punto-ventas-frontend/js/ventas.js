// CARRITO DE VENTAS 

let carrito = [];

const inputEscanner = document.getElementById('inputEscanerVenta');
const tablaCarrito = document.getElementById('tablaCarrito');
const spanTotalVenta = document.getElementById('displayTotal');
const btnCobrar = document.getElementById('btnProcesarVenta');
const selectMetodoPago = document.getElementById('selectMetodoPago');
const inputEfectivoRecibido = document.getElementById('inputEfectivoRecibido');
const displayCambio = document.getElementById('displayCambio');

// BUSCAR PRODUCTO POR CÓDIGO DE BARRAS (ESCÁNER)
async function buscarYAgregarProducto(codigo) {
    try {
        const respuesta = await fetch(`http://localhost:3000/api/productos/codigo/${codigo}`);

        if (!respuesta.ok) {
            alert('Producto no encontrado en el inventario o código inválido.');
            return;
        }

        const producto = await respuesta.json();
        agregarAlCarrito(producto);
    } catch (error) {
        console.error('Error al buscar el producto:', error);
        alert('Error de conexión con el servidor.');
    }
}

// GREGAR PRODUCTO EN EL CARRITO
const agregarAlCarrito = (producto) => {
    const index = carrito.findIndex(item => item.id === producto.id);

    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            codigo: producto.codigo || 'S/N',
            nombre: producto.nombre,
            precio_venta: Number(producto.precio_venta),
            cantidad: 1
        });
    }

    renderizarCarrito();
};

// RENDERIZAR LOS PRODUCTOS EN LA TABLA 
const renderizarCarrito = () => {
    tablaCarrito.innerHTML = '';
    let totalAcumulado = 0;

    if (carrito.length === 0) {
        tablaCarrito.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">El carrito está vacío. Escanea un producto.</td></tr>`;
        spanTotalVenta.textContent = '$0.00';
        calcularCambio(0);
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
    calcularCambio(totalAcumulado);
};

// MODIFICAR CANTIDAD DESDE LOS BOTONES (+ / -)
window.cambiarCantidad = (index, delta) => {
    carrito[index].cantidad += delta;
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    renderizarCarrito();
};

// ELIMINAR PRODUCTO DEL CARRITO
window.eliminarDelCarrito = (index) => {
    carrito.splice(index, 1);
    renderizarCarrito();
};

// CALCULAR CAMBIO EN EFECTIVO
const calcularCambio = (total) => {
    const efectivoRecibido = Number(inputEfectivoRecibido.value) || 0;
    const cambio = efectivoRecibido - total;
    displayCambio.textContent = cambio >= 0 ? `$${cambio.toFixed(2)}` : '$0.00';
};

if (inputEfectivoRecibido) {
    inputEfectivoRecibido.addEventListener('input', () => {
        const totalActual = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
        calcularCambio(totalActual);
    });
}

// CAPTURAR CÓDIGO DE BARRAS AL PRESIONAR ENTER
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

// PROCESAR COBRO Y ENVIAR AL BACKEND
if (btnCobrar) {
    btnCobrar.addEventListener('click', async () => {
        if (carrito.length === 0) {
            alert('El carrito está vacío. Agrega productos antes de cobrar.');
            return;
        }

        const metodoPagoSelect = selectMetodoPago ? selectMetodoPago.value : 'efectivo';
        const totalGeneral = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);

        const datosVenta = {
            usuario_id: 1, 
            metodo_pago: metodoPagoSelect,
            total: totalGeneral,
            productos: carrito.map(item => ({
                id: item.id,
                cantidad: item.cantidad,
                precio_venta: item.precio_venta
            }))
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/ventas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosVenta)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                alert(`Error al procesar la venta: ${resultado.mensaje || 'Error desconocido'}`);
                return;
            }

            alert(`¡Venta cobrada con éxito! Ticket #${resultado.venta_id}`);
            
            carrito = [];
            renderizarCarrito();
            if (inputEfectivoRecibido) inputEfectivoRecibido.value = '';
            if (displayCambio) displayCambio.textContent = '$0.00';

        } catch (error) {
            console.error('Error de red al procesar el cobro:', error);
            alert('No se pudo conectar con el servidor para procesar el cobro.');
        }
    });
}