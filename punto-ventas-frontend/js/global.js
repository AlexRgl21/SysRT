document.addEventListener('DOMContentLoaded', () => {
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const sidebar = document.getElementById('sidebarGlobal');

    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-oculta');
        });
    } else {
        console.error("No se encontró el botón o la sidebar en el HTML.");
    }
});


// LOGICA SEGURIDAD EN BASE AL ROL 
const sesionString = localStorage.getItem('sysrt_sesion');

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

document.addEventListener('DOMContentLoaded', () => {
    if (sesionString) {
        const usuarioActual = JSON.parse(sesionString);
        if (usuarioActual.rol_id !== 1) {
            const sidebar = document.getElementById('sidebarGlobal');
            
            if (sidebar) {
                sidebar.style.display = 'none';
            }
        }
    }
})


// LÓGICA DEL MENÚ DE PERFIL Y CERRAR SESIÓN
document.addEventListener('DOMContentLoaded', () => {
    const btnAvatar = document.getElementById('btnAvatarPerfil');
    const dropdown = document.getElementById('dropdownPerfil');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    
    const nombreUI = document.getElementById('nombreUsuarioDropdown');
    const rolUI = document.getElementById('rolUsuarioDropdown');

    if (sesionString) {
        const usuarioActual = JSON.parse(sesionString);
        if(nombreUI) nombreUI.textContent = usuarioActual.nombre;
        if(rolUI) rolUI.textContent = usuarioActual.rol_id === 1 ? 'Administrador' : 'Cajero';
    }

    if (btnAvatar && dropdown) {
        btnAvatar.addEventListener('click', (evento) => {
            evento.stopPropagation(); // Evita que se cierre instantáneamente
            dropdown.classList.toggle('dropdown-activo');
        });

        document.addEventListener('click', (evento) => {
            if (!dropdown.contains(evento.target) && !btnAvatar.contains(evento.target)) {
                dropdown.classList.remove('dropdown-activo');
            }
        });
    }

    // Lógica del botón cerrar sesión
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
                cancelButtonText: 'Cancelar'
            }).then((resultado) => {
                if (resultado.isConfirmed) {
                    localStorage.removeItem('sysrt_sesion');
                    window.location.href = 'login.html';
                }
            });
        });
    }
});