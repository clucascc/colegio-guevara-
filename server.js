const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

const pool = mysql.createPool(dbConfig);

// Configuración de Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'HTML pagina')));
app.use('/css', express.static(path.join(__dirname, 'HTML pagina/css')));
app.use('/images', express.static(path.join(__dirname, 'HTML pagina/images')));
app.use('/js', express.static(path.join(__dirname, 'HTML pagina/js')));

// Configurar CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurar sesiones
app.use(session({
    secret: 'K7RSbUXq$m2d9v#P',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
    },
    name: 'sessionId'
}));

// Middleware para verificar sesión
const verificarSesion = (req, res, next) => {
    console.log('Verificando sesión:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        role: req.session.role
    });
    
    if (!req.session.userId) {
        console.log('No hay sesión activa');
        return res.status(401).json({
            success: false,
            message: 'No hay sesión activa',
            redirectUrl: '/login'
        });
    }
    next();
};

// Middleware para verificar el rol de profesor
const verificarRolProfesor = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    if (req.session.user.rol !== 'profesor') {
        console.log('Acceso denegado: usuario no es profesor');
        return res.status(403).json({ 
            error: 'Acceso denegado',
            message: 'Solo los profesores pueden acceder a esta página'
        });
    }
    next();
};

// Middleware para debugging
app.use((req, res, next) => {
    if (req.path.endsWith('.css')) {
        console.log('Intentando acceder a CSS:', req.path);
        console.log('Ruta completa:', path.join(__dirname, 'HTML pagina', req.path));
    }
    next();
});

// Middleware para manejar errores 404 en archivos estáticos
app.use((req, res, next) => {
    if (req.path.endsWith('.css')) {
        console.log('Intentando acceder a CSS:', req.path);
    }
    next();
});

// Middleware para verificar la autenticación
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        res.status(401).json({ error: 'No has iniciado sesión' });
        return;
    }
    next();
};

// Middleware para verificar roles
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('/login.html');
            return;
        }

        try {
            const [rows] = await pool.query('SELECT role FROM usuarios WHERE id = ?', [req.session.userId]);
            
            if (rows.length === 0) {
                res.redirect('/login.html');
                return;
            }

            const userRole = rows[0].role;
            
            if (!allowedRoles.includes(userRole)) {
                res.status(403).send(`
                    <html>
                        <head>
                            <title>Acceso Denegado</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    height: 100vh;
                                    margin: 0;
                                    background-color: #f5f5f5;
                                }
                                .error-container {
                                    text-align: center;
                                    padding: 2rem;
                                    background-color: white;
                                    border-radius: 8px;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                }
                                h1 { color: #d32f2f; }
                                p { color: #666; }
                                .back-button {
                                    margin-top: 1rem;
                                    padding: 0.5rem 1rem;
                                    background-color: #1976d2;
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 4px;
                                }
                                .back-button:hover {
                                    background-color: #1565c0;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="error-container">
                                <h1>Acceso Denegado</h1>
                                <p>Lo sentimos, no tienes permiso para acceder a esta página.</p>
                                <a href="javascript:history.back()" class="back-button">Volver</a>
                            </div>
                        </body>
                    </html>
                `);
                return;
            }
            
            next();
        } catch (error) {
            console.error('Error al verificar el rol:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
};

// Rutas públicas (login y registro)
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'HTML pagina', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'HTML pagina', 'login.html'));
    }
});

app.get('/login', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'HTML pagina', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'HTML pagina', 'login.html'));
    }
});

app.get('/index.html', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'HTML pagina', 'index.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML pagina', 'login.html'));
});

// Ruta para boletin.html
app.get('/boletin.html', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login.html');
        return;
    }
    if (req.session.role !== 'profesor' && req.session.role !== 'admin') {
        res.status(403).send('Acceso denegado: Solo profesores y administradores pueden acceder a esta página');
        return;
    }
    res.sendFile(path.join(__dirname, 'HTML pagina', 'boletin.html'));
});

