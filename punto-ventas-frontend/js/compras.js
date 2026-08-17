

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

    btnAccionPrincipal.addEventListener('click', () => {
        const tabActiva = document.querySelector('.tab-btn.activo').getAttribute('data-target');

        if (tabActiva === 'tab-directorio') {
            modalProveedor.style.display = 'flex';
            document.getElementById('provNombre').focus();
        }
    });

    const cerrarModalProveedor = () => {
        modalProveedor.style.display = 'none';
        formNuevoProveedor.reset();
    };

    btnCerrarModalProveedor.addEventListener('click', cerrarModalProveedor);
    btnCancelarProveedor.addEventListener('click', cerrarModalProveedor);

    window.addEventListener('click', (e) => {
        if (e.target === modalProveedor) {
            cerrarModalProveedor();
        }
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
});

//LOGICA DE LA TABLA DIRECTORIO
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


