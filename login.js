/**
 * Módulo de Gestión de Login
 * 
 * Este archivo maneja toda la interacción del formulario de inicio de sesión:
 * - Validación de campos del formulario
 * - Envío de credenciales al servidor
 * - Manejo de respuestas de autenticación
 * - Redirección después del login exitoso
 * 
 * Características principales:
 * - Validación en tiempo real
 * - Mensajes de error personalizados
 * - Manejo de diferentes roles de usuario
 * - Integración con el sistema de autenticación
 */

// Elementos del DOM
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");

// Alternar entre formularios
showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginSection.style.display = "none";
    registerSection.style.display = "block";
});

showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    registerSection.style.display = "none";
    loginSection.style.display = "block";
});

// Toggle password visibility
function togglePasswordVisibility(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '';
    } else {
        input.type = 'password';
        button.textContent = '';
    }
}

document.getElementById('togglePassword').addEventListener('click', () => {
    togglePasswordVisibility('password', 'togglePassword');
});

document.getElementById('toggleRegPassword').addEventListener('click', () => {
    togglePasswordVisibility('regPassword', 'toggleRegPassword');
});

// Show/hide role-specific fields
function showRoleFields() {
    try {
        // Ocultar todos los campos específicos de rol
        const roleFields = document.querySelectorAll('.role-fields');
        if (roleFields) {
            roleFields.forEach(field => {
                if (field && field.style) {
                    field.style.display = 'none';
                }
            });
        }

        // Obtener el rol seleccionado
        const roleSelect = document.getElementById('regRole');
        if (!roleSelect) return;
        
        const selectedRole = roleSelect.value;
        const targetField = document.getElementById(`${selectedRole}Fields`);
        
        if (targetField && targetField.style) {
            targetField.style.display = 'block';
        }
    } catch (error) {
        console.error('Error en showRoleFields:', error);
    }
}

// Función para verificar si el correo ya existe
async function checkEmailExists(email) {
    try {
        const response = await fetch('http://localhost:3002/api/auth/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            return false; // Si hay error, asumimos que el email no existe
        }
        
        const data = await response.json();
        return data.exists;
    } catch (error) {
        console.error('Error al verificar el correo:', error);
        return false; // Si hay error de conexión, permitimos continuar
    }
}

// Actualizar mensaje de bienvenida según el rol
document.getElementById('role').addEventListener('change', function() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (!welcomeMessage) return; // Si no existe el elemento, no hacer nada
    
    const role = this.value;
    let message = 'Bienvenido ';
    
    switch(role) {
        case 'alumno':
        case 'estudiante':
            message += 'Estudiante';
            break;
        case 'profesor':
            message += 'Profesor';
            break;
        case 'admin':
            message += 'Administrador';
            break;
        default:
            message = 'Bienvenido';
    }
    
    welcomeMessage.textContent = message;
});

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMessage = document.getElementById('error-message');
    
    try {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const response = await fetch('http://localhost:3002/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            // Guardar información del usuario si es necesario
            sessionStorage.setItem('userRole', data.role);
            
            // Redirigir a la página principal
            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            }
        } else {
            errorMessage.textContent = result.message || 'Error en el inicio de sesión';
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'Error en el inicio de sesión. Por favor, intenta nuevamente.';
    }
});

// Register form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMessage = document.getElementById('reg-error-message');
    
    try {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const response = await fetch('http://localhost:3002/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            errorMessage.textContent = "Registro exitoso! Redirigiendo...";
            errorMessage.style.color = "green";
            
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else {
            errorMessage.textContent = result.message || 'Error en el registro';
            errorMessage.style.color = "red";
        }
    } catch (error) {
        console.error('Error:', error);
        errorMessage.textContent = 'Error en el registro. Por favor, intenta nuevamente.';
        errorMessage.style.color = "red";
    }
});

// Función para deshabilitar los inputs de notas (para estudiantes)
function disableGradeInputs() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

// Verificar el rol al cargar la página de boletín
window.addEventListener('DOMContentLoaded', function() {
    const role = sessionStorage.getItem('userRole');
    if (role === 'estudiante') {
        disableGradeInputs();
    }
});
