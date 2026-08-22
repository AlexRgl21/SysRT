

document.addEventListener('DOMContentLoaded', () => {
    const tabBotones = document.querySelectorAll('.tab-btn');
    const tabContenidos = document.querySelectorAll('.tab-contenido');
    const btnAccionPrincipal = document.getElementById('btnAccionPrincipal');

    tabBotones.forEach(boton => {
        boton.addEventListener('click', () => {

            tabBotones.forEach(btn => btn.classList.remove('activo'));
            tabContenidos.forEach(contenido => contenido.classList.remove('activo'));

            boton.classList.add('activo');

            const targetId = boton.getAttribute('data-target');
            const contenidoTarget = document.getElementById(targetId);

            if (contenidoTarget) {
                contenidoTarget.classList.add('activo');
            }

            if (btnAccionPrincipal) {
                if (targetId === 'tab-directorio') {
                    btnAccionPrincipal.textContent = '+ Nuevo Proveedor';
                    btnAccionPrincipal.style.display = 'block';
                }
                else if (targetId === 'tab-compras') {
                    btnAccionPrincipal.textContent = '+ Registrar Factura';
                    btnAccionPrincipal.style.display = 'block';
                }
                else if (targetId === 'tab-deudas') {
                    btnAccionPrincipal.textContent = '+ Registrar Abono';
                    btnAccionPrincipal.style.display = 'block';
                }
                else {
                    btnAccionPrincipal.style.display = 'none';
                }
            }
        });
    });

    const tabActivaInicial = document.querySelector('.tab-btn.activo');
    if (tabActivaInicial) {
        tabActivaInicial.click();
    }

    // MODALES
    const modalProveedor = document.getElementById('modalProveedor');
    const formNuevoProveedor = document.getElementById('formNuevoProveedor');
    const btnCerrarModalProveedor = document.getElementById('btnCerrarModalProveedor');
    const btnCancelarProveedor = document.getElementById('btnCancelarProveedor');
    const modalCompra = document.getElementById('modalCompra');
    const btnCerrarModalCompra = document.getElementById('btnCerrarModalCompra');
    const btnCancelarCompra = document.getElementById('btnCancelarCompra');


    btnAccionPrincipal.addEventListener('click', () => {
        const tabActiva = document.querySelector('.tab-btn.activo').getAttribute('data-target');

        if (tabActiva === 'tab-directorio') {
            document.getElementById('provId').value = ''; 
            document.getElementById('tituloModalProveedor').textContent = 'Registrar Nuevo Proveedor';
            modalProveedor.style.display = 'flex';
            document.getElementById('provNombre').focus();
        } else if (tabActiva === 'tab-compras') {
            modalCompra.style.display = 'flex';
            document.getElementById('compraProveedor').focus();
        } else if (tabActiva === 'tab-deudas') {
            modalAbono.style.display = 'flex';
            cargarFacturasAbonoSelect();
            document.getElementById('abonoFactura').focus();
        }
    });

    const cerrarModalProveedor = () => { modalProveedor.style.display = 'none'; formNuevoProveedor.reset(); };
    const cerrarModalCompra = () => { 
        modalCompra.style.display = 'none'; 
        document.getElementById('formNuevaCompra').reset(); 
        document.getElementById('divSaldoPendiente').style.display = 'none';
        document.getElementById('compraSaldo').required = false;
    };
    const cerrarModalAbono = () => { modalAbono.style.display = 'none'; document.getElementById('formNuevoAbono').reset(); };

    btnCerrarModalProveedor.addEventListener('click', cerrarModalProveedor);
    btnCancelarProveedor.addEventListener('click', cerrarModalProveedor);
    btnCerrarModalCompra.addEventListener('click', cerrarModalCompra);
    btnCancelarCompra.addEventListener('click', cerrarModalCompra);
    btnCancelarAbono.addEventListener('click', cerrarModalAbono);
    btnCerrarModalAbono.addEventListener('click', cerrarModalAbono);

    window.addEventListener('click', (e) => {
        if (e.target === modalProveedor) cerrarModalProveedor();
        if (e.target === modalCompra) cerrarModalCompra();
        if (e.target === modalAbono) cerrarModalAbono();
    });

    // FORMULARIO PROVEEDOR 
    formNuevoProveedor.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const idProveedor = document.getElementById('provId').value;
        const datosProveedor = {
            nombre: document.getElementById('provNombre').value.trim(),
            telefono: document.getElementById('provTelefono').value.trim(),
            dias_visita: document.getElementById('provDias').value.trim()
        };

        const url = idProveedor 
            ? `http://localhost:3000/api/proveedores/${idProveedor}` 
            : 'http://localhost:3000/api/proveedores';
        
        const metodo = idProveedor ? 'PUT' : 'POST';

        try {
            const respuesta = await fetchAutenticado(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosProveedor)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                cerrarModalProveedor();
                cargarDirectorio();
                cargarProveedoresSelect(); 
                
                Toastify({
                    text: idProveedor ? "¡Proveedor actualizado!" : "¡Proveedor registrado con éxito!",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: { background: "#10b981", borderRadius: "8px" }
                }).showToast();
            } else {
                throw new Error(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            Toastify({
                text: "Ocurrió un error al guardar.",
                duration: 3000,
                gravity: "top", position: "center",
                style: { background: "#ef4444", borderRadius: "8px" }
            }).showToast();
        }
    });

    //LOGICA PARA CARGAR EL DIRETORIO (BUSCADOR, PAGINACION Y ACCIONES)
    const bodyProveedores = document.getElementById('bodyProveedores');
    const inputBuscadorDirectorio = document.getElementById('buscadorDirectorio');
    const contenedorPaginacion = document.getElementById('paginacionDirectorio');

    let proveedoresGlobales = []; 
    let proveedoresFiltrados = []; 
    let paginaActual = 1;
    const elementosPorPagina = 10;

    inputBuscadorDirectorio.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        
        proveedoresFiltrados = proveedoresGlobales.filter(prov => 
            prov.nombre.toLowerCase().includes(termino) || 
            (prov.telefono && prov.telefono.toLowerCase().includes(termino))
        );
        
        paginaActual = 1; 
        renderizarTablaDirectorio();
    });

    const cargarDirectorio = async () => {
        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/proveedores');
            proveedoresGlobales = await respuesta.json();
            proveedoresFiltrados = [...proveedoresGlobales]; // Inicialmente mostramos todos
            
            paginaActual = 1;
            inputBuscadorDirectorio.value = ''; 
            
            renderizarTablaDirectorio();
        } catch (error) {
            console.error('Error al cargar los proveedores.', error);
            bodyProveedores.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ef4444;">Error al cargar el directorio.</td></tr>`;
        }
    };

    const renderizarTablaDirectorio = () => {
        bodyProveedores.innerHTML = '';
        contenedorPaginacion.innerHTML = '';

        if (proveedoresFiltrados.length === 0) {
            bodyProveedores.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">No se encontraron proveedores.</td></tr>`;
            return;
        }

        const inicio = (paginaActual - 1) * elementosPorPagina;
        const fin = inicio + elementosPorPagina;
        const proveedoresPagina = proveedoresFiltrados.slice(inicio, fin);

        proveedoresPagina.forEach(prov => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f1f5f9';

            tr.innerHTML = `
                <td style="padding: 15px; font-weight: 500; color: #1e293b;">${prov.nombre}</td>
                <td style="padding: 15px; color: #475569;">${prov.telefono || '-'}</td>
                <td style="padding: 15px; color: #475569;">${prov.dias_visita || '-'}</td>
                <td style="padding: 15px; text-align: right;">
                    <button class="btn-editar-prov" style="background: none; border: none; cursor: pointer; margin-right: 15px; display: inline-flex; align-items: center; justify-content: center;" title="Editar" data-id="${prov.id}" data-nombre="${prov.nombre}" data-telefono="${prov.telefono || ''}" data-dias="${prov.dias_visita || ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8ba0b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" onmouseover="this.style.stroke='#3b82f6'" onmouseout="this.style.stroke='#8ba0b2'" style="transition: 0.2s;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-eliminar-prov" style="background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" title="Eliminar" data-id="${prov.id}" data-nombre="${prov.nombre}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8ba0b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" onmouseover="this.style.stroke='#ef4444'" onmouseout="this.style.stroke='#8ba0b2'" style="transition: 0.2s;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </td>
            `;
            bodyProveedores.appendChild(tr);
        });

        renderizarControlesPaginacion();
    };

    const renderizarControlesPaginacion = () => {
        const totalPaginas = Math.ceil(proveedoresFiltrados.length / elementosPorPagina);
        if (totalPaginas <= 1) return; // Ocultar si todo cabe en una página

        const infoTexto = document.createElement('span');
        infoTexto.style.color = '#64748b';
        infoTexto.style.fontSize = '14px';
        infoTexto.style.marginRight = 'auto'; // Lo empuja a la izquierda
        const itemInicio = (paginaActual - 1) * elementosPorPagina + 1;
        const itemFin = Math.min(paginaActual * elementosPorPagina, proveedoresFiltrados.length);
        infoTexto.textContent = `Mostrando ${itemInicio} a ${itemFin} de ${proveedoresFiltrados.length}`;
        contenedorPaginacion.appendChild(infoTexto);

        // Botón Anterior
        const btnAnterior = document.createElement('button');
        btnAnterior.textContent = 'Anterior';
        btnAnterior.className = 'btn-secundario';
        btnAnterior.style.padding = '6px 12px';
        btnAnterior.style.fontSize = '13px';
        btnAnterior.disabled = paginaActual === 1;
        if (paginaActual === 1) btnAnterior.style.opacity = '0.5';
        btnAnterior.onclick = () => {
            if (paginaActual > 1) {
                paginaActual--;
                renderizarTablaDirectorio();
            }
        };
        contenedorPaginacion.appendChild(btnAnterior);

        // Botón Siguiente
        const btnSiguiente = document.createElement('button');
        btnSiguiente.textContent = 'Siguiente';
        btnSiguiente.className = 'btn-secundario';
        btnSiguiente.style.padding = '6px 12px';
        btnSiguiente.style.fontSize = '13px';
        btnSiguiente.disabled = paginaActual === totalPaginas;
        if (paginaActual === totalPaginas) btnSiguiente.style.opacity = '0.5';
        btnSiguiente.onclick = () => {
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizarTablaDirectorio();
            }
        };
        contenedorPaginacion.appendChild(btnSiguiente);
    };

    bodyProveedores.addEventListener('click', async (e) => {
        const btnEditar = e.target.closest('.btn-editar-prov');
        const btnEliminar = e.target.closest('.btn-eliminar-prov');

        if (btnEditar) {
            document.getElementById('provId').value = btnEditar.dataset.id;
            document.getElementById('provNombre').value = btnEditar.dataset.nombre;
            document.getElementById('provTelefono').value = btnEditar.dataset.telefono;
            document.getElementById('provDias').value = btnEditar.dataset.dias;
            document.getElementById('tituloModalProveedor').textContent = 'Editar Proveedor';
            modalProveedor.style.display = 'flex';
        }

        if (btnEliminar) {
            const id = btnEliminar.dataset.id;
            const nombre = btnEliminar.dataset.nombre;

            Swal.fire({
                title: '¿Estás seguro?',
                text: `Vas a eliminar a ${nombre} del directorio. (No se borrarán sus facturas pasadas).`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#94a3b8',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                borderRadius: '12px'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const res = await fetchAutenticado(`http://localhost:3000/api/proveedores/${id}`, { method: 'DELETE' });
                        if (res.ok) {
                            cargarDirectorio();
                            cargarProveedoresSelect(); 
                            
                            Toastify({
                                text: "Proveedor eliminado exitosamente", 
                                duration: 3000, 
                                gravity: "top", 
                                position: "center",
                                style: { background: "#10b981", borderRadius: "8px" }
                            }).showToast();
                        }
                    } catch (error) {
                        console.error('Error al eliminar', error);
                        Swal.fire('Error', 'No se pudo eliminar el proveedor', 'error');
                    }
                }
            });
        }
    });

    cargarDirectorio();


// LOGICA DE LA AGENDA DEL DIA 
    const contenedorListaAgenda = document.getElementById('contenedorListaAgenda');

    const cargarAgenda = async () => {
        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/agenda');
            const visitas = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(visitas.error || 'Error interno en el servidor');
            }

            contenedorListaAgenda.innerHTML = '';

            if (visitas.length === 0) {
                contenedorListaAgenda.innerHTML = `
                        <div style="padding: 30px; text-align: center;">
                            <p style="color: #94a3b8; margin-bottom: 15px;">No hay visitas programadas en la libreta de hoy.</p>
                            <button id="btnGenerarAgenda" class="btn-primario" style="width: auto; padding: 10px 20px;">Generar Agenda de Hoy</button>
                        </div>`;

                document.getElementById('btnGenerarAgenda').addEventListener('click', async () => {
                    try {
                        const res = await fetchAutenticado('http://localhost:3000/api/agenda/generar', { method: 'POST' });
                        if (res.ok) {
                            cargarAgenda(); 
                        }
                    } catch (error) {
                        console.error('Error al generar:', error);
                    }
                });
            }

            visitas.forEach(visita => {
                const div = document.createElement('div');
                div.className = `item-agenda ${visita.asistio ? 'visitado' : ''}`;

                div.innerHTML = `
                        <div class="agenda-header">
                            <input type="checkbox" class="checkbox-agenda" ${visita.asistio ? 'checked' : ''} data-id="${visita.id}">
                            <span class="nombre-proveedor-agenda">${visita.nombre}</span>
                            <span class="icono-desplegable">▼</span>
                        </div>
                        <div class="agenda-detalle">
                            <label style="display: block; font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 500;">Asignar pedido o notas (Se guarda automáticamente):</label>
                            <textarea class="nota-agenda" placeholder="Ej. Traer 2 cajas de mantecadas y 1 pan blanco...">${visita.notas || ''}</textarea>
                        </div>
                    `;

                const checkbox = div.querySelector('.checkbox-agenda');
                const inputNota = div.querySelector('.nota-agenda');
                const header = div.querySelector('.agenda-header');
                const detalle = div.querySelector('.agenda-detalle');
                const icono = div.querySelector('.icono-desplegable');

                if (visita.notas && visita.notas.trim() !== '') {
                    detalle.style.display = 'block';
                    icono.style.transform = 'rotate(180deg)';
                }

                header.addEventListener('click', (e) => {
                    if(e.target === checkbox) return; 

                    const estaAbierto = detalle.style.display === 'block';
                    detalle.style.display = estaAbierto ? 'none' : 'block';
                    icono.style.transform = estaAbierto ? 'rotate(0deg)' : 'rotate(180deg)';
                });

                checkbox.addEventListener('change', async (e) => {
                    const asistio = e.target.checked;
                    if(asistio) div.classList.add('visitado');
                    else div.classList.remove('visitado');  

                    await actualizarVisita(visita.id, asistio, inputNota.value);
                });

                inputNota.addEventListener('change', async (e) => {
                    await actualizarVisita(visita.id, checkbox.checked, e.target.value);
                    
                    Toastify({
                        text: "Pedido guardado",
                        duration: 1500,
                        gravity: "top",
                        position: "center",
                        style: { background: "#10b981", borderRadius: "8px" }
                    }).showToast();
                });

                contenedorListaAgenda.appendChild(div);
            });
        } catch (error) {
            console.error('Error al cargar la agenda:', error);
            contenedorListaAgenda.innerHTML = `<p style="padding: 20px; color: #ef4444; text-align: center;">Error al cargar la agenda del día.</p>`;
        }
    };

    const actualizarVisita = async (id, asistio, notas) => {
        try {
            await fetchAutenticado(`http://localhost:3000/api/agenda/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify ({ asistio, notas })
            }); 
        } catch (error) {
            console.error('Error al actualizar visita', error);
        }
    };

    cargarAgenda();


    //REGISTRO DE COMPRAS
    const bodyCompras = document.getElementById('bodyCompras');
    const contenedorPaginacionCompras = document.getElementById('paginacionCompras'); // Referencia a la paginación
    
    const inputBuscadorCompras = document.getElementById('buscadorCompras');
    const selectFiltroEstatus = document.getElementById('filtroEstatusCompras');
    const inputFiltroFecha = document.getElementById('filtroFechaCompras');
    const btnLimpiarFiltrosCompras = document.getElementById('btnLimpiarFiltrosCompras');

    // Variables globales para paginación y filtros
    let comprasGlobales = [];
    let comprasFiltradas = [];
    let paginaActualCompras = 1;
    const elementosPorPaginaCompras = 10; // Puedes cambiarlo a 5 o 15 si prefieres

    const cargarCompras = async () => {
        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/compras');
            comprasGlobales = await respuesta.json();
            comprasFiltradas = [...comprasGlobales]; 
            
            paginaActualCompras = 1; // Reiniciar página al cargar
            renderizarTablaCompras();
        } catch (error) {
            console.error('Error al cargar historial de compras:', error);
            bodyCompras.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">Error al cargar el historial.</td>
                </tr>`;
        }
    };

    const renderizarTablaCompras = () => {
        bodyCompras.innerHTML = '';
        contenedorPaginacionCompras.innerHTML = ''; 

        if (comprasFiltradas.length === 0) {
            bodyCompras.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">No se encontraron facturas con esos criterios.</td>
                </tr>`;
            return;
        }

        const inicio = (paginaActualCompras - 1) * elementosPorPaginaCompras;
        const fin = inicio + elementosPorPaginaCompras;
        const comprasPagina = comprasFiltradas.slice(inicio, fin);

        comprasPagina.forEach(compra => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f1f5f9';

            const fechaFormat = new Date(compra.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' });
            const totalFormat = `$${parseFloat(compra.total_compra).toFixed(2)}`;
            const saldoFormat = `$${parseFloat(compra.saldo_pendiente).toFixed(2)}`;

            const estatusBadge = compra.estatus_pago === 'pagada' 
                ? `<span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Pagada</span>`
                : `<span style="background: #fef08a; color: #854d0e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Pendiente</span>`;

            tr.innerHTML = `
                <td style="padding: 15px; color: #475569;">${fechaFormat}</td>
                <td style="padding: 15px; font-weight: 500; color: #1e293b;">${compra.proveedor}</td>
                <td style="padding: 15px; font-weight: 600; color: #0f172a;">${totalFormat}</td>
                <td style="padding: 15px;">${estatusBadge}</td>
                <td style="padding: 15px; color: ${compra.saldo_pendiente > 0 ? '#ef4444' : '#475569'}; font-weight: 500;">
                    ${compra.saldo_pendiente > 0 ? saldoFormat : '-'}
                </td>
            `;

            bodyCompras.appendChild(tr);
        });

        renderizarControlesPaginacionCompras();
    };

    // Función para los botones 
    const renderizarControlesPaginacionCompras = () => {
        const totalPaginas = Math.ceil(comprasFiltradas.length / elementosPorPaginaCompras);
        if (totalPaginas <= 1) return; // Si todo cabe en 1 página, no mostramos botones

        const infoTexto = document.createElement('span');
        infoTexto.style.color = '#64748b';
        infoTexto.style.fontSize = '14px';
        infoTexto.style.marginRight = 'auto'; 
        const itemInicio = (paginaActualCompras - 1) * elementosPorPaginaCompras + 1;
        const itemFin = Math.min(paginaActualCompras * elementosPorPaginaCompras, comprasFiltradas.length);
        infoTexto.textContent = `Mostrando ${itemInicio} a ${itemFin} de ${comprasFiltradas.length}`;
        contenedorPaginacionCompras.appendChild(infoTexto);

        // Botón Anterior
        const btnAnterior = document.createElement('button');
        btnAnterior.textContent = 'Anterior';
        btnAnterior.className = 'btn-secundario';
        btnAnterior.style.padding = '6px 12px';
        btnAnterior.style.fontSize = '13px';
        btnAnterior.disabled = paginaActualCompras === 1;
        if (paginaActualCompras === 1) btnAnterior.style.opacity = '0.5';
        btnAnterior.onclick = () => {
            if (paginaActualCompras > 1) {
                paginaActualCompras--;
                renderizarTablaCompras();
            }
        };
        contenedorPaginacionCompras.appendChild(btnAnterior);

        // Botón Siguiente
        const btnSiguiente = document.createElement('button');
        btnSiguiente.textContent = 'Siguiente';
        btnSiguiente.className = 'btn-secundario';
        btnSiguiente.style.padding = '6px 12px';
        btnSiguiente.style.fontSize = '13px';
        btnSiguiente.disabled = paginaActualCompras === totalPaginas;
        if (paginaActualCompras === totalPaginas) btnSiguiente.style.opacity = '0.5';
        btnSiguiente.onclick = () => {
            if (paginaActualCompras < totalPaginas) {
                paginaActualCompras++;
                renderizarTablaCompras();
            }
        };
        contenedorPaginacionCompras.appendChild(btnSiguiente);
    };

    const aplicarFiltrosCompras = () => {
        const terminoProveedor = inputBuscadorCompras.value.toLowerCase().trim();
        const estatusSeleccionado = selectFiltroEstatus.value;
        const fechaSeleccionada = inputFiltroFecha.value; 

        comprasFiltradas = comprasGlobales.filter(compra => {
            const coincideProveedor = compra.proveedor.toLowerCase().includes(terminoProveedor);
            const coincideEstatus = estatusSeleccionado === 'todos' || compra.estatus_pago === estatusSeleccionado;
            
            let coincideFecha = true;
            if (fechaSeleccionada) {
                const fechaCompraStr = new Date(compra.fecha).toISOString().split('T')[0];
                coincideFecha = (fechaCompraStr === fechaSeleccionada);
            }

            return coincideProveedor && coincideEstatus && coincideFecha;
        });

        paginaActualCompras = 1; 
        renderizarTablaCompras();
    };

    inputBuscadorCompras.addEventListener('input', aplicarFiltrosCompras);
    selectFiltroEstatus.addEventListener('change', aplicarFiltrosCompras);
    inputFiltroFecha.addEventListener('change', aplicarFiltrosCompras);

    btnLimpiarFiltrosCompras.addEventListener('click', () => {
        inputBuscadorCompras.value = '';
        selectFiltroEstatus.value = 'todos';
        inputFiltroFecha.value = '';
        
        comprasFiltradas = [...comprasGlobales];
        paginaActualCompras = 1; 
        renderizarTablaCompras();
    });

    cargarCompras();



    const cargarProveedoresSelect = async () => {
        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/proveedores');
            const proveedores = await respuesta.json();

            selectProveedor.innerHTML = '<option value="">Seleccione un proveedor...</option>';

            proveedores.forEach(prov => {
                const option = document.createElement('option');
                option.value = prov.id;
                option.textContent = prov.nombre;
                selectProveedor.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar proveedores', error);
            selectProveedor.innerHTML = '<option value="">Error al cargar proveedores</option>';
        }
    };

    cargarProveedoresSelect();

    const selectProveedor = document.getElementById('compraProveedor');
    const selectEstatus = document.getElementById('compraEstatus');
    const divSaldoPendiente = document.getElementById('divSaldoPendiente');
    const inputSaldo = document.getElementById('compraSaldo');

    selectEstatus.addEventListener('change', (e) => {
        if (e.target.value === 'pendiente') {
            divSaldoPendiente.style.display = 'block';
            inputSaldo.required = true; 
        } else {
            divSaldoPendiente.style.display = 'none';
            inputSaldo.required = false; 
            inputSaldo.value = '';
        }
    });
    
    const formNuevaCompra = document.getElementById('formNuevaCompra');

    formNuevaCompra.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = formNuevaCompra.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando...';

        const nuevaCompra = {
            proveedor_id: selectProveedor.value,
            total_compra: document.getElementById('compraTotal').value, 
            estatus_pago: selectEstatus.value, 
            saldo_pendiente: inputSaldo.value || 0,
            notas: document.getElementById('compraNotas').value.trim()
        };

        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/compras', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaCompra)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                cerrarModalCompra();
                cargarCompras();
                cargarResumenReportes();
                cargarDeudas(); 
                divSaldoPendiente.style.display = 'none';
                inputSaldo.required = false;

                Toastify({
                    text: "¡Factura registrada exitosamente!",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: { background: "#10b981", borderRadius: "8px" }
                }).showToast();
            } else {
                throw new Error(data.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('Error', error);
            Toastify({
                text: "Ocurrió un error al guardar la factura.",
                duration: 3000,
                gravity: "top",
                position: "center",
                style: { background: "#ef4444", borderRadius: "8px" }
            }).showToast();
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Registrar Compra';
        }
    });


    // DEUDAS Y ABONOS
    const bodyDeudas = document.getElementById('bodyDeudas');
    const selectAbonoFactura = document.getElementById('abonoFactura');

    const cargarDeudas = async () => {
        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/deudas');
            const deudas = await respuesta.json();

            bodyDeudas.innerHTML = '';

            if (deudas.length === 0) {
                bodyDeudas.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px; color: #10b981; font-weight: 500;">¡Felicidades! No tienes cuentas por pagar pendientes.</td>
                    </tr>`;
                return;
            }

            deudas.forEach(deuda => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f1f5f9';

                const fechaFormat = new Date(deuda.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' });
                const totalFormat = `$${parseFloat(deuda.total_compra).toFixed(2)}`;
                const saldoFormat = `$${parseFloat(deuda.saldo_pendiente).toFixed(2)}`;

                tr.innerHTML = `
                    <td style="padding: 15px; color: #475569;">${fechaFormat}</td>
                    <td style="padding: 15px; font-weight: 500; color: #1e293b;">${deuda.proveedor}</td>
                    <td style="padding: 15px; color: #64748b;">${totalFormat}</td>
                    <td style="padding: 15px; color: #ef4444; font-weight: 600;">${saldoFormat}</td>
                `;
                bodyDeudas.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar las deudas:', error);
            bodyDeudas.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Error al cargar las cuentas.</td></tr>`;
        }
    };

    const cargarFacturasAbonoSelect = async () => {
        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/deudas');
            const deudas = await respuesta.json();

            selectAbonoFactura.innerHTML = '<option value="">Seleccione una factura...</option>';

            deudas.forEach(deuda => {
                const fechaFormat = new Date(deuda.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' });
                const option = document.createElement('option');
                option.value = deuda.id;
                option.textContent = `${deuda.proveedor} (${fechaFormat}) - Deuda: $${parseFloat(deuda.saldo_pendiente).toFixed(2)}`;
                selectAbonoFactura.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar facturas en select', error);
        }
    };

    const formNuevoAbono = document.getElementById('formNuevoAbono');

    formNuevoAbono.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = formNuevoAbono.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Procesando...';

        const idFactura = selectAbonoFactura.value;
        const monto = document.getElementById('abonoMonto').value;

        try {
            const respuesta = await fetchAutenticado(`http://localhost:3000/api/deudas/${idFactura}/abono`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monto_abono: monto })
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                cerrarModalAbono();
                cargarDeudas(); 
                cargarCompras();
                cargarResumenReportes(); 

                Toastify({
                    text: "¡Abono registrado exitosamente!",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: { background: "#10b981", borderRadius: "8px" }
                }).showToast();
            } else {
                throw new Error(data.error || 'Error al procesar el pago');
            }
        } catch (error) {
            console.error('Error:', error);
            Toastify({
                text: error.message || "Ocurrió un error al registrar el abono.",
                duration: 3000,
                gravity: "top",
                position: "center",
                style: { background: "#ef4444", borderRadius: "8px" }
            }).showToast();
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Guardar Abono';
        }
    });

    cargarDeudas();


    // MODULO DE REPORTES (DASHBOARD)
    let chartTopProveedores = null;
    let chartSemanaInstancia = null;
    let datosReportesGlobal = null; 

    const cargarResumenReportes = async () => {
        try {
            const respuesta = await fetchAutenticado('http://localhost:3000/api/reportes/resumen');
            datosReportesGlobal = await respuesta.json();
            const datos = datosReportesGlobal;

            const formatoMoneda = (cantidad) => `$${parseFloat(cantidad || 0).toFixed(2)}`;

            // Llenar Tarjetas
            document.getElementById('repDeudaTotal').textContent = formatoMoneda(datos.deuda_total);
            document.getElementById('repFacturasPendientes').textContent = `En ${datos.facturas_pendientes || 0} facturas sin pagar`;
            document.getElementById('repGastoMes').textContent = formatoMoneda(datos.gasto_mes);
            document.getElementById('repProveedorTop').textContent = datos.proveedor_top;
            document.getElementById('repPromedioFactura').textContent = formatoMoneda(datos.promedio_factura);

            // Últimas Compras
            const contenedorUltimas = document.getElementById('contenedorUltimasCompras');
            contenedorUltimas.innerHTML = ''; 
            if (!datos.ultimas_compras || datos.ultimas_compras.length === 0) {
                contenedorUltimas.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 14px; margin-top: 20px;">No hay compras recientes.</p>';
            } else {
                datos.ultimas_compras.forEach(compra => {
                    const div = document.createElement('div');
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';
                    div.style.padding = '12px 15px';
                    div.style.background = '#f8fafc';
                    div.style.borderRadius = '8px';
                    div.style.border = '1px solid #f1f5f9';

                    const fecha = new Date(compra.fecha).toLocaleDateString('es-MX', { timeZone: 'UTC' });
                    const colorEstatus = compra.estatus_pago === 'pagada' ? '#10b981' : '#f59e0b';

                    div.innerHTML = `
                        <div>
                            <p style="margin: 0; font-weight: 600; color: #1e293b; font-size: 14px;">${compra.proveedor}</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${fecha}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-weight: 700; color: #0f172a; font-size: 14px;">${formatoMoneda(compra.total_compra)}</p>
                            <p style="margin: 4px 0 0 0; font-size: 12px; color: ${colorEstatus}; font-weight: 600; text-transform: capitalize;">${compra.estatus_pago}</p>
                        </div>
                    `;
                    contenedorUltimas.appendChild(div);
                });
            }

            renderizarGraficaProveedores('mes');
            renderizarGraficaSemana(false);

        } catch (error) {
            console.error('Error al cargar reportes:', error);
            document.getElementById('contenedorUltimasCompras').innerHTML = '<p style="color: #ef4444; text-align: center;">Error al cargar datos.</p>';
        }
    };

    const renderizarGraficaProveedores = (filtro) => {
        const ctx = document.getElementById('graficaProveedores').getContext('2d');
        if (chartTopProveedores) chartTopProveedores.destroy();

        // Decide qué datos usar basándose en el select
        const datosFiltro = filtro === 'semana' ? datosReportesGlobal.grafica_proveedores_semana : datosReportesGlobal.grafica_proveedores;
        
        const etiquetas = datosFiltro.map(p => p.nombre);
        const montos = datosFiltro.map(p => parseFloat(p.total_comprado));

        chartTopProveedores = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: etiquetas,
                datasets: [{
                    label: 'Gasto ($)',
                    data: montos,
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: v => '$' + v }, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    const renderizarGraficaSemana = (mostrarAnterior) => {
        const ctxSemana = document.getElementById('graficaSemana').getContext('2d');
        if (chartSemanaInstancia) chartSemanaInstancia.destroy();

        const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const datosSemanaActual = [0, 0, 0, 0, 0, 0, 0];
        const datosSemanaAnterior = [0, 0, 0, 0, 0, 0, 0];

        if (datosReportesGlobal.grafica_semana) {
            datosReportesGlobal.grafica_semana.forEach(dia => {
                datosSemanaActual[parseInt(dia.dia_indice) - 1] = parseFloat(dia.total_gastado);
            });
        }

        if (datosReportesGlobal.grafica_semana_anterior) {
            datosReportesGlobal.grafica_semana_anterior.forEach(dia => {
                datosSemanaAnterior[parseInt(dia.dia_indice) - 1] = parseFloat(dia.total_gastado);
            });
        }

        const datasets = [{
            label: 'Esta Semana',
            data: datosSemanaActual,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#3b82f6',
            fill: true, tension: 0.4
        }];

        if (mostrarAnterior) {
            datasets.push({
                label: 'Semana Pasada',
                data: datosSemanaAnterior,
                borderColor: '#94a3b8',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5], 
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#94a3b8',
                fill: false, tension: 0.4
            });
        }

        chartSemanaInstancia = new Chart(ctxSemana, {
            type: 'line',
            data: { labels: nombresDias, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: mostrarAnterior, position: 'top' },
                    tooltip: { callbacks: { label: c => ' $' + c.raw.toLocaleString('es-MX', { minimumFractionDigits: 2 }) } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: v => '$' + v } }
                }
            }
        });
    };

    const selectFiltroTopProv = document.getElementById('selectFiltroTopProv');
    if(selectFiltroTopProv) {
        selectFiltroTopProv.addEventListener('change', (e) => {
            if(datosReportesGlobal) renderizarGraficaProveedores(e.target.value);
        });
    }

    const chkCompararSemana = document.getElementById('chkCompararSemana');
    if(chkCompararSemana) {
        chkCompararSemana.addEventListener('change', (e) => {
            if(datosReportesGlobal) renderizarGraficaSemana(e.target.checked);
        });
    }

    cargarResumenReportes();

});

