// Importa la biblioteca bcrypt para el hasheo de contraseñas
const bcrypt = require('bcrypt');
// Define la contraseña que se quiere hashear
const password = 'estudiante123'; // Esta será la contraseña del estudiante
bcrypt.hash(password, 10, function(err, hash) {
    if (err) {
        console.error('Error al generar hash:', err);
        return;
    }
    console.log('Contraseña hasheada:', hash);
    // Usa este hash en el script SQL
});
