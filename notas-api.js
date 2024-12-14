/**
 * Módulo de API de Notas
 * 
 * Este archivo maneja todas las interacciones con el API de notas:
 * - Peticiones AJAX para notas
 * - Gestión de respuestas del servidor
 * - Transformación de datos
 * - Manejo de errores de API
 * 
 * Funcionalidades principales:
 * - Crear nuevas notas
 * - Obtener notas existentes
 * - Actualizar notas
 * - Eliminar notas
 * - Manejo de errores de red
 */

// Funciones para interactuar con la API de notas

// Obtener todas las notas
async function obtenerNotas() {
    try {
        const response = await fetch('/api/notas');
        if (!response.ok) {
            throw new Error('Error al obtener las notas');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Buscar notas por nombre o apellido
async function buscarNotas(termino) {
    try {
        const response = await fetch(`/api/notas/buscar?termino=${encodeURIComponent(termino)}`);
        if (!response.ok) {
            throw new Error('Error al buscar las notas');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Guardar una nueva nota
async function guardarNota(datosNota) {
    try {
        const response = await fetch('/api/notas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([datosNota]) // Envolver en array como espera el servidor
        });

        // Verificar el tipo de contenido de la respuesta
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('Respuesta inesperada del servidor (HTML). Posible problema de autenticación.');
        }

        if (!response.ok) {
            const errorData = await response.text();
            let errorMessage;
            try {
                const jsonError = JSON.parse(errorData);
                errorMessage = jsonError.message || 'Error desconocido';
            } catch {
                errorMessage = errorData || 'Error al guardar la nota';
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al guardar nota:', error);
        throw error;
    }
}

// Actualizar una nota existente
async function actualizarNota(id, datosNota) {
    try {
        const response = await fetch(`/api/notas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosNota)
        });
        if (!response.ok) {
            throw new Error('Error al actualizar la nota');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Eliminar una nota
async function eliminarNota(id) {
    try {
        const response = await fetch(`/api/notas/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Error al eliminar la nota');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
