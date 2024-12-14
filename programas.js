/**
 * Módulo de Programas
 * 
 * Este archivo maneja la interactividad de la página de programas:
 * - Animaciones de tabs
 * - Estado de usuario
 * - Interacciones UI
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar estado de autenticación
    checkAuthStatus();
    
    // Inicializar los tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Manejar cambios de tab con animación suave
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetPane = document.querySelector(targetId);

            // Remover clases activas
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            // Agregar clases activas al tab seleccionado
            this.classList.add('active');
            targetPane.classList.add('show', 'active');
        });
    });
});

// Función para verificar el estado de autenticación
function checkAuthStatus() {
    fetch('/check-session')
        .then(response => response.json())
        .then(data => {
            const userSection = document.getElementById('userSection');
            if (data.authenticated) {
                userSection.innerHTML = `
                    <span class="navbar-text me-3">
                        <i class="fas fa-user"></i> ${data.username}
                    </span>
                    <button onclick="logout()" class="btn btn-outline-light">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                `;
            } else {
                userSection.innerHTML = `
                    <a href="login.html" class="btn btn-outline-light me-2">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </a>
                `;
            }
        })
        .catch(error => {
            console.error('Error verificando sesión:', error);
        });
}

// Función para cerrar sesión
function logout() {
    fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = 'login.html';
        }
    })
    .catch(error => {
        console.error('Error en logout:', error);
    });
}
