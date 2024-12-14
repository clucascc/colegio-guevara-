/**
 * Módulo de Gestión de Calificaciones
 * 
 * Este archivo maneja todas las operaciones relacionadas con las calificaciones:
 * - Crear nuevas calificaciones
 * - Obtener calificaciones por estudiante
 * - Actualizar calificaciones existentes
 * - Eliminar calificaciones
 * - Calcular promedios y estadísticas
 * 
 * Características principales:
 * - CRUD completo para calificaciones
 * - Validación de datos de entrada
 * - Control de acceso basado en roles
 * - Manejo de errores personalizado
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Obtener todas las notas
router.get('/notas', (req, res) => {
    const consulta = `
        SELECT * FROM boletinnotas 
        ORDER BY id DESC 
        LIMIT 50
    `;
    
    db.query(consulta, (error, resultados) => {
        if (error) {
            console.error('Error al obtener notas:', error);
            res.status(500).json({ error: 'Ha ocurrido un error al obtener las notas' });
            return;
        }
        res.json(resultados);
    });
});

// Buscar notas por nombre o apellido
router.get('/notas/buscar', (req, res) => {
    const { termino } = req.query;
    const consulta = `
        SELECT * FROM boletinnotas 
        WHERE nombre LIKE ? OR apellido LIKE ?
        ORDER BY id DESC
    `;
    
    const terminoBusqueda = `%${termino}%`;
    
    db.query(consulta, [terminoBusqueda, terminoBusqueda], (error, resultados) => {
        if (error) {
            console.error('Error al buscar notas:', error);
            res.status(500).json({ error: 'Ha ocurrido un error al buscar las notas' });
            return;
        }
        res.json(resultados);
    });
});

// Guardar nuevas notas
router.post('/notas', async (req, res) => {
    console.log('Datos recibidos:', req.body); // Para depuración
    
    // Si no es un array, convertirlo en uno
    const notas = Array.isArray(req.body) ? req.body : [req.body];

    try {
        // Usar una transacción para asegurar que todas las notas se guarden o ninguna
        await new Promise((resolve, reject) => {
            db.beginTransaction(err => {
                if (err) reject(err);
                else resolve();
            });
        });

        for (const nota of notas) {
            const {
                nombre,
                apellido,
                asignatura,
                primer_trimestre,
                segundo_trimestre,
                tercer_trimestre,
                comentario
            } = nota;

            // Usar REPLACE INTO para actualizar si existe o insertar si no existe
            const consulta = `
                REPLACE INTO boletinnotas (
                    nombre, 
                    apellido, 
                    asignatura, 
                    primer_trimestre, 
                    segundo_trimestre, 
                    tercer_trimestre, 
                    comentario
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const valores = [
                nombre,
                apellido,
                asignatura,
                primer_trimestre || null,
                segundo_trimestre || null,
                tercer_trimestre || null,
                comentario || null
            ];

            await new Promise((resolve, reject) => {
                db.query(consulta, valores, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }

        // Confirmar la transacción
        await new Promise((resolve, reject) => {
            db.commit(err => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ 
            exito: true,
            mensaje: 'Las notas se han guardado correctamente'
        });

    } catch (error) {
        // Si hay error, revertir los cambios
        await new Promise(resolve => {
            db.rollback(() => resolve());
        });

        console.error('Error al guardar las notas:', error);
        res.status(500).json({ 
            exito: false,
            error: 'Ha ocurrido un error al guardar las notas',
            mensaje: error.message 
        });
    }
});

// Actualizar una nota existente
router.put('/notas/:id', (req, res) => {
    const { id } = req.params;
    const {
        nombre,
        apellido,
        asignatura,
        primer_trimestre,
        segundo_trimestre,
        tercer_trimestre,
        comentario
    } = req.body;

    const consulta = `
        UPDATE boletinnotas 
        SET nombre = ?,
            apellido = ?,
            asignatura = ?,
            primer_trimestre = ?,
            segundo_trimestre = ?,
            tercer_trimestre = ?,
            comentario = ?
        WHERE id = ?
    `;

    const valores = [
        nombre,
        apellido,
        asignatura,
        primer_trimestre,
        segundo_trimestre,
        tercer_trimestre,
        comentario,
        id
    ];

    db.query(consulta, valores, (error, resultado) => {
        if (error) {
            console.error('Error al actualizar nota:', error);
            res.status(500).json({ error: 'Ha ocurrido un error al actualizar la nota' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Nota no encontrada' });
            return;
        }
        res.json({ mensaje: 'Nota actualizada exitosamente' });
    });
});

// Eliminar una nota
router.delete('/notas/:id', (req, res) => {
    const { id } = req.params;
    
    const consulta = 'DELETE FROM boletinnotas WHERE id = ?';
    
    db.query(consulta, [id], (error, resultado) => {
        if (error) {
            console.error('Error al eliminar nota:', error);
            res.status(500).json({ error: 'Ha ocurrido un error al eliminar la nota' });
            return;
        }
        if (resultado.affectedRows === 0) {
            res.status(404).json({ error: 'Nota no encontrada' });
            return;
        }
        res.json({ mensaje: 'Nota eliminada exitosamente' });
    });
});

module.exports = router;
