const crypto = require('crypto');
const fs = require('fs');

// Leer las claves
const publicKey = fs.readFileSync('../public_key.pem', 'utf8');
const privateKey = fs.readFileSync('../private_key.pem', 'utf8');

console.log('🧪 Prueba de cifrado/descifrado WhatsApp Flow');

// Simular un payload de WhatsApp Flow
const testPayload = {
    "version": "3.0",
    "screen": "WELCOME",
    "data": {
        "user_name": "Test User",
        "action": "get_catalog"
    }
};

// 1. Generar clave AES y IV (como lo haría WhatsApp)
const aesKey = crypto.randomBytes(16); // 128-bit AES key
const iv = crypto.randomBytes(16); // 128-bit IV

console.log('🔑 Clave AES generada:', aesKey.toString('base64'));
console.log('🔢 IV generado:', iv.toString('base64'));

// 2. Cifrar la clave AES con la clave pública (como lo haría WhatsApp)
const publicKeyObject = crypto.createPublicKey(publicKey);
const encryptedAesKey = crypto.publicEncrypt(
    {
        key: publicKeyObject,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
    },
    aesKey
);

console.log('🔐 Clave AES cifrada:', encryptedAesKey.toString('base64'));

// 3. Cifrar el payload con AES-GCM (como lo haría WhatsApp)
const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
const encryptedData = Buffer.concat([
    cipher.update(JSON.stringify(testPayload), 'utf-8'),
    cipher.final(),
    cipher.getAuthTag()
]);

console.log('📦 Payload cifrado:', encryptedData.toString('base64'));

// 4. Crear el request como lo enviaría WhatsApp
const whatsappRequest = {
    encrypted_flow_data: encryptedData.toString('base64'),
    encrypted_aes_key: encryptedAesKey.toString('base64'),
    initial_vector: iv.toString('base64')
};

console.log('\n📡 Request simulado de WhatsApp:');
console.log(JSON.stringify(whatsappRequest, null, 2));

// 5. Ahora probemos nuestro código de descifrado
console.log('\n🔓 Probando descifrado con nuestro código...');

try {
    const { decryptRequest } = require('../core/encryption.js');
    const result = decryptRequest(whatsappRequest, privateKey);
    
    console.log('✅ Descifrado exitoso!');
    console.log('📋 Payload original:', JSON.stringify(testPayload, null, 2));
    console.log('📋 Payload descifrado:', JSON.stringify(result.decryptedBody, null, 2));
    
    // Verificar que coincidan
    if (JSON.stringify(testPayload) === JSON.stringify(result.decryptedBody)) {
        console.log('🎉 ¡PRUEBA EXITOSA! El cifrado/descifrado funciona perfectamente');
    } else {
        console.log('❌ Los payloads no coinciden');
    }
    
} catch (error) {
    console.error('❌ Error en el descifrado:', error.message);
}