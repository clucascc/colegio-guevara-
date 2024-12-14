/**
 * Módulo de Gestión de Usuarios
 * 
 * Este archivo maneja todas las operaciones relacionadas con usuarios:
 * - Obtener información de usuarios
 * - Actualizar perfiles de usuario
 * - Gestionar roles y permisos
 * - Administrar datos personales
 * 
 * Características principales:
 * - CRUD de usuarios
 * - Gestión de perfiles
 * - Validación de datos
 * - Control de acceso
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Obtener todos los usuarios
router.get('/list', (req, res) => {
    const query = 'SELECT id, email, username, role, fecha_registro FROM usuarios';
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener usuarios:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al obtener usuarios' 
            });
        }
        res.json({ success: true, users: results });
    });
});

// Buscar usuario por email
router.get('/search', (req, res) => {
    const { email } = req.query;
    const query = 'SELECT id, email, username, role, fecha_registro FROM usuarios WHERE email = ?';
    
    db.query(query, [email], (error, results) => {
        if (error) {
            console.error('Error al buscar usuario:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al buscar usuario' 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
        res.json({ success: true, user: results[0] });
    });
});

// Buscar usuarios por rol
router.get('/role/:role', (req, res) => {
    const { role } = req.params;
    const query = 'SELECT id, email, username, role, fecha_registro FROM usuarios WHERE role = ?';
    
    db.query(query, [role], (error, results) => {
        if (error) {
            console.error('Error al buscar usuarios por rol:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al buscar usuarios por rol' 
            });
        }
        
        res.json({ success: true, users: results });
    });
});

module.exports = router;
