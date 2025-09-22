const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

/**
 * Script para configurar WhatsApp Flow Encryption usando Phone Number ID
 * Según el diagnóstico, el endpoint correcto es phone_number_id/whatsapp_business_encryption
 */

async function uploadPublicKeyToPhoneNumber() {
    try {
        // Leer la clave pública
        const publicKey = fs.readFileSync('public_key.pem', 'utf8');
        
        console.log('📋 Clave pública leída desde public_key.pem');
        
        // Configuración
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
        
        if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
            console.error('❌ Error: Faltan variables de entorno WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_TOKEN');
            return;
        }
        
        // URL del endpoint correcto (Phone Number ID)
        const url = `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/whatsapp_business_encryption`;
        
        // Preparar el payload
        const payload = {
            business_public_key: publicKey.trim()
        };
        
        console.log('\n🔐 Subiendo clave pública al Phone Number...');
        console.log(`📡 Endpoint: ${url}`);
        console.log(`📱 Phone Number ID: ${PHONE_NUMBER_ID}`);
        
        // Hacer la llamada API
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ ¡Clave pública subida exitosamente!');
        console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
        
        // Verificar el estado inmediatamente
        await checkEncryptionStatus();
        
        console.log('\n🎉 ¡Configuración completada!');
        console.log('📝 Próximos pasos:');
        console.log('   1. La clave pública ya está configurada');
        console.log('   2. Tu endpoint de Flow puede recibir datos encriptados');
        console.log('   3. Configura tu Flow JSON con data_api_version: "3.0"');
        
    } catch (error) {
        console.error('❌ Error al subir la clave pública:');
        
        if (error.response) {
            console.error('📄 Código de estado:', error.response.status);
            console.error('📝 Mensaje:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 400) {
                console.log('\n💡 Posibles soluciones:');
                console.log('- La clave pública ya podría estar configurada');
                console.log('- Verifica el formato de la clave PEM');
                console.log('- Confirma que el PHONE_NUMBER_ID sea correcto');
            }
        } else {
            console.error('📝 Error:', error.message);
        }
        
        // Intentar verificar el estado actual
        console.log('\n🔍 Verificando estado actual...');
        await checkEncryptionStatus();
    }
}

async function checkEncryptionStatus() {
    try {
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
        
        console.log('\n🔍 Verificando estado de la encriptación...');
        
        const response = await axios.get(
            `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/whatsapp_business_encryption`,
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                }
            }
        );
        
        console.log('📊 Estado actual de la encriptación:');
        const data = response.data.data[0] || response.data;
        
        if (data.business_public_key_signature_status) {
            const status = data.business_public_key_signature_status;
            console.log(`🔐 Estado de la firma: ${status}`);
            
            switch (status) {
                case 'VERIFIED':
                    console.log('✅ La clave pública está verificada y lista para usar');
                    break;
                case 'MISMATCH':
                    console.log('⚠️  La clave pública no coincide - necesita actualización');
                    break;
                case 'PENDING':
                    console.log('⏳ La verificación está pendiente');
                    break;
                default:
                    console.log(`❓ Estado desconocido: ${status}`);
            }
        }
        
        if (data.business_public_key && data.business_public_key.trim()) {
            console.log('✅ Clave pública configurada');
            console.log('📋 Clave actual (primeros 100 caracteres):');
            console.log(data.business_public_key.substring(0, 100) + '...');
        } else {
            console.log('❌ No hay clave pública configurada');
        }
        
    } catch (error) {
        console.error('❌ Error al verificar estado:', error.response?.data || error.message);
    }
}

async function generateCorrectCommands() {
    try {
        const publicKey = fs.readFileSync('public_key.pem', 'utf8');
        const formattedKey = publicKey.trim().replace(/\n/g, '\\n');
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
        
        console.log('🔧 Comando cURL correcto (usando Phone Number ID):');
        console.log('');
        console.log('curl -X POST \\');
        console.log(`  "https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/whatsapp_business_encryption" \\`);
        console.log(`  -H "Authorization: Bearer ${ACCESS_TOKEN}" \\`);
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"business_public_key": "' + formattedKey + '"}\'');
        console.log('');
        
        console.log('🔧 Comando PowerShell correcto:');
        console.log('');
        console.log('$headers = @{');
        console.log(`    "Authorization" = "Bearer ${ACCESS_TOKEN}"`);
        console.log('    "Content-Type" = "application/json"');
        console.log('}');
        console.log('');
        console.log('$body = @{');
        console.log(`    business_public_key = "${formattedKey}"`);
        console.log('} | ConvertTo-Json');
        console.log('');
        console.log(`Invoke-RestMethod -Uri "https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/whatsapp_business_encryption" -Method POST -Headers $headers -Body $body`);
        
    } catch (error) {
        console.error('❌ Error al generar comandos:', error.message);
    }
}

async function main() {
    console.log('🚀 Configurador de WhatsApp Flow Encryption (Phone Number)\n');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--check')) {
        await checkEncryptionStatus();
    } else if (args.includes('--commands')) {
        await generateCorrectCommands();
    } else if (args.includes('--help')) {
        console.log('📖 Uso:');
        console.log('node upload-flow-key.js           # Subir clave pública');
        console.log('node upload-flow-key.js --check   # Verificar estado actual');
        console.log('node upload-flow-key.js --commands # Generar comandos manuales');
        console.log('node upload-flow-key.js --help    # Mostrar ayuda');
    } else {
        await uploadPublicKeyToPhoneNumber();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = {
    uploadPublicKeyToPhoneNumber,
    checkEncryptionStatus,
    generateCorrectCommands
};