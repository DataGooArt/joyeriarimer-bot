const crypto = require('crypto');
const fs = require('fs');

console.log('🔐 Generando nuevo par de claves RSA...');

// Generar par de claves RSA de 2048 bits
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// Guardar clave privada
fs.writeFileSync('private_key.pem', privateKey);
console.log('✅ Clave privada guardada en: private_key.pem');

// Guardar clave pública
fs.writeFileSync('public_key.pem', publicKey);
console.log('✅ Clave pública guardada en: public_key.pem');

console.log('\n📋 CLAVE PÚBLICA PARA META:');
console.log('─'.repeat(50));
console.log(publicKey);
console.log('─'.repeat(50));
console.log('\n🚀 Ahora debes:');
console.log('1. Copiar la clave pública de arriba');
console.log('2. Ir a Meta Business Manager');
console.log('3. Actualizar la clave pública en la configuración de WhatsApp Flows');
console.log('4. Desplegar la nueva imagen Docker');