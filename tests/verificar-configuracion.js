#!/usr/bin/env node

/**
 * 🔍 Script de Verificación Completa - WhatsApp Flows Endpoint
 * 
 * Este script verifica todos los componentes necesarios para que 
 * tu endpoint de WhatsApp Flows funcione correctamente.
 */

require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');

console.log('🔍 VERIFICACIÓN COMPLETA DE WHATSAPP FLOWS ENDPOINT');
console.log('='=50);

const checks = [];
let allPassed = true;

function addCheck(name, passed, message, details = '') {
    checks.push({ name, passed, message, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${message}`);
    if (details) console.log(`   ${details}`);
    if (!passed) allPassed = false;
}

// 1. Verificar variables de entorno
console.log('\n📋 1. VERIFICANDO VARIABLES DE ENTORNO');
const requiredEnvs = [
    'WHATSAPP_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID', 
    'WHATSAPP_FLOW_WELCOME_ID',
    'VERIFY_TOKEN'
];

requiredEnvs.forEach(env => {
    const value = process.env[env];
    addCheck(
        `Variable ${env}`,
        !!value,
        value ? 'Configurada' : 'Faltante',
        value ? `Valor: ${env.includes('TOKEN') ? '***OCULTO***' : value}` : 'Definir en .env'
    );
});

// 2. Verificar archivos de claves
console.log('\n🔐 2. VERIFICANDO CLAVES RSA');

const privateKeyExists = fs.existsSync('private_key.pem');
addCheck(
    'Archivo private_key.pem',
    privateKeyExists,
    privateKeyExists ? 'Existe' : 'No encontrado'
);

const publicKeyExists = fs.existsSync('public_key.pem');
addCheck(
    'Archivo public_key.pem', 
    publicKeyExists,
    publicKeyExists ? 'Existe' : 'No encontrado'
);

if (privateKeyExists && publicKeyExists) {
    try {
        const privateKey = fs.readFileSync('private_key.pem', 'utf8');
        const publicKey = fs.readFileSync('public_key.pem', 'utf8');
        
        // Verificar formato de claves
        const validPrivateFormat = privateKey.includes('-----BEGIN PRIVATE KEY-----');
        const validPublicFormat = publicKey.includes('-----BEGIN PUBLIC KEY-----');
        
        addCheck(
            'Formato clave privada',
            validPrivateFormat,
            validPrivateFormat ? 'Formato PEM válido' : 'Formato inválido'
        );
        
        addCheck(
            'Formato clave pública',
            validPublicFormat,
            validPublicFormat ? 'Formato PEM válido' : 'Formato inválido'
        );
        
        // Verificar que las claves coincidan
        if (validPrivateFormat && validPublicFormat) {
            try {
                const privateKeyObj = crypto.createPrivateKey(privateKey);
                const publicKeyObj = crypto.createPublicKey(publicKey);
                
                // Test básico de cifrado/descifrado
                const testData = Buffer.from('test message');
                const encrypted = crypto.publicEncrypt({
                    key: publicKeyObj,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                }, testData);
                
                const decrypted = crypto.privateDecrypt({
                    key: privateKeyObj,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                }, encrypted);
                
                const keysMatch = testData.equals(decrypted);
                addCheck(
                    'Par de claves válido',
                    keysMatch,
                    keysMatch ? 'Claves coinciden' : 'Claves no coinciden'
                );
                
            } catch (error) {
                addCheck(
                    'Test de claves',
                    false,
                    'Error en test de cifrado',
                    error.message
                );
            }
        }
        
    } catch (error) {
        addCheck(
            'Lectura de claves',
            false,
            'Error leyendo archivos de claves',
            error.message
        );
    }
}

// 3. Verificar configuración de cifrado
console.log('\n💻 3. VERIFICANDO CÓDIGO DE CIFRADO');

const encryptionFileExists = fs.existsSync('core/encryption.js');
addCheck(
    'Módulo core/encryption.js',
    encryptionFileExists,
    encryptionFileExists ? 'Existe' : 'No encontrado'
);

if (encryptionFileExists) {
    try {
        const { decryptRequest, encryptResponse, getPrivateKey } = require('./core/encryption.js');
        
        addCheck(
            'Función decryptRequest',
            typeof decryptRequest === 'function',
            typeof decryptRequest === 'function' ? 'Disponible' : 'No encontrada'
        );
        
        addCheck(
            'Función encryptResponse',
            typeof encryptResponse === 'function',
            typeof encryptResponse === 'function' ? 'Disponible' : 'No encontrada'
        );
        
        addCheck(
            'Función getPrivateKey',
            typeof getPrivateKey === 'function',
            typeof getPrivateKey === 'function' ? 'Disponible' : 'No encontrada'
        );
        
        // Test de carga de clave privada
        try {
            const privateKey = getPrivateKey();
            addCheck(
                'Carga de clave privada',
                !!privateKey,
                privateKey ? 'Exitosa' : 'Falló'
            );
        } catch (error) {
            addCheck(
                'Carga de clave privada',
                false,
                'Error cargando clave',
                error.message
            );
        }
        
    } catch (error) {
        addCheck(
            'Importación módulo cifrado',
            false,
            'Error importando módulo',
            error.message
        );
    }
}

// 4. Verificar webhook handler
console.log('\n🎯 4. VERIFICANDO WEBHOOK HANDLER');

const webhookHandlerExists = fs.existsSync('core/webhookHandler.js');
addCheck(
    'Módulo core/webhookHandler.js',
    webhookHandlerExists,
    webhookHandlerExists ? 'Existe' : 'No encontrado'
);

if (webhookHandlerExists) {
    try {
        const webhookContent = fs.readFileSync('core/webhookHandler.js', 'utf8');
        
        const hasPingHandler = webhookContent.includes('action === \'ping\'') && 
                              webhookContent.includes('status: "active"');
        
        addCheck(
            'Handler de ping validación',
            hasPingHandler,
            hasPingHandler ? 'Implementado correctamente' : 'Falta o incorrecto',
            hasPingHandler ? '' : 'Debe responder {"data": {"status": "active"}} para ping'
        );
        
        const hasFlowDetection = webhookContent.includes('encrypted_flow_data') &&
                                webhookContent.includes('encrypted_aes_key') &&
                                webhookContent.includes('initial_vector');
        
        addCheck(
            'Detección de Flow cifrado',
            hasFlowDetection,
            hasFlowDetection ? 'Implementado' : 'Faltante'
        );
        
    } catch (error) {
        addCheck(
            'Análisis webhook handler',
            false,
            'Error analizando archivo',
            error.message
        );
    }
}

// 5. Verificar estado en Meta (si es posible)
console.log('\n🌐 5. VERIFICANDO ESTADO EN META');

async function checkMetaStatus() {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!token || !phoneId) {
        addCheck(
            'Verificación Meta',
            false,
            'Faltan credenciales',
            'WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID requeridos'
        );
        return;
    }
    
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v23.0/${phoneId}/whatsapp_business_encryption`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000
            }
        );
        
        const hasValidKey = response.data.business_public_key;
        const keyStatus = response.data.business_public_key_signature_status;
        
        addCheck(
            'Clave pública en Meta',
            hasValidKey,
            hasValidKey ? 'Configurada' : 'No configurada'
        );
        
        addCheck(
            'Estado de la clave',
            keyStatus === 'VALID',
            keyStatus || 'Desconocido',
            keyStatus === 'VALID' ? 'Lista para producción' : 'Requiere atención'
        );
        
    } catch (error) {
        addCheck(
            'Conexión con Meta',
            false,
            'Error conectando',
            error.response?.data?.error?.message || error.message
        );
    }
}

