/**
 * Módulo Principal de la Aplicación
 * 
 * Este archivo contiene la lógica principal del lado del cliente:
 * - Inicialización de componentes
 * - Configuración global
 * - Gestión de eventos principales
 * - Funciones de utilidad comunes
 * 
 * Funcionalidades principales:
 * - Configuración inicial de la aplicación
 * - Manejo de navegación
 * - Gestión del estado global
 * - Utilidades compartidas
 */

// Esperar a que el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Cargar notas al iniciar la página
    cargarNotas();

    // Configurar el buscador
    const buscador = document.getElementById('buscador');
    if (buscador) {
        buscador.addEventListener('input', async (e) => {
            const termino = e.target.value;
            if (termino.length >= 3) {
                try {
                    const notas = await buscarNotas(termino);
                    mostrarNotas(notas);
                } catch (error) {
                    mostrarError('Error al buscar notas');
                }
            } else if (termino.length === 0) {
                cargarNotas();
            }
        });
    }

    // Configurar el formulario de nueva nota
    const formularioNotas = document.getElementById('formulario-notas');
    if (formularioNotas) {
        formularioNotas.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datosNota = {
                nombre: formularioNotas.nombre.value,
                apellido: formularioNotas.apellido.value,
                asignatura: formularioNotas.asignatura.value,
                primer_trimestre: formularioNotas.primer_trimestre.value,
                segundo_trimestre: formularioNotas.segundo_trimestre.value,
                tercer_trimestre: formularioNotas.tercer_trimestre.value,
                comentario: formularioNotas.comentario.value
            };

            try {
                await guardarNota(datosNota);
                formularioNotas.reset();
                mostrarMensaje('Nota guardada exitosamente');
                cargarNotas(); // Recargar la lista de notas
            } catch (error) {
                mostrarError('Error al guardar la nota');
            }
        });
    }
});

// Función para cargar todas las notas
async function cargarNotas() {
    try {
        const notas = await obtenerNotas();
        mostrarNotas(notas);
    } catch (error) {
        mostrarError('Error al cargar las notas');
    }
}

// Función para mostrar las notas en la página
function mostrarNotas(notas) {
    const contenedorNotas = document.getElementById('lista-notas');
    if (!contenedorNotas) return;

    contenedorNotas.innerHTML = '';
    
    notas.forEach(nota => {
        const notaElement = document.createElement('div');
        notaElement.className = 'nota-item';
        notaElement.innerHTML = `
            <h3>${nota.nombre} ${nota.apellido}</h3>
            <p>Asignatura: ${nota.asignatura}</p>
            <p>Trimestres: ${nota.primer_trimestre} | ${nota.segundo_trimestre} | ${nota.tercer_trimestre}</p>
            <p>Comentario: ${nota.comentario || 'Sin comentarios'}</p>
            <div class="acciones">
                <button onclick="editarNota(${nota.id})">Editar</button>
                <button onclick="confirmarEliminar(${nota.id})">Eliminar</button>
            </div>
        `;
        contenedorNotas.appendChild(notaElement);
    });
}

// Función para editar una nota
async function editarNota(id) {
    // Aquí puedes implementar la lógica para mostrar un formulario de edición
    // y usar la función actualizarNota cuando se envíe
}

// Función para confirmar y eliminar una nota
function confirmarEliminar(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
        eliminarNota(id)
            .then(() => {
                mostrarMensaje('Nota eliminada exitosamente');
                cargarNotas();
            })
            .catch(() => mostrarError('Error al eliminar la nota'));
    }
}

// Funciones auxiliares para mostrar mensajes
function mostrarMensaje(mensaje) {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = 'alerta exito';
    alertaDiv.textContent = mensaje;
    document.body.appendChild(alertaDiv);
    setTimeout(() => alertaDiv.remove(), 3000);
}

function mostrarError(mensaje) {
    const alertaDiv = document.createElement('div');
    alertaDiv.className = 'alerta error';
    alertaDiv.textContent = mensaje;
    document.body.appendChild(alertaDiv);
    setTimeout(() => alertaDiv.remove(), 3000);
}
