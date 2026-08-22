// 1. LÓGICA DE SEGURIDAD 
const sesionString = localStorage.getItem('sysrt_sesion');

// FUNCION CENTRAL PARA LLAMADAS A LA API
async function fetchAutenticado(url, opciones = {}) {
    const sesion = localStorage.getItem('sysrt_sesion');
    const token = sesion ? JSON.parse(sesion).token : null;

    const encabezados = {
        ...(opciones.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const respuesta = await fetch(url, { ...opciones, headers: encabezados });

    if (respuesta.status === 401) {
        localStorage.removeItem('sysrt_sesion');
        window.location.href = 'login.html';
        return respuesta;
    }

    return respuesta;
}

if (!sesionString && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
}

if (sesionString) {
    const usuarioActual = JSON.parse(sesionString);
    const rutaActual = window.location.pathname;
    const rutasAdmin = ['inventario.html', 'proveedores.html', 'dashboard.html'];
    const intentaEntrarAdmin = rutasAdmin.some(ruta => rutaActual.includes(ruta));

    if (intentaEntrarAdmin && usuarioActual.rol_id !== 1) {
        window.location.href = 'ventas.html';
    }
}

// FUNCION PARA CARGAR COMPONENTES HTML (Con Anti-Caché forzado)
async function cargarComponentes(idContenedor, rutaArchivo) {
    const contenedor = document.getElementById(idContenedor);
    if (contenedor) {
        try {
            // Generamos un número único basado en la hora exacta
            const version = new Date().getTime();
            
            // Forzamos al navegador a descargar el archivo fresco siempre
            const respuesta = await fetch(`${rutaArchivo}?v=${version}`);
            
            if (respuesta.ok) {
                const html = await respuesta.text();
                contenedor.innerHTML = html;
            }
        } catch (error) {
            console.error(`Error cargando el componente ${rutaArchivo}:`, error);
        }
    }
}

// INYECCION Y LOGICA DE INTERFAZ 
document.addEventListener('DOMContentLoaded', async () => {
    
    const usuarioActual = sesionString ? JSON.parse(sesionString) : null;
    
    if (usuarioActual && usuarioActual.rol_id === 1) {
        await cargarComponentes('inyectar-sidebar', 'componentes/sidebar.html');
    }
    
    await cargarComponentes('inyectar-perfil', 'componentes/perfil.html');

    const rutaActualVentana = window.location.pathname;
    const enlacesMenu = document.querySelectorAll('.sidebar nav ul li a.link-menu');
    
    enlacesMenu.forEach(enlace => {
        const rutaEnlace = enlace.getAttribute('href');
        if (rutaActualVentana.includes(rutaEnlace)) {
            enlace.parentElement.classList.add('activo');
        } else {
            enlace.parentElement.classList.remove('activo');
        }
    });
    
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const sidebar = document.getElementById('sidebarGlobal');

    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-oculta');
        });
    }

    const btnAvatar = document.getElementById('btnAvatarPerfil');
    const dropdown = document.getElementById('dropdownPerfil');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    
    const nombreUI = document.getElementById('nombreUsuarioDropdown');
    const rolUI = document.getElementById('rolUsuarioDropdown');

    if (usuarioActual) {
        if(nombreUI) nombreUI.textContent = usuarioActual.nombre;
        if(rolUI) rolUI.textContent = usuarioActual.rol_id === 1 ? 'Administrador' : 'Cajero';
    }

    if (btnAvatar && dropdown) {
        btnAvatar.addEventListener('click', (evento) => {
            evento.stopPropagation(); 
            dropdown.classList.toggle('dropdown-activo');
        });

        document.addEventListener('click', (evento) => {
            if (!dropdown.contains(evento.target) && !btnAvatar.contains(evento.target)) {
                dropdown.classList.remove('dropdown-activo');
            }
        });
    }

    // 6. Botón Salir con SweetAlert
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            Swal.fire({
                title: '¿Cerrar sesión?',
                text: "Saldrás de tu turno actual.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar',
                focusConfirm: false // Quita el borde morado de selección
            }).then((resultado) => {
                if (resultado.isConfirmed) {
                    localStorage.removeItem('sysrt_sesion');
                    window.location.href = 'login.html';
                }
            });
        });
    }
});