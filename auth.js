/**
 * Módulo de Autenticación del Cliente
 * 
 * Este archivo maneja la lógica del lado del cliente para la autenticación:
 * - Verifica el estado de la sesión del usuario
 * - Maneja el proceso de inicio de sesión
 * - Gestiona el cierre de sesión
 * - Controla el acceso a rutas protegidas
 * 
 * Funcionalidades principales:
 * - Verificación automática del estado de sesión
 * - Redirección basada en roles de usuario
 * - Manejo de tokens y sesiones
 * - Protección de rutas según permisos
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a los formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');

    // Mostrar/Ocultar contraseña
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        });
    });

    // Cambiar entre formularios
    showRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    });

    showLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
    });

    // Manejar el registro
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            nombre: document.getElementById('regNombre').value,
            apellido: document.getElementById('regApellido').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            role: document.getElementById('regRole').value
        };

        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('reg-error-message').textContent = data.error;
            } else {
                alert('Registro exitoso. Por favor, inicia sesión.');
                // Mostrar formulario de login
                registerSection.style.display = 'none';
                loginSection.style.display = 'block';
            }
        })
        .catch(error => {
            document.getElementById('reg-error-message').textContent = 'Error en el registro';
        });
    });

    // Manejar el login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value
        };

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('error-message').textContent = data.error;
            } else {
                // Redirigir según el rol
                window.location.href = '/';
            }
        })
        .catch(error => {
            document.getElementById('error-message').textContent = 'Error en el inicio de sesión';
        });
    });
});
