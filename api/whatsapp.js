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
                description: `${product.material} - Desde ${product.minPrice}`.substring(0, 72) // Descripción (máx 72 caracteres)

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

/**
 * Envía un mensaje para iniciar un WhatsApp Flow.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} flowId - El ID de tu Flow publicado.
 * @param {string} cta - El texto del botón que inicia el Flow (Call to Action).
 * @param {string} screenId - El ID de la pantalla inicial del Flow.
 * @param {string} headerText - El texto del encabezado del mensaje.
 * @param {string} bodyText - El texto del cuerpo del mensaje.
 */
async function sendFlowMessage(to, flowId, cta, screenId, headerText, bodyText, flowData = null, flowToken = null) {
    const flowActionPayload = {
        screen: screenId,
    };
    
    // Si hay datos específicos del Flow, incluirlos
    if (flowData) {
        Object.assign(flowActionPayload, flowData);
    }
    
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'flow',
            header: {
                type: 'text',
                text: headerText
            },
            body: {
                text: bodyText
            },
            footer: {
                text: 'Toca el botón para continuar'
            },
            action: {
                name: 'flow',
                parameters: {
                    flow_message_version: '3',
                    flow_id: flowId,
                    flow_cta: cta,
                    flow_action: 'navigate',
                    flow_action_payload: flowActionPayload
                }
            }
        }
    };
    
    // Agregar flow_token si se proporciona
    if (flowToken) {
        data.interactive.action.parameters.flow_token = flowToken;
    }
    
    await sendMessageAPI(data);
}

/**
 * Envía un mensaje de plantilla.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} templateName - El nombre de la plantilla en Meta.
 * @param {string} languageCode - El código de idioma de la plantilla (ej. 'es').
 * @param {string | null} headerImageUrl - La URL de la imagen para el encabezado (si la plantilla lo requiere).
 * @param {Array<string>} [bodyParams=[]] - Un array de strings para reemplazar las variables {{1}}, {{2}}, etc., en el cuerpo.
 */
async function sendTemplateMessage(to, templateName, languageCode, headerImageUrl = null, bodyParams = []) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: languageCode
            },
            components: []
        }
    };

    if (headerImageUrl) {
        data.template.components.push({
            type: 'header',
            parameters: [
                {
                    type: 'image',
                    image: { link: headerImageUrl }
                }
            ]
        });
    }

    if (bodyParams.length > 0) {
        data.template.components.push({
            type: 'body',
            parameters: bodyParams.map(param => ({
                type: 'text',
                text: param
            }))
        });
    }

    // Si no hay parámetros, el array de componentes se envía vacío, lo cual es válido.
    if (data.template.components.length === 0) {
        delete data.template.components;
    }

    await sendMessageAPI(data);
}

/**
 * Envía un mensaje interactivo con botones.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} bodyText - El texto principal del mensaje.
 * @param {string} footerText - El texto del pie (opcional).
 * @param {Array} buttons - Array de botones con formato {id, title}.
 */
async function sendInteractiveMessage(to, bodyText, footerText, buttons) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: bodyText
            },
            footer: {
                text: footerText || 'Joyería Rimer 💎'
            },
            action: {
                buttons: buttons.slice(0, 3).map((button, index) => ({ // WhatsApp permite máximo 3 botones
                    type: 'reply',
                    reply: {
                        id: button.id,
                        title: button.title.substring(0, 20) // Máximo 20 caracteres
                    }
                }))
            }
        }
    };

    // Si hay más de 3 botones, usar lista en lugar de botones
    if (buttons.length > 3) {
        data.interactive = {
            type: 'list',
            body: {
                text: bodyText
            },
            footer: {
                text: footerText || 'Joyería Rimer 💎'
            },
            action: {
                button: 'Ver Opciones',
                sections: [{
                    title: 'Catálogo',
                    rows: buttons.map(button => ({
                        id: button.id,
                        title: button.title.substring(0, 24), // Máximo 24 caracteres para lista
                        description: '' // Opcional
                    }))
                }]
            }
        };
    }

    await sendMessageAPI(data);
}


module.exports = {
    sendTextMessage,
    sendImageMessage,
    sendProductListMessage,
    sendFlowMessage,
    sendTemplateMessage,
    sendInteractiveMessage
};