/**
 * @fileoverview Módulo de inicialización y gestión de la base de datos
 * Este archivo contiene las funciones principales para la inicialización de la base de datos,
 * gestión de estudiantes y usuarios del sistema escolar.
 * 
 * @module init-database
 * @requires ./database
 * @requires fs
 * @requires path
 */

const db = require('./database');

/**
 * Inicializa la base de datos leyendo y ejecutando el archivo schema.sql
 * Este proceso crea todas las tablas necesarias y establece la estructura inicial de la base de datos
 * @function initializeDatabase
 */
function initializeDatabase() {
    // Las consultas SQL ahora están en schema.sql
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'schema.sql');
    
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        statements.forEach(statement => {
            if (statement.trim()) {
                db.query(statement, (err) => {
                    if (err) {
                        console.error('Error ejecutando SQL:', err);
                    }
                });
            }
        });
        
        console.log('Base de datos inicializada correctamente');
    } catch (err) {
        console.error('Error al leer o ejecutar schema.sql:', err);
    }
}

/**
 * Agrega un nuevo estudiante al sistema
 * Esta función maneja una transacción completa para crear un nuevo registro de estudiante,
 * incluyendo la creación del usuario y la información académica asociada
 * 
 * @function agregarEstudiante
 * @param {Object} datosEstudiante - Datos del estudiante a registrar
 * @param {string} datosEstudiante.email - Correo electrónico del estudiante
 * @param {string} datosEstudiante.username - Nombre de usuario
 * @param {string} datosEstudiante.password - Contraseña (será hasheada)
 * @param {string} datosEstudiante.nombre_completo - Nombre completo del estudiante
 * @param {string} datosEstudiante.grado - Grado o curso del estudiante
 * @returns {Promise} Promesa que resuelve cuando el estudiante ha sido agregado
 */
function agregarEstudiante(datosEstudiante) {
    return new Promise((resolve, reject) => {
        db.beginTransaction(async (err) => {
            if (err) {
                return reject(err);
            }

            try {
                // Primero insertar en la tabla usuarios
                const insertUsuario = `
                    INSERT INTO usuarios (email, username, password, role, nombre_completo, grado)
                    VALUES (?, ?, ?, 'estudiante', ?, ?)
                `;
                
                db.query(
                    insertUsuario,
                    [
                        datosEstudiante.email,
                        datosEstudiante.username,
                        datosEstudiante.password,
                        datosEstudiante.nombre_completo,
                        datosEstudiante.grado
                    ],
                    (error, results) => {
                        if (error) {
                            return db.rollback(() => {
                                reject(error);
                            });
                        }

                        const usuarioId = results.insertId;

                        // Luego insertar en datos_estudiante si hay datos adicionales
                        if (datosEstudiante.datos_adicionales) {
                            const insertDatos = `
                                INSERT INTO datos_estudiante (
                                    usuario_id, direccion, telefono, fecha_nacimiento,
                                    nombre_padre, nombre_madre, telefono_emergencia,
                                    alergias, grupo_sanguineo
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `;

                            db.query(
                                insertDatos,
                                [
                                    usuarioId,
                                    datosEstudiante.datos_adicionales.direccion || null,
                                    datosEstudiante.datos_adicionales.telefono || null,
                                    datosEstudiante.datos_adicionales.fecha_nacimiento || null,
                                    datosEstudiante.datos_adicionales.nombre_padre || null,
                                    datosEstudiante.datos_adicionales.nombre_madre || null,
                                    datosEstudiante.datos_adicionales.telefono_emergencia || null,
                                    datosEstudiante.datos_adicionales.alergias || null,
                                    datosEstudiante.datos_adicionales.grupo_sanguineo || null
                                ],
                                (error) => {
                                    if (error) {
                                        return db.rollback(() => {
                                            reject(error);
                                        });
                                    }

                                    db.commit((err) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                reject(err);
                                            });
                                        }
                                        resolve(usuarioId);
                                    });
                                }
                            );
                        } else {
                            db.commit((err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        reject(err);
                                    });
                                }
                                resolve(usuarioId);
                            });
                        }
                    }
                );
            } catch (error) {
                db.rollback(() => {
                    reject(error);
                });
            }
        });
    });
}

/**
 * Busca un estudiante en la base de datos
 * Permite buscar estudiantes por diferentes criterios como ID, email o nombre de usuario
 * 
 * @function buscarEstudiante
 * @param {Object} criterio - Criterios de búsqueda
 * @returns {Promise} Promesa que resuelve con los datos del estudiante encontrado
 */
function buscarEstudiante(criterio) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT u.*, de.*
            FROM usuarios u
            LEFT JOIN datos_estudiante de ON u.id = de.usuario_id
            WHERE (u.email = ? OR u.username = ?) AND u.role = 'estudiante'
        `;
        
        db.query(query, [criterio, criterio], (error, results) => {
            if (error) {
                reject('Error al buscar estudiante: ' + error.message);
            } else {
                resolve(results.length > 0 ? results[0] : null);
            }
        });
    });
}

/**
 * Registra un nuevo usuario en el sistema
 * Maneja el registro de diferentes tipos de usuarios (estudiantes, profesores, administradores)
 * 
 * @function registrarUsuario
 * @param {Object} datosUsuario - Datos del usuario a registrar
 * @param {string} datosUsuario.role - Rol del usuario (estudiante, profesor, admin)
 * @returns {Promise} Promesa que resuelve cuando el usuario ha sido registrado
 */
function registrarUsuario(datosUsuario) {
    return new Promise((resolve, reject) => {
        db.beginTransaction(async (err) => {
            if (err) {
                return reject(err);
            }

            try {
                // Insertar en la tabla usuarios
                const insertUsuario = `
                    INSERT INTO usuarios (email, username, password, role)
                    VALUES (?, ?, ?, ?)
                `;
                
                const [userResult] = await db.promise().query(
                    insertUsuario,
                    [
                        datosUsuario.email,
                        datosUsuario.username,
                        datosUsuario.password,
                        datosUsuario.role
                    ]
                );

                const usuarioId = userResult.insertId;

                // Insertar en la tabla específica según el rol
                switch(datosUsuario.role) {
                    case 'estudiante':
                        await db.promise().query(
                            'INSERT INTO estudiantes (usuario_id, grado, seccion) VALUES (?, ?, ?)',
                            [usuarioId, datosUsuario.grado, datosUsuario.seccion]
                        );
                        break;
                    case 'profesor':
                        await db.promise().query(
                            'INSERT INTO profesores (usuario_id, especialidad, departamento) VALUES (?, ?, ?)',
                            [usuarioId, datosUsuario.especialidad, datosUsuario.departamento]
                        );
                        break;
                    case 'admin':
                        await db.promise().query(
                            'INSERT INTO administradores (usuario_id, nivel_acceso, departamento) VALUES (?, ?, ?)',
                            [usuarioId, datosUsuario.nivel_acceso || 'bajo', datosUsuario.departamento]
                        );
                        break;
                    default:
                        throw new Error('Rol no válido');
                }

                await db.promise().commit();
                resolve(usuarioId);
            } catch (error) {
                await db.promise().rollback();
                reject(error);
            }
        });
    });
}

module.exports = {
    initializeDatabase,
    agregarEstudiante,
    buscarEstudiante,
    registrarUsuario
};