// 6. Resumen y recomendaciones
async function showSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));
    
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.passed).length;
    const failedChecks = totalChecks - passedChecks;
    
    console.log(`✅ Verificaciones exitosas: ${passedChecks}`);
    console.log(`❌ Verificaciones fallidas: ${failedChecks}`);
    console.log(`📊 Porcentaje de éxito: ${Math.round(passedChecks/totalChecks*100)}%`);
    
    if (allPassed) {
        console.log('\n🎉 ¡CONFIGURACIÓN COMPLETA!');
        console.log('Tu endpoint de WhatsApp Flows está listo para producción.');
        console.log('\n📝 Próximos pasos:');
        console.log('1. Desplegar en producción');
        console.log('2. Configurar endpoint en Meta Business Manager');
        console.log('3. Ejecutar validación de Meta');
    } else {
        console.log('\n⚠️  SE REQUIERE ATENCIÓN');
        console.log('Algunos componentes necesitan configuración adicional.');
        console.log('\n🔧 Elementos a revisar:');
        
        checks.filter(c => !c.passed).forEach(check => {
            console.log(`• ${check.name}: ${check.message}`);
            if (check.details) console.log(`  ${check.details}`);
        });
    }
    
    console.log('\n📚 Para más información, consulta: GUIA-CONFIGURACION-FLOWS.md');
    console.log('='.repeat(50));
}

// Ejecutar verificaciones
(async () => {
    await checkMetaStatus();
    await showSummary();
})();