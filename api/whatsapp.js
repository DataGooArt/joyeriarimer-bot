'use strict';

const axios = require('axios');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Función base para enviar cualquier tipo de mensaje a la API Graph.
 * @param {object} data - El payload del mensaje a enviar.
 */
async function sendMessageAPI(data) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: data
        });
        console.log(`📤 Mensaje enviado a ${data.to}`);
    } catch (error) {
        console.error('❌ Error al enviar mensaje a la API:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

/**
 * Envía un mensaje de texto simple a través de la API de WhatsApp.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} text - El mensaje a enviar.
 */
async function sendTextMessage(to, text) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
    };
    await sendMessageAPI(data);
}

/**
 * Envía un mensaje con una imagen desde una URL pública.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} imageUrl - La URL pública de la imagen (debe ser HTTPS).
 * @param {string} caption - El texto que acompaña a la imagen.
 */
async function sendImageMessage(to, imageUrl, caption) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
            link: imageUrl,
            caption: caption
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía un mensaje de lista interactiva con productos.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {Array} products - Un array de objetos de producto de la base de datos.
 * @param {string} bodyText - El texto principal del mensaje.
 * @param {string} buttonText - El texto del botón para abrir la lista.
 */
async function sendProductListMessage(to, products, bodyText, buttonText) {
    if (!products || products.length === 0) {
        console.log("No hay productos para enviar en la lista.");
        return;
    }

    const rows = products.map(product => ({
        id: `product_${product._id}`, // Un ID único para cada opción
        title: product.name.substring(0, 24), // Título de la fila (máx 24 caracteres)
        description: `${product.material} - $${product.price}`.substring(0, 72) // Descripción (máx 72 caracteres)
    }));

    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'list',
            header: {
                type: 'text',
                text: 'Nuestro Catálogo'
            },
            body: {
                text: bodyText
            },
            action: {
                button: buttonText,
                sections: [{ title: 'Anillos Disponibles', rows: rows }]
            }
        }
    };
    await sendMessageAPI(data);
}

module.exports = {
    sendTextMessage,
    sendImageMessage,
    sendProductListMessage
};

