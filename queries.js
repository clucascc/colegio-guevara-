/**
 * Módulo de Consultas a la Base de Datos
 * 
 * Este archivo contiene las consultas SQL y operaciones de base de datos:
 * - Consultas predefinidas
 * - Funciones de búsqueda
 * - Operaciones CRUD básicas
 * - Consultas personalizadas
 * 
 * Funcionalidades principales:
 * - Búsqueda de registros
 * - Filtrado de datos
 * - Ordenamiento
 * - Paginación
 */

// Función para obtener usuarios
async function getUsers() {
    try {
        const response = await fetch('/api/users/list', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return { success: false, message: 'Error al obtener usuarios' };
    }
}

// Función para buscar usuario por email
async function searchUserByEmail(email) {
    try {
        const response = await fetch(`/api/users/search?email=${email}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return { success: false, message: 'Error al buscar usuario' };
    }
}

// Función para buscar por rol
async function searchUsersByRole(role) {
    try {
        const response = await fetch(`/api/users/role/${role}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return { success: false, message: 'Error al buscar usuarios por rol' };
    }
}
