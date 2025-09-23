'use strict';

const crypto = require('crypto');
const fs = require('fs');

class FlowEndpointException extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
    }
}

/**
 * Descifra el cuerpo de una solicitud de un WhatsApp Flow.
 * @param {object} body - El cuerpo de la solicitud encriptada.
 * @param {string} privatePem - La clave privada en formato PEM.
 * @returns {{decryptedBody: object, aesKeyBuffer: Buffer, initialVectorBuffer: Buffer}}
 */
function decryptRequest(body, privatePem) {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
        throw new Error('La solicitud encriptada no tiene el formato esperado.');
    }

    let decryptedAesKey;
    try {
        console.log('🔐 Intentando crear objeto de clave privada...');
        const privateKeyObject = crypto.createPrivateKey(privatePem);
        console.log('✅ Objeto de clave privada creado exitosamente');
        
        console.log('🔓 Descifrando clave AES...');
        decryptedAesKey = crypto.privateDecrypt(
            {
                key: privateKeyObject,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(encrypted_aes_key, 'base64')
        );
        console.log('✅ Clave AES descifrada exitosamente');
    } catch (error) {
        console.error('❌ Error al descifrar la clave AES. Detalles del error:', {
            name: error.name,
            message: error.message,
            code: error.code,
            library: error.library,
            reason: error.reason
        });
        console.error('❌ Stack trace completo:', error.stack);
        // Código 421 le indica al cliente de WhatsApp que debe refrescar la clave pública.
        throw new FlowEndpointException(421, 'Fallo al descifrar la solicitud. Por favor, verifica tu clave privada.');
    }

    const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
    const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

    const TAG_LENGTH = 16;
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

    const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVectorBuffer);
    decipher.setAuthTag(encrypted_flow_data_tag);

    const decryptedJSONString = Buffer.concat([
        decipher.update(encrypted_flow_data_body),
        decipher.final(),
    ]).toString('utf-8');

    return {
        decryptedBody: JSON.parse(decryptedJSONString),
        aesKeyBuffer: decryptedAesKey,
        initialVectorBuffer,
    };
}

/**
 * Cifra una respuesta para un WhatsApp Flow.
 * @param {object} response - El objeto de respuesta a cifrar.
 * @param {Buffer} aesKeyBuffer - La clave AES descifrada de la solicitud.
 * @param {Buffer} initialVectorBuffer - El vector de inicialización de la solicitud.
 * @returns {string} La respuesta cifrada y codificada en base64.
 */
function encryptResponse(response, aesKeyBuffer, initialVectorBuffer) {
    const flipped_iv = Buffer.from(initialVectorBuffer.map(b => 255 - b));

    const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, flipped_iv);

    const encryptedResponse = Buffer.concat([
        cipher.update(JSON.stringify(response), 'utf-8'),
        cipher.final(),
        cipher.getAuthTag(),
    ]);

    return encryptedResponse.toString('base64');
}

/**
 * Obtiene la clave privada desde archivo o variable de entorno
 * @returns {string} La clave privada en formato PEM
 */
function getPrivateKey() {
    // Primero intenta leer desde archivo
    const privateKeyFile = process.env.WHATSAPP_FLOW_PRIVATE_KEY_FILE;
    if (privateKeyFile && fs.existsSync(privateKeyFile)) {
        console.log('📁 Leyendo clave privada desde archivo:', privateKeyFile);
        return fs.readFileSync(privateKeyFile, 'utf8');
    }
    
    // Intenta variable de entorno en Base64 (recomendado para Docker)
    const privateKeyB64 = process.env.WHATSAPP_FLOW_PRIVATE_KEY_B64;
    if (privateKeyB64) {
        console.log('🔑 Usando clave privada desde variable Base64');
        try {
            const processedKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
            console.log('✅ Clave Base64 decodificada correctamente');
            return processedKey;
        } catch (error) {
            console.error('❌ Error decodificando clave Base64:', error.message);
            throw new Error('Error decodificando WHATSAPP_FLOW_PRIVATE_KEY_B64');
        }
    }
    
    // Si no existe Base64, usa la variable de entorno normal
    const privateKeyEnv = process.env.WHATSAPP_FLOW_PRIVATE_KEY;
    if (privateKeyEnv) {
        console.log('🔑 Usando clave privada desde variable de entorno');
        
        // Si la clave viene con \n como string literal, los reemplazamos por saltos de línea reales
        let processedKey = privateKeyEnv.replace(/\\n/g, '\n');
        
        // Asegurar que el formato PEM sea correcto
        if (!processedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
            throw new Error('Formato de clave privada inválido: debe comenzar con -----BEGIN PRIVATE KEY-----');
        }
        
        if (!processedKey.endsWith('-----END PRIVATE KEY-----')) {
            throw new Error('Formato de clave privada inválido: debe terminar con -----END PRIVATE KEY-----');
        }
        
        console.log('✅ Formato de clave privada validado correctamente');
        return processedKey;
    }
    
    throw new Error('No se encontró la clave privada. Configure WHATSAPP_FLOW_PRIVATE_KEY_FILE, WHATSAPP_FLOW_PRIVATE_KEY_B64 o WHATSAPP_FLOW_PRIVATE_KEY');
}

module.exports = { decryptRequest, encryptResponse, FlowEndpointException, getPrivateKey };