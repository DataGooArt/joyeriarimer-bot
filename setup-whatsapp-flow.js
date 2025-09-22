const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

/**
 * Script para configurar WhatsApp Flow - Subir clave pública
 * 
 * Según la documentación de Meta:
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/whatsapp-business-encryption#set-business-public-key
 */

async function uploadPublicKey() {
    try {
        // Leer la clave pública
        const publicKey = fs.readFileSync('public_key.pem', 'utf8');
        
        console.log('📋 Clave pública leída:');
        console.log(publicKey);
        
        // Configuración para la API de WhatsApp Business
        const WABA_ID = process.env.WABA_ID; // WhatsApp Business Account ID
        const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
        
        if (!WABA_ID || !ACCESS_TOKEN) {
            console.error('❌ Error: Faltan variables de entorno WABA_ID y WHATSAPP_TOKEN');
            console.log('\n📝 Agrega estas variables a tu archivo .env:');
            console.log('WABA_ID=tu_whatsapp_business_account_id');
            console.log('WHATSAPP_TOKEN=tu_token_de_acceso_permanente');
            return;
        }
        
        // URL del endpoint para subir la clave pública
        const url = `https://graph.facebook.com/v23.0/${WABA_ID}/whatsapp_business_encryption`;
        
        // Preparar el payload
        const payload = {
            business_public_key: publicKey.trim()
        };
        
        console.log('\n🔐 Subiendo clave pública a WhatsApp Business API...');
        console.log(`📡 Endpoint: ${url}`);
        
        // Hacer la llamada API
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Clave pública subida exitosamente!');
        console.log('📊 Respuesta:', response.data);
        
        // Verificar el estado
        await checkPublicKeyStatus(WABA_ID, ACCESS_TOKEN);
        
    } catch (error) {
        console.error('❌ Error al subir la clave pública:');
        
        if (error.response) {
            console.error('📄 Código de estado:', error.response.status);
            console.error('📝 Mensaje:', error.response.data);
            
            // Mensajes de error comunes
            if (error.response.status === 400) {
                console.log('\n💡 Posibles soluciones:');
                console.log('- Verifica que WABA_ID sea correcto');
                console.log('- Asegúrate de que la clave pública esté en formato PEM válido');
                console.log('- Confirma que el token tenga permisos para whatsapp_business_encryption');
            }
        } else {
            console.error('📝 Error:', error.message);
        }
    }
}

async function checkPublicKeyStatus(wabaId, accessToken) {
    try {
        console.log('\n🔍 Verificando estado de la clave pública...');
        
        const response = await axios.get(
            `https://graph.facebook.com/v23.0/${wabaId}/whatsapp_business_encryption`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        
        console.log('📊 Estado actual de la encriptación:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error al verificar estado:', error.response?.data || error.message);
    }
}

// Función para obtener información de la cuenta
async function getWABAInfo() {
    try {
        const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
        
        if (!ACCESS_TOKEN) {
            console.error('❌ WHATSAPP_TOKEN no configurado');
            return;
        }
        
        console.log('🔍 Obteniendo información de cuentas de WhatsApp Business...');
        
        // Obtener información de la cuenta
        const response = await axios.get(
            'https://graph.facebook.com/v23.0/me/businesses',
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                }
            }
        );
        
        console.log('📊 Cuentas disponibles:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error al obtener información:', error.response?.data || error.message);
    }
}

// Función principal
async function main() {
    console.log('🚀 Configurador de WhatsApp Flow - Clave Pública\n');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--info')) {
        await getWABAInfo();
    } else if (args.includes('--help')) {
        console.log('📖 Uso:');
        console.log('node setup-whatsapp-flow.js           # Subir clave pública');
        console.log('node setup-whatsapp-flow.js --info    # Obtener info de cuentas');
        console.log('node setup-whatsapp-flow.js --help    # Mostrar ayuda');
        console.log('\n📝 Variables de entorno requeridas:');
        console.log('WABA_ID=tu_whatsapp_business_account_id');
        console.log('WHATSAPP_TOKEN=tu_token_de_acceso_permanente');
    } else {
        await uploadPublicKey();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = {
    uploadPublicKey,
    checkPublicKeyStatus,
    getWABAInfo
};