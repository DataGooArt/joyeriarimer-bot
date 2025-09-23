// test-key.js - Script para probar la carga de la clave privada
const fs = require('fs');
const crypto = require('crypto');

console.log('🔍 Probando carga de clave privada...');

try {
    const key = fs.readFileSync('./private_key.pem', 'utf8');
    console.log('📁 Archivo leído exitosamente');
    console.log('📏 Longitud del archivo:', key.length, 'caracteres');
    console.log('🏷️ Primeras líneas:', key.substring(0, 100));
    console.log('🏷️ Últimas líneas:', key.substring(key.length - 100));
    
    console.log('\n🔑 Intentando crear objeto de clave privada...');
    const keyObj = crypto.createPrivateKey({ key });
    console.log('✅ Clave privada cargada OK!');
    console.log('📝 Tipo:', keyObj.type);
    console.log('📝 Formato:', keyObj.format);
    console.log('📝 Algoritmo:', keyObj.asymmetricKeyType);
    console.log('📝 Tamaño:', keyObj.asymmetricKeySize, 'bytes');
    
} catch (err) {
    console.error('❌ ERROR cargando clave privada:', {
        name: err.name,
        message: err.message,
        code: err.code,
        library: err.library,
        reason: err.reason
    });
    console.error('❌ Stack completo:', err.stack);
}