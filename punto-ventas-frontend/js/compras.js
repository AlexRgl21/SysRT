

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
});