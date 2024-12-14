/**
 * Módulo de Gestión de Notas
 * 
 * Este archivo maneja la lógica de interfaz para las notas:
 * - Renderizado de notas en la UI
 * - Interacción con formularios de notas
 * - Actualización dinámica de la interfaz
 * - Validación de datos de notas
 * 
 * Funcionalidades principales:
 * - Mostrar lista de notas
 * - Crear nuevas notas
 * - Editar notas existentes
 * - Eliminar notas
 * - Filtrar y ordenar notas
 */

// Verificar el rol del usuario al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Aquí deberías obtener el rol del usuario desde tu sistema de autenticación
    const userRole = localStorage.getItem('userRole'); // Ejemplo usando localStorage
    
    if (userRole === 'profesor') {
        document.getElementById('profesorSection').style.display = 'block';
        cargarAlumnos();
        cargarMaterias();
    } else if (userRole === 'alumno') {
        document.getElementById('alumnoSection').style.display = 'block';
        cargarNotasAlumno();
    }
});

// Funciones para profesores
function cargarAlumnos() {
    // Aquí deberías hacer una llamada a tu API para obtener la lista de alumnos
    const alumnos = [
        { id: 1, nombre: 'Juan Pérez' },
        { id: 2, nombre: 'María García' }
        // Agregar más alumnos según necesites
    ];
    
    const selectAlumnos = document.getElementById('alumno');
    alumnos.forEach(alumno => {
        const option = document.createElement('option');
        option.value = alumno.id;
        option.textContent = alumno.nombre;
        selectAlumnos.appendChild(option);
    });
}

async function cargarMaterias() {
    try {
        const response = await fetch('/api/materias', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Error al cargar materias');
        }

        const selectMaterias = document.getElementById('materia');
        // Limpiar opciones existentes
        selectMaterias.innerHTML = '<option value="">Seleccione una materia</option>';
        
        // Agregar las materias desde el servidor
        data.materias.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia.id;
            option.textContent = materia.nombre;
            selectMaterias.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar materias:', error);
        alert('Error al cargar las materias. Por favor, intente nuevamente.');
    }
}

// Manejar el envío del formulario
document.getElementById('notasForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const data = {
        alumnoId: document.getElementById('alumno').value,
        materiaId: document.getElementById('materia').value,
        nota: document.getElementById('nota').value,
        periodo: document.getElementById('periodo').value
    };

    await guardarNota(data);
});

async function guardarNota(data) {
    try {
        const notaData = {
            alumnoId: parseInt(data.alumnoId),
            materiaId: parseInt(data.materiaId),
            nota: parseFloat(data.nota),
            periodo: parseInt(data.periodo)
        };

        const response = await fetch('/api/notas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([notaData]) // Enviar como array
        });

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

        const result = await response.json();
        if (result.success) {
            alert('Nota guardada exitosamente');
            document.getElementById('notasForm').reset();
        } else {
            throw new Error(result.message || 'Error al guardar la nota');
        }
    } catch (error) {
        console.error('Error al guardar la nota:', error);
        alert(`Error al guardar la nota: ${error.message}`);
    }
}

// Funciones para alumnos
async function cargarNotasAlumno() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('No se encontró el ID del usuario');
        }

        const response = await fetch(`/api/boletinnotas/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al obtener las notas');
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Error al cargar las notas');
        }

        // Organizar las notas por materia
        const notasPorMateria = {};
        data.notas.forEach(nota => {
            if (!notasPorMateria[nota.materia_nombre]) {
                notasPorMateria[nota.materia_nombre] = {
                    materia: nota.materia_nombre,
                    trimestre1: '-',
                    trimestre2: '-',
                    trimestre3: '-'
                };
            }
            notasPorMateria[nota.materia_nombre][`trimestre${nota.periodo}`] = nota.nota;
        });

        mostrarNotasEnTabla(Object.values(notasPorMateria));
    } catch (error) {
        console.error('Error al cargar las notas:', error);
        alert('Error al cargar las notas: ' + error.message);
    }
}

function mostrarNotasEnTabla(notas) {
    const tbody = document.getElementById('notasTableBody');
    tbody.innerHTML = '';
    
    notas.forEach(nota => {
        const tr = document.createElement('tr');
        
        // Convertir los valores a números para el cálculo del promedio
        const trim1 = nota.trimestre1 !== '-' ? parseFloat(nota.trimestre1) : null;
        const trim2 = nota.trimestre2 !== '-' ? parseFloat(nota.trimestre2) : null;
        const trim3 = nota.trimestre3 !== '-' ? parseFloat(nota.trimestre3) : null;
        
        // Calcular promedio solo si hay al menos una nota
        let promedio = '-';
        const notas = [trim1, trim2, trim3].filter(n => n !== null);
        if (notas.length > 0) {
            const sum = notas.reduce((a, b) => a + b, 0);
            promedio = (sum / notas.length).toFixed(2);
        }
        
        tr.innerHTML = `
            <td>${nota.materia}</td>
            <td>${nota.trimestre1}</td>
            <td>${nota.trimestre2}</td>
            <td>${nota.trimestre3}</td>
            <td>${promedio}</td>
        `;
        tbody.appendChild(tr);
    });
}
