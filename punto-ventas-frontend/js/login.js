const formLogin = document.getElementById('form-login');
const inputUsuario = document.getElementById('input-usuario');
const inputPassword = document.getElementById('input-password');
const btnTogglePass = document.getElementById('btn-toggle-pass');
const iconoOjo = document.getElementById('icono-ojo');

// Lógica para mostrar/ocultar la contraseña
btnTogglePass.addEventListener('click', () => {
    if (inputPassword.type === 'password') {
        inputPassword.type = 'text';
        // Cambiamos el icono a un ojo tachado (cerrado)
        iconoOjo.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        inputPassword.type = 'password';
        // Regresamos al icono del ojo abierto
        iconoOjo.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
});

// Lógica principal de inicio de sesión al enviar el formulario
formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault(); // Evita que la página se recargue

    const usuario = inputUsuario.value.trim();
    const password = inputPassword.value.trim();

    if (!usuario || !password) {
        Toastify({
            text: "Completa ambos campos.",
            duration: 2000,
            gravity: "top",
            position: "center",
            style: { background: "#f59e0b" }
        }).showToast();
        return;
    }

    try {
        const respuesta = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: usuario, pin: password }) 
        });
        
        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.mensaje || 'Credenciales incorrectas');
        }
        
        localStorage.setItem('sysrt_sesion', JSON.stringify({ ...data.usuario, token: data.token }));

        Toastify({
            text: `¡Bienvenido, ${data.usuario.nombre}!`,
            duration: 1500,
            gravity: "top",
            position: "center",
            style: { background: "#10b981" }
        }).showToast();
        
        setTimeout(() => {
            window.location.href = 'ventas.html'; 
        }, 1000);

    } catch (error) {
        Toastify({
            text: error.message || "Error al conectar con el servidor.",
            duration: 2500,
            gravity: "top",
            position: "center",
            style: { background: "#ef4444" }
        }).showToast();
        
        inputPassword.value = '';
        inputPassword.focus();
    }
});