// Rutas específicas para páginas protegidas
app.get('/ver_notas.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML pagina', 'ver_notas.html'));
});

app.get('/programas.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML pagina', 'programas.html'));
});

app.get('/notas.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML pagina', 'notas.html'));
});

app.get('/Horarios.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML pagina', 'Horarios.html'));
});

app.get('/cursos.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML pagina', 'cursos.html'));
});

// Middleware de protección para rutas privadas (para otras rutas que puedan agregarse en el futuro)
app.use(['/boletin.html', '/notas.html', '/cursos.html', '/programas.html'], (req, res, next) => {
    if (!req.session.userId) {
        res.redirect('/login');
    } else {
        next();
    }
});

// Ruta específica para el registro
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, role, nombre, apellido, grado, seccion } = req.body;
        
        // Validar campos requeridos
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }

        // Validar campos específicos según el rol
        if (role === 'estudiante' && (!nombre || !apellido || !grado || !seccion)) {
            return res.status(400).json({
                success: false,
                message: 'Para estudiantes, nombre, apellido, grado y sección son obligatorios'
            });
        }

        if (role === 'profesor' && (!nombre || !apellido)) {
            return res.status(400).json({
                success: false,
                message: 'Para profesores, nombre y apellido son obligatorios'
            });
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.query(
            'SELECT * FROM usuarios WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            const isUsernameTaken = existingUsers.some(user => user.username === username);
            const isEmailTaken = existingUsers.some(user => user.email === email);

            if (isUsernameTaken) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }

            if (isEmailTaken) {
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
        }

        // Insertar nuevo usuario
        const [result] = await pool.query(
            'INSERT INTO usuarios (username, email, password, role, nombre, apellido, grado, seccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, password, role, nombre, apellido, grado || null, seccion || null]
        );

        console.log('Usuario registrado:', result);

        res.json({
            success: true,
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
});

// Ruta específica para el login
app.post('/login', async (req, res) => {
    const { username, email, password, role } = req.body;
    console.log('Datos recibidos en login:', { 
        username, 
        email, 
        role,
        passwordLength: password ? password.length : 0 
    });

    try {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE username = ? AND email = ? AND role = ?',
            [username, email, role]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        const user = rows[0];
        if (user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Contraseña incorrecta' 
            });
        }

        // Establecer la sesión
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.username = user.username;
        
        // Guardar la sesión explícitamente
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar la sesión:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error al iniciar sesión' 
                });
            }
            
            console.log('Sesión guardada:', {
                sessionId: req.sessionID,
                userId: req.session.userId,
                role: req.session.role
            });

            res.json({ 
                success: true, 
                message: 'Login exitoso',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor: ' + error.message 
        });
    }
});

// Ruta para verificar el estado de la sesión
app.get('/api/auth/session-status', (req, res) => {
    console.log('Verificando estado de sesión:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        role: req.session.role
    });
    
    if (req.session.userId) {
        res.json({
            success: true,
            isAuthenticated: true,
            user: {
                id: req.session.userId,
                role: req.session.role,
                username: req.session.username
            }
        });
    } else {
        res.json({
            success: true,
            isAuthenticated: false
        });
    }
});

// Ruta de logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Endpoint para obtener el rol del usuario
app.get('/api/user/role', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'No autenticado',
                redirectUrl: '/login.html'
            });
        }

        const [users] = await pool.query(
            'SELECT role, username FROM usuarios WHERE id = ?', 
            [req.session.userId]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            role: users[0].role,
            username: users[0].username
        });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
});

// Endpoint para verificar el rol del usuario
app.get('/api/auth/check-role', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [user] = await connection.query(
            'SELECT role FROM usuarios WHERE id = ?',
            [req.session.userId]
        );

        if (!user || user.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            role: user[0].role
        });
    } catch (error) {
        console.error('Error al verificar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar rol de usuario'
        });
    } finally {
        connection.release();
    }
});

