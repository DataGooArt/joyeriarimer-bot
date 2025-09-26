'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
function decryptRequest(body, privatePem, passphrase = '') {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    if (!encrypted_aes_key || !encrypted_flow_data || !initial_vector) {
        throw new Error('La solicitud encriptada no tiene el formato esperado.');
    }

    let decryptedAesKey;
    try {
        // Usar formato de objeto como en el código de Meta
        const privateKey = crypto.createPrivateKey({ key: privatePem, passphrase });
        decryptedAesKey = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            Buffer.from(encrypted_aes_key, 'base64')
        );
    } catch (error) {
        console.error('❌ Error al descifrar la clave AES. Verifica tu clave privada.', error);
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
 * Obtiene la clave privada desde el archivo o variable de entorno
 * @returns {string} - La clave privada en formato PEM
 */
function getPrivateKey() {
    let privateKey = null;
    
    // Primero intentar desde variable de entorno WHATSAPP_FLOW_PRIVATE_KEY
    if (process.env.WHATSAPP_FLOW_PRIVATE_KEY) {
        privateKey = process.env.WHATSAPP_FLOW_PRIVATE_KEY;
        console.log('🔑 Usando clave privada desde variable de entorno WHATSAPP_FLOW_PRIVATE_KEY');
    } 
    // Segundo intento: variable con sufijo _B64 (para compatibilidad con Portainer)
    else if (process.env.WHATSAPP_FLOW_PRIVATE_KEY_B64) {
        privateKey = process.env.WHATSAPP_FLOW_PRIVATE_KEY_B64;
        console.log('🔑 Usando clave privada desde variable de entorno WHATSAPP_FLOW_PRIVATE_KEY_B64');
        
        // Si está en Base64, decodificarla
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            try {
                privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
                console.log('🔓 Clave decodificada desde Base64');
                console.log('🔍 Primeros 100 caracteres de la clave decodificada:', privateKey.substring(0, 100));
            } catch (error) {
                console.error('❌ Error decodificando Base64:', error);
            }
        }
    } else {
        // Si no está en variable de entorno, leer desde archivo
        try {
            const privateKeyPath = path.join(__dirname, '..', 'private_key.pem');
            privateKey = fs.readFileSync(privateKeyPath, 'utf8');
            console.log('🔑 Usando clave privada desde archivo private_key.pem');
        } catch (error) {
            console.error('❌ Error al leer la clave privada desde archivo:', error);
            throw new FlowEndpointException(421, 'No se pudo obtener la clave privada');
        }
    }
    
    // Validar que la clave tenga el formato PEM correcto
    if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('❌ La clave privada no tiene el formato PEM correcto');
        throw new FlowEndpointException(421, 'Formato de clave privada inválido');
    }
    
    return privateKey;
}

module.exports = { decryptRequest, encryptResponse, FlowEndpointException, getPrivateKey };