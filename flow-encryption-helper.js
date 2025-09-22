const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

/**
 * Script alternativo para configurar WhatsApp Flow Encryption
 * 
 * Este script intentará diferentes enfoques para subir la clave pública
 */

// Datos de configuración
const WABA_ID = process.env.WABA_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function generateCurlCommand() {
    try {
        const publicKey = fs.readFileSync('public_key.pem', 'utf8');
        
        // Formatear la clave para JSON (escapar saltos de línea)
        const formattedKey = publicKey.trim().replace(/\n/g, '\\n');
        
        console.log('🔧 Comando cURL para configurar la encriptación:');
        console.log('');
        console.log('curl -X POST \\');
        console.log(`  "https://graph.facebook.com/v23.0/${WABA_ID}/whatsapp_business_encryption" \\`);
        console.log(`  -H "Authorization: Bearer ${ACCESS_TOKEN}" \\`);
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"business_public_key": "' + formattedKey + '"}\'');
        console.log('');
        
        // También generar comando PowerShell
        console.log('🔧 Comando PowerShell alternativo:');
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
        console.log(`Invoke-RestMethod -Uri "https://graph.facebook.com/v23.0/${WABA_ID}/whatsapp_business_encryption" -Method POST -Headers $headers -Body $body`);
        
    } catch (error) {
        console.error('❌ Error al generar comandos:', error.message);
    }
}

async function testAlternativeEndpoints() {
    console.log('🔍 Probando endpoints alternativos...\n');
    
    const endpoints = [
        {
            name: 'WABA Encryption',
            url: `https://graph.facebook.com/v23.0/${WABA_ID}/whatsapp_business_encryption`,
            method: 'GET'
        },
        {
            name: 'Phone Number Encryption',
            url: `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/whatsapp_business_encryption`,
            method: 'GET'
        },
        {
            name: 'WABA Info',
            url: `https://graph.facebook.com/v23.0/${WABA_ID}`,
            method: 'GET'
        },
        {
            name: 'Phone Number Info',
            url: `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}`,
            method: 'GET'
        }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Probando ${endpoint.name}...`);
            
            const response = await axios({
                method: endpoint.method,
                url: endpoint.url,
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                }
            });
            
            console.log(`✅ ${endpoint.name} - Éxito:`);
            console.log(JSON.stringify(response.data, null, 2));
            console.log('');
            
        } catch (error) {
            console.log(`❌ ${endpoint.name} - Error:`, error.response?.status, error.response?.data?.error?.message || error.message);
            console.log('');
        }
    }
}

async function tryEncryptionUpload() {
    try {
        const publicKey = fs.readFileSync('public_key.pem', 'utf8');
        
        console.log('🔐 Intentando subir clave pública...\n');
        
        // Intentar con diferentes payloads
        const payloads = [
            { business_public_key: publicKey.trim() },
            { public_key: publicKey.trim() },
            { encryption_public_key: publicKey.trim() }
        ];
        
        for (let i = 0; i < payloads.length; i++) {
            try {
                console.log(`📤 Intento ${i + 1}...`);
                
                const response = await axios.post(
                    `https://graph.facebook.com/v23.0/${WABA_ID}/whatsapp_business_encryption`,
                    payloads[i],
                    {
                        headers: {
                            'Authorization': `Bearer ${ACCESS_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log('✅ ¡Éxito! Clave pública configurada:');
                console.log(JSON.stringify(response.data, null, 2));
                return;
                
            } catch (error) {
                console.log(`❌ Intento ${i + 1} falló:`, error.response?.data?.error?.message || error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Error al intentar subir:', error.message);
    }
}

async function checkTokenPermissions() {
    console.log('🔑 Verificando permisos del token...\n');
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v23.0/me?fields=id,name`,
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                }
            }
        );
        
        console.log('✅ Token válido para usuario/app:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Intentar obtener permisos
        try {
            const permissionsResponse = await axios.get(
                'https://graph.facebook.com/v23.0/me/permissions',
                {
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`
                    }
                }
            );
            
            console.log('\n📋 Permisos del token:');
            console.log(JSON.stringify(permissionsResponse.data, null, 2));
            
        } catch (permError) {
            console.log('\n❌ No se pudieron obtener permisos:', permError.response?.data?.error?.message);
        }
        
    } catch (error) {
        console.error('❌ Token inválido:', error.response?.data?.error?.message || error.message);
    }
}

async function main() {
    console.log('🚀 Diagnóstico de WhatsApp Flow Encryption\n');
    
    if (!WABA_ID || !ACCESS_TOKEN) {
        console.error('❌ Faltan variables de entorno WABA_ID y WHATSAPP_TOKEN');
        return;
    }
    
    const args = process.argv.slice(2);
    
    if (args.includes('--curl')) {
        await generateCurlCommand();
    } else if (args.includes('--test')) {
        await testAlternativeEndpoints();
    } else if (args.includes('--upload')) {
        await tryEncryptionUpload();
    } else if (args.includes('--permissions')) {
        await checkTokenPermissions();
    } else if (args.includes('--all')) {
        console.log('🔍 Ejecutando diagnóstico completo...\n');
        await checkTokenPermissions();
        console.log('\n' + '='.repeat(50) + '\n');
        await testAlternativeEndpoints();
        console.log('\n' + '='.repeat(50) + '\n');
        await tryEncryptionUpload();
        console.log('\n' + '='.repeat(50) + '\n');
        await generateCurlCommand();
    } else {
        console.log('📖 Uso:');
        console.log('node flow-encryption-helper.js --curl         # Generar comando cURL');
        console.log('node flow-encryption-helper.js --test         # Probar endpoints');
        console.log('node flow-encryption-helper.js --upload       # Intentar subir clave');
        console.log('node flow-encryption-helper.js --permissions  # Verificar permisos');
        console.log('node flow-encryption-helper.js --all          # Ejecutar todo');
        console.log('\n💡 Recomendación: Comienza con --all para diagnóstico completo');
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    generateCurlCommand,
    testAlternativeEndpoints,
    tryEncryptionUpload,
    checkTokenPermissions
};