// Rutas de autenticación
app.post('/api/auth/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Verificando email:', email);
        const [rows] = await pool.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        console.log('Resultado de la búsqueda:', rows);
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        console.error('Error al verificar email:', error);
        res.status(500).json({ error: 'Error al verificar email' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        const { username, email, password, role, grado, seccion, especialidad, departamento, nombreEstudiante, apellidoEstudiante } = req.body;
        
        // Verificar si el usuario ya existe
        const [existingUsers] = await pool.execute(
            'SELECT * FROM usuarios WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El usuario o email ya existe'
            });
        }
        
        // Insertar el nuevo usuario
        const [result] = await pool.execute(
            'INSERT INTO usuarios (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, password, role]
        );
        
        const userId = result.insertId;
        
        // Si es estudiante, guardar información adicional
        if (role === 'estudiante') {
            await pool.execute(
                'INSERT INTO estudiantes (usuario_id, grado, seccion, nombre, apellido) VALUES (?, ?, ?, ?, ?)',
                [userId, grado, seccion, nombreEstudiante, apellidoEstudiante]
            );
        }
        // Si es profesor, guardar información adicional
        else if (role === 'profesor') {
            await pool.execute(
                'INSERT INTO profesores (usuario_id, especialidad, departamento) VALUES (?, ?, ?)',
                [userId, especialidad, departamento]
            );
        }
        
        res.json({
            success: true,
            message: 'Usuario registrado exitosamente',
            redirectUrl: '/index.html'
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el registro: ' + error.message
        });
    }
});

// Middleware para verificar rol de profesor o admin
const verificarProfesorOAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        const [users] = await pool.query('SELECT role FROM usuarios WHERE id = ?', [req.session.userId]);
        
        if (!users || users.length === 0 || (users[0].role !== 'profesor' && users[0].role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'No tiene permisos para realizar esta acción' });
        }

        next();
    } catch (error) {
        console.error('Error en verificación de rol:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// Rutas protegidas
app.use('/api/notas', requireAuth);
app.use('/api/usuarios', requireAuth);

// Endpoint para obtener las notas del estudiante logueado
app.get('/api/notas/misnotas', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Obtener información del estudiante desde la tabla usuarios
        const [estudiante] = await connection.query(
            'SELECT id, username as nombre, email, role FROM usuarios WHERE id = ? AND role = "estudiante"',
            [req.session.userId]
        );

        if (!estudiante || estudiante.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado'
            });
        }

        // Obtener las notas del estudiante usando la tabla boletinnotas
        const [notas] = await connection.query(`
            SELECT bn.*
            FROM boletinnotas bn
            WHERE bn.alumno_id = ?
            ORDER BY bn.materia_id, bn.periodo`,
            [estudiante[0].id]
        );

        // Agrupar notas por materia
        const notasAgrupadas = notas.map(nota => ({
            ...nota,
            periodo_nombre: `${nota.periodo} Trimestre`,
            materia_nombre: obtenerNombreMateria(nota.materia_id)
        }));

        res.json({
            success: true,
            estudiante: estudiante[0],
            notas: notasAgrupadas
        });
    } catch (error) {
        console.error('Error al obtener notas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las notas'
        });
    } finally {
        connection.release();
    }
});

// Endpoint para guardar notas (usado por el profesor)
app.post('/api/notas/guardar', requireAuth, verificarProfesorOAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { estudiante_id, notas } = req.body;

        // Verificar que el estudiante existe en la tabla usuarios
        const [estudiante] = await connection.query(
            'SELECT id FROM usuarios WHERE id = ? AND role = "estudiante"',
            [estudiante_id]
        );

        if (!estudiante || estudiante.length === 0) {
            throw new Error('Estudiante no encontrado');
        }

        // Guardar cada nota en la tabla boletinnotas
        for (const nota of notas) {
            await connection.query(
                `INSERT INTO boletinnotas (alumno_id, materia_id, nota, periodo) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE nota = VALUES(nota)`,
                [estudiante_id, nota.materia_id, nota.nota, nota.periodo]
            );
        }

        await connection.commit();
        res.json({
            success: true,
            message: 'Notas guardadas correctamente'
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al guardar notas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar las notas: ' + error.message
        });
    } finally {
        connection.release();
    }
});

