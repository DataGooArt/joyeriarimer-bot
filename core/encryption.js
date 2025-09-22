'use strict';

const crypto = require('crypto');

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
        decryptedAesKey = crypto.privateDecrypt(
            {
                key: crypto.createPrivateKey(privatePem),
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

module.exports = { decryptRequest, encryptResponse, FlowEndpointException };