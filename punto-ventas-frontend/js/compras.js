

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

    // MODAL NUEVO PROVEEDOR
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
            modalProveedor.style.display = 'flex';
            document.getElementById('provNombre').focus();
        } else if (tabActiva === 'tab-compras') {
            modalCompra.style.display = 'flex';
            document.getElementById('compraProveedor').focus();
        }
    });

    const cerrarModalProveedor = () => {
        modalProveedor.style.display = 'none';
        formNuevoProveedor.reset();
    };

    const cerrarModalCompra = () => {
        modalCompra.style.display = 'none';
        document.getElementById('formNuevaCompra').reset();
        document.getElementById('divSaldoPendiente').style.display = 'none';
        document.getElementById('compraSaldo').required = false;
    };

    btnCerrarModalProveedor.addEventListener('click', cerrarModalProveedor);
    btnCancelarProveedor.addEventListener('click', cerrarModalProveedor);
    btnCerrarModalCompra.addEventListener('click', cerrarModalCompra);
    btnCancelarCompra.addEventListener('click', cerrarModalCompra);

    window.addEventListener('click', (e) => {
        if (e.target === modalProveedor) cerrarModalProveedor();
        if (e.target === modalCompra) cerrarModalCompra();
    });

    formNuevoProveedor.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const nuevoProveedor = {
            nombre: document.getElementById('provNombre').value.trim(),
            telefono: document.getElementById('provTelefono').value.trim(),
            dias_visita: document.getElementById('provDias').value.trim()
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/proveedores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoProveedor)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                cerrarModalProveedor();
                cargarDirectorio();
                
                Toastify({
                    text: "¡Proveedor registrado con éxito!",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: {
                        background: "#10b981", 
                        borderRadius: "8px"
                    }
                }).showToast();
                
            } else {
                throw new Error(data.error || 'Error al guardar');
            }

        } catch (error) {
            console.error('Error:', error);
            Toastify({
                text: "Ocurrió un error al guardar el proveedor.",
                duration: 3000,
                gravity: "top",
                position: "center",
                style: {
                    background: "#ef4444", 
                    borderRadius: "8px"
                }
            }).showToast();
        }
    });

    //LOGICA PARA CARGAR EL DIRETORIO
    const bodyProveedores = document.getElementById('bodyProveedores');

    const cargarDirectorio = async () => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/proveedores');
            const proveedores = await respuesta.json();

            bodyProveedores.innerHTML = '';

            if (proveedores.length === 0) {
                bodyProveedores.innerHTML = `
                    <tr>
                        <td colspan="3" style="text-align: center; padding: 20px; color: #94a3b8;">No hay proveedores registrados.</td>
                    </tr>`;
                    return;
            }

            proveedores.forEach(prov => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f1f5f9';

                tr.innerHTML = `
                    <td style="padding: 15px; font-weight: 500; color: #1e293b;">${prov.nombre}</td>
                    <td style="padding: 15px; color: #475569;">${prov.telefono || '-'}</td>
                    <td style="padding: 15px; color: #475569;">${prov.dias_visita || '-'}</td>
                `;

                bodyProveedores.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar los proveedores.', error);
            bodyProveedores.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 20px; color: #ef4444;">Error al cargar el directorio.</td>
                </tr>`;
        }
    };

    cargarDirectorio();


// LOGICA DE LA AGENDA DEL DIA 
    const contenedorListaAgenda = document.getElementById('contenedorListaAgenda');

    const cargarAgenda = async () => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/agenda');
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
                        const res = await fetch('http://localhost:3000/api/agenda/generar', { method: 'POST' });
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
            await fetch(`http://localhost:3000/api/agenda/${id}`, {
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

    const cargarCompras = async () => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/compras');
            const compras = await respuesta.json();

            bodyCompras.innerHTML = '';

            if (compras.length === 0) {
                bodyCompras.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">No hay facturas registradas aún.</td>
                    </tr>`;
                return;
            }

            compras.forEach(compra => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #f1f5f9';

                const fechaFormat = new Date(compra.fecha).toLocaleDateString('es-MX');
                
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
        } catch (error) {
            console.error('Error al cargar historial de compras:', error);
            bodyCompras.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #ef4444;">Error al cargar el historial.</td>
                </tr>`;
        }
    };

    cargarCompras();



    const cargarProveedoresSelect = async () => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/proveedores');
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
            const respuesta = await fetch('http://localhost:3000/api/compras', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaCompra)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                cerrarModalCompra();
                cargarCompras();
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

});