// Ruta para obtener notas
app.get('/api/notas/:alumnoId', async (req, res) => {
    try {
        // Verificar si existe la tabla
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'boletinnotas'
        `, [process.env.DB_NAME]);

        if (tables.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'La tabla de notas no está configurada. Por favor, contacte al administrador.'
            });
        }

        const [notas] = await pool.execute(
            'SELECT bn.*, m.nombre as materia_nombre FROM boletinnotas bn ' +
            'LEFT JOIN materias m ON bn.materia_id = m.id ' +
            'WHERE bn.alumno_id = ?',
            [req.params.alumnoId]
        );
        res.json({ success: true, notas });
    } catch (error) {
        console.error('Error al obtener notas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener notas',
            error: error.message
        });
    }
});

// Ruta para agregar notas (solo profesores y admin)
app.post('/api/notas', verificarProfesorOAdmin, async (req, res) => {
    console.log('Recibida petición para agregar nota');
    console.log('Contenido del body:', req.body);
    
    try {
        const notas = req.body;
        
        if (!Array.isArray(notas)) {
            return res.status(400).json({
                success: false,
                message: 'El formato de los datos es incorrecto. Se espera un array de notas.'
            });
        }

        // Verificar cada nota
        for (const nota of notas) {
            if (!nota.alumnoId || !nota.materiaId || nota.nota === undefined || !nota.periodo) {
                return res.status(400).json({
                    success: false,
                    message: 'Cada nota debe tener alumnoId, materiaId, nota y periodo'
                });
            }
        }

        // Iniciar transacción
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const nota of notas) {
                // Verificar si ya existe una nota para este alumno, materia y periodo
                const [existingNota] = await connection.execute(
                    'SELECT id FROM boletinnotas WHERE alumno_id = ? AND materia_id = ? AND periodo = ?',
                    [nota.alumnoId, nota.materiaId, nota.periodo]
                );

                if (existingNota.length > 0) {
                    // Actualizar nota existente
                    await connection.execute(
                        'UPDATE boletinnotas SET nota = ?, fecha = NOW() WHERE alumno_id = ? AND materia_id = ? AND periodo = ?',
                        [nota.nota, nota.alumnoId, nota.materiaId, nota.periodo]
                    );
                } else {
                    // Insertar nueva nota
                    await connection.execute(
                        'INSERT INTO boletinnotas (alumno_id, materia_id, nota, periodo, fecha) VALUES (?, ?, ?, ?, NOW())',
                        [nota.alumnoId, nota.materiaId, nota.nota, nota.periodo]
                    );
                }
            }

            // Confirmar transacción
            await connection.commit();
            res.json({ 
                success: true, 
                message: 'Notas guardadas correctamente en el boletín'
            });

        } catch (error) {
            // Revertir transacción en caso de error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error al guardar notas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar las notas',
            error: error.message
        });
    }
});

// Ruta para buscar notas por nombre de estudiante
app.get('/api/notas/buscar', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const alumnoId = req.query.id;
        
        // Consulta con COALESCE para manejar valores nulos
        const [notas] = await connection.query(
            `SELECT 
                bn.id,
                bn.alumno_id,
                bn.materia_id,
                bn.periodo,
                COALESCE(bn.nota, 0) as nota,
                COALESCE(m.nombre, 'Sin especificar') as materia_nombre,
                COALESCE(e.nombre, '') as estudiante_nombre,
                COALESCE(e.apellido, '') as estudiante_apellido,
                COALESCE(e.grado, '') as grado,
                COALESCE(e.seccion, '') as seccion
            FROM boletinnotas bn
            INNER JOIN materias m ON bn.materia_id = m.id
            INNER JOIN estudiantes e ON bn.alumno_id = e.id
            WHERE bn.alumno_id = ?
            ORDER BY bn.periodo ASC, m.nombre ASC`,
            [alumnoId]
        );

        // Verificar si se encontraron notas
        if (!notas || notas.length === 0) {
            // Si no hay notas, buscar al menos la info del estudiante
            const [estudiante] = await connection.query(
                `SELECT 
                    id,
                    COALESCE(nombre, '') as nombre,
                    COALESCE(apellido, '') as apellido,
                    COALESCE(grado, '') as grado,
                    COALESCE(seccion, '') as seccion
                FROM estudiantes 
                WHERE id = ?`,
                [alumnoId]
            );

            if (!estudiante || estudiante.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró el estudiante'
                });
            }

            return res.json({
                success: true,
                estudiante: estudiante[0],
                notas: []
            });
        }

        // Si hay notas, devolver toda la información
        const estudiante = {
            id: notas[0].alumno_id,
            nombre: notas[0].estudiante_nombre,
            apellido: notas[0].estudiante_apellido,
            grado: notas[0].grado,
            seccion: notas[0].seccion
        };

        res.json({
            success: true,
            estudiante: estudiante,
            notas: notas.map(nota => ({
                id: nota.id,
                materia_nombre: nota.materia_nombre,
                nota: nota.nota,
                periodo: nota.periodo,
                periodo_nombre: nota.periodo === 1 ? 'Primer Trimestre' : 
                              nota.periodo === 2 ? 'Segundo Trimestre' : 
                              'Tercer Trimestre'
            }))
        });

    } catch (error) {
        console.error('Error al buscar notas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar las notas',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Ruta para guardar notas
app.post('/api/notas/guardar', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let notas = req.body;
        console.log('Notas recibidas:', JSON.stringify(notas, null, 2));

        // Verificar datos requeridos
        if (!notas || !Array.isArray(notas) || notas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos incompletos o inválidos'
            });
        }

        // Verificar que todas las notas son del mismo estudiante
        const alumnoId = notas[0].alumnoId;

        // Verificar que el alumno existe
        const [alumno] = await connection.query(
            `SELECT id, grado, seccion, nombre, apellido 
             FROM estudiantes 
             WHERE id = ?`,
            [alumnoId]
        );

        if (!alumno || alumno.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el estudiante especificado'
            });
        }

        // Si es una sola nota, solo actualizamos esa nota específica
        if (notas.length === 1) {
            const nota = notas[0];
            console.log('Actualizando nota única:', JSON.stringify(nota, null, 2));

            // Verificar si la nota ya existe
            const [existingNota] = await connection.query(
                'SELECT id FROM boletinnotas WHERE alumno_id = ? AND materia_id = ? AND periodo = ?',
                [nota.alumnoId, nota.materiaId, nota.periodo]
            );

            if (existingNota.length > 0) {
                // Actualizar la nota existente
                await connection.query(
                    'UPDATE boletinnotas SET nota = ?, fecha_actualizacion = NOW() WHERE alumno_id = ? AND materia_id = ? AND periodo = ?',
                    [nota.nota, nota.alumnoId, nota.materiaId, nota.periodo]
                );
                console.log('Nota actualizada');
            } else {
                // Insertar nueva nota
                await connection.query(
                    'INSERT INTO boletinnotas (alumno_id, materia_id, nota, periodo, fecha_creacion) VALUES (?, ?, ?, ?, NOW())',
                    [nota.alumnoId, nota.materiaId, nota.nota, nota.periodo]
                );
                console.log('Nueva nota insertada');
            }

            // Obtener la nota guardada para confirmar
            const [notaGuardada] = await connection.query(
                `SELECT bn.*, m.nombre as materia_nombre 
                 FROM boletinnotas bn 
                 LEFT JOIN materias m ON bn.materia_id = m.id 
                 WHERE bn.alumno_id = ? AND bn.materia_id = ? AND bn.periodo = ?`,
                [nota.alumnoId, nota.materiaId, nota.periodo]
            );
            console.log('Nota guardada:', notaGuardada);
        }

        await connection.commit();
        console.log('Transacción completada exitosamente');

        res.json({
            success: true,
            message: 'Nota guardada exitosamente',
            notasActualizadas: notas.length
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error al guardar notas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar las notas',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Endpoint para obtener todas las materias
app.get('/api/materias', requireAuth, async (req, res) => {
    try {
        console.log('Obteniendo lista de materias...');
        const [materias] = await pool.query(
            'SELECT id, TRIM(nombre) as nombre, descripcion FROM materias ORDER BY nombre'
        );
        console.log('Materias encontradas:', materias);

        if (!materias || materias.length === 0) {
            console.log('No se encontraron materias');
            return res.json({ 
                success: true, 
                materias: [],
                message: 'No hay materias registradas' 
            });
        }

        // Limpiar y capitalizar los nombres de las materias
        const materiasFormateadas = materias.map(materia => ({
            id: materia.id,
            nombre: materia.nombre.trim().replace(/^\w/, (c) => c.toUpperCase()),
            descripcion: materia.descripcion
        }));

        res.json({ 
            success: true, 
            materias: materiasFormateadas
        });
    } catch (error) {
        console.error('Error al obtener materias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener materias',
            error: error.message
        });
    }
});

// Obtener notas del boletín para un alumno específico
app.get('/api/boletinnotas/:alumnoId', requireAuth, async (req, res) => {
    try {
        // Verificar que el usuario solo pueda ver sus propias notas o sea profesor/admin
        if (req.session.role !== 'profesor' && req.session.role !== 'admin' && req.session.userId !== parseInt(req.params.alumnoId)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver estas notas'
            });
        }

        const [notas] = await pool.execute(
            `SELECT bn.*, m.nombre as materia_nombre 
             FROM boletinnotas bn 
             LEFT JOIN materias m ON bn.materia_id = m.id 
             WHERE bn.alumno_id = ?
             ORDER BY m.nombre, bn.periodo`,
            [req.params.alumnoId]
        );

        res.json({ 
            success: true, 
            notas: notas
        });
    } catch (error) {
        console.error('Error al obtener notas del boletín:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las notas del boletín',
            error: error.message
        });
    }
});

// Ruta para buscar estudiantes (autocompletado)
app.get('/api/estudiantes/buscar', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const busqueda = req.query.q || '';
        console.log('Buscando estudiantes:', busqueda);

        if (!busqueda) {
            return res.json({
                success: true,
                estudiantes: []
            });
        }

        const [estudiantes] = await connection.query(
            `SELECT 
                e.id as estudiante_id,
                COALESCE(e.nombre, '') as nombre,
                COALESCE(e.apellido, '') as apellido,
                COALESCE(e.grado, '') as grado,
                COALESCE(e.seccion, '') as seccion
             FROM estudiantes e
             WHERE LOWER(CONCAT(e.nombre, ' ', e.apellido)) LIKE LOWER(?)
             ORDER BY e.grado, e.seccion, e.apellido, e.nombre
             LIMIT 10`,
            [`%${busqueda}%`]
        );

        res.json({
            success: true,
            estudiantes: estudiantes.map(e => ({
                id: e.estudiante_id,
                nombre: e.nombre,
                apellido: e.apellido,
                grado: e.grado,
                seccion: e.seccion,
                texto: `${e.nombre} ${e.apellido} - ${e.grado}° ${e.seccion}`
            }))
        });

    } catch (error) {
        console.error('Error al buscar estudiantes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar estudiantes',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Ruta para verificar usuarios (temporal)
app.get('/check-users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT username, email, role FROM usuarios');
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Función para crear las tablas si no existen
async function crearTablasSiNoExisten() {
    const connection = await pool.getConnection();
    try {
        // Verificar si la tabla usuarios existe
        const [tables] = await connection.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'usuarios'
        `);

        if (tables.length === 0) {
            // Si la tabla no existe, la creamos
            await connection.query(`
                CREATE TABLE usuarios (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    nombre VARCHAR(100),
                    apellido VARCHAR(100),
                    grado VARCHAR(10),
                    seccion VARCHAR(10),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            console.log('Tabla usuarios creada correctamente');
        } else {
            // Si la tabla existe, verificamos y agregamos las columnas faltantes
            const [columns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'usuarios'
            `);

            const columnNames = columns.map(col => col.COLUMN_NAME.toLowerCase());

            // Lista de columnas que necesitamos
            const requiredColumns = [
                { name: 'nombre', type: 'VARCHAR(100)' },
                { name: 'apellido', type: 'VARCHAR(100)' },
                { name: 'grado', type: 'VARCHAR(10)' },
                { name: 'seccion', type: 'VARCHAR(10)' }
            ];

            // Agregar columnas faltantes
            for (const col of requiredColumns) {
                if (!columnNames.includes(col.name.toLowerCase())) {
                    await connection.query(`
                        ALTER TABLE usuarios 
                        ADD COLUMN ${col.name} ${col.type}
                    `);
                    console.log(`Columna ${col.name} agregada a la tabla usuarios`);
                }
            }
            console.log('Estructura de la tabla usuarios verificada y actualizada');
        }
    } catch (error) {
        console.error('Error al crear/actualizar las tablas:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Función para iniciar el servidor
async function iniciarServidor() {
    try {
        // Primero intentamos cerrar cualquier servidor existente
        const exec = require('child_process').exec;
        
        // Función para liberar el puerto
        const liberarPuerto = () => {
            return new Promise((resolve, reject) => {
                exec(`npx kill-port ${PORT}`, (err) => {
                    if (err) {
                        console.error('Error al liberar el puerto:', err);
                        reject(err);
                        return;
                    }
                    console.log(`Puerto ${PORT} liberado`);
                    resolve();
                });
            });
        };

        try {
            await liberarPuerto();
        } catch (error) {
            console.log('No había proceso en el puerto o error al liberarlo:', error);
        }

        // Luego iniciamos el nuevo servidor
        const server = app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log(`\nAccede a la aplicación en:`);
            console.log(`➜ Login: http://localhost:${PORT}/login.html`);
            console.log(`➜ Registro: http://localhost:${PORT}/login.html (Haz clic en "Registrarse")`);
        });

        // Manejar errores del servidor
        server.on('error', async (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log('Puerto en uso, intentando liberar...');
                try {
                    await liberarPuerto();
                    // Esperar un momento y volver a intentar iniciar el servidor
                    setTimeout(() => iniciarServidor(), 1000);
                } catch (err) {
                    console.error('Error al liberar el puerto:', err);
                }
            } else {
                console.error('Error en el servidor:', error);
            }
        });

        return server;
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        throw error;
    }
}

// Llamar a la función cuando se inicia el servidor
crearTablasSiNoExisten()
    .then(() => {
        console.log('Base de datos inicializada correctamente');
        return iniciarServidor();
    })
    .then(server => {
        // Manejar el cierre limpio del servidor
        process.on('SIGTERM', () => {
            console.log('Recibida señal SIGTERM. Cerrando servidor...');
            server.close(() => {
                console.log('Servidor cerrado');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('Recibida señal SIGINT. Cerrando servidor...');
            server.close(() => {
                console.log('Servidor cerrado');
                process.exit(0);
            });
        });
    })
    .catch(error => {
        console.error('Error al inicializar:', error);
        process.exit(1);
    });

// Función auxiliar para obtener el nombre de la materia
function obtenerNombreMateria(materiaId) {
    const materias = {
        1: 'Matemáticas',
        2: 'Inglés',
        3: 'Autogestión',
        4: 'Hardware',
        5: 'Programación',
        6: 'Asistencia',
        7: 'Marco Jurídico',
        8: 'Redes',
        9: 'Prácticas'
    };
    return materias[materiaId] || `Materia ${materiaId}`;
}
