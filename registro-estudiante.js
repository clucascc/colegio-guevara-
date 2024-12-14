/**
 * Módulo de Registro de Estudiantes
 * 
 * Este archivo maneja el proceso de registro de nuevos estudiantes:
 * - Validación de formulario de registro
 * - Procesamiento de datos del estudiante
 * - Envío de información al servidor
 * - Manejo de respuestas de registro
 * 
 * Funcionalidades principales:
 * - Validación de campos
 * - Registro de estudiantes
 * - Manejo de errores
 * - Redirección post-registro
 */

document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const successAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');
    
    // Ocultar alertas previas
    successAlert.style.display = 'none';
    errorAlert.style.display = 'none';

    // Recoger datos del formulario
    const formData = {
        email: document.getElementById('email').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        nombre_completo: document.getElementById('nombre_completo').value,
        grado: document.getElementById('grado').value
    };

    try {
        const response = await fetch('/api/auth/register-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            // Mostrar mensaje de éxito
            successAlert.textContent = data.message || 'Estudiante registrado exitosamente';
            successAlert.style.display = 'block';
            
            // Limpiar el formulario
            this.reset();
            
            // Redirigir a la página especificada por el servidor
            if (data.redirectUrl) {
                setTimeout(() => {
                    window.location.href = data.redirectUrl;
                }, 1500);
            }
        } else {
            // Mostrar mensaje de error
            errorAlert.textContent = data.message || 'Error al registrar estudiante';
            errorAlert.style.display = 'block';
        }
    } catch (error) {
        // Mostrar error de conexión
        errorAlert.textContent = 'Error de conexión al servidor';
        errorAlert.style.display = 'block';
    }
});
