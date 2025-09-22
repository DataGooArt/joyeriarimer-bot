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

/**
 * Envía un mensaje para iniciar un WhatsApp Flow.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} flowId - El ID de tu Flow publicado.
 * @param {string} cta - El texto del botón que inicia el Flow (Call to Action).
 * @param {string} screenId - El ID de la pantalla inicial del Flow.
 * @param {string} headerText - El texto del encabezado del mensaje.
 * @param {string} bodyText - El texto del cuerpo del mensaje.
 */
async function sendFlowMessage(to, flowId, cta, screenId, headerText, bodyText) {
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
                    flow_action_payload: {
                        screen: screenId,
                    }
                }
            }
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía un mensaje interactivo con un único botón que abre un Flow.
 * @param {string} to - Número de teléfono del destinatario.
 * @param {string} bodyText - El texto principal del mensaje.
 * @param {string} buttonText - El texto que aparecerá en el botón.
 * @param {string} flowId - El ID del Flow que se abrirá.
 */
async function sendInteractiveFlowButton(to, bodyText, buttonText, flowId) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'flow',
            header: {
                type: 'text',
                text: '¡Bienvenido a Joyería Rimer! 💎' // Un encabezado amigable
            },
            body: {
                text: bodyText
            },
            footer: {
                text: 'Tu joyería de confianza.' // Un pie de página opcional
            },
            action: {
                name: 'flow',
                parameters: {
                    flow_message_version: '3',
                    flow_id: flowId,
                    flow_cta: buttonText,
                    flow_action: 'navigate',
                    flow_action_payload: {
                        screen: 'WELCOME_SCREEN' // La pantalla inicial de tu Flow
                    }
                }
            }
        }
    };
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
 * Envía un mensaje con categorías principales de joyería.
 */
async function sendCategoriesMessage(to) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: '💎 ¡Bienvenido a Joyería Rimer! ¿Qué tipo de joya te interesa?\n\nElige una categoría para ver nuestros productos más populares:'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'cat_anillos',
                            title: '💍 Anillos'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'cat_cadenas',
                            title: '🔗 Cadenas & Collares'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'cat_aretes',
                            title: '💎 Aretes'
                        }
                    }
                ]
            }
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía productos populares de una categoría específica.
 */
async function sendCategoryProducts(to, category) {
    const categories = {
        'anillos': {
            title: '💍 ANILLOS MÁS POPULARES',
            description: 'Descubre nuestras piezas más solicitadas:\n\n✨ Anillo Solitario Clásico - desde $2,500\n✨ Anillo de Compromiso Halo - desde $3,200\n✨ Anillo Eternidad - desde $1,800\n\n¿Cuál te interesa?',
            buttons: [
                { id: 'prod_solitario', title: 'Ver Solitario' },
                { id: 'prod_halo', title: 'Ver Halo' },
                { id: 'prod_eternidad', title: 'Ver Eternidad' }
            ]
        },
        'cadenas': {
            title: '🔗 CADENAS & COLLARES MÁS POPULARES',
            description: 'Nuestras piezas más elegantes:\n\n✨ Cadena Tenis Diamante - desde $4,500\n✨ Collar Corazón Oro 18k - desde $1,200\n✨ Cadena Clásica Oro - desde $800\n\n¿Cuál prefieres?',
            buttons: [
                { id: 'prod_tenis', title: 'Ver Tenis' },
                { id: 'prod_corazon', title: 'Ver Corazón' },
                { id: 'prod_clasica', title: 'Ver Clásica' }
            ]
        },
        'aretes': {
            title: '💎 ARETES MÁS POPULARES',
            description: 'Los favoritos de nuestras clientas:\n\n✨ Aretes Botón Diamante - desde $1,500\n✨ Aretes Colgantes Perla - desde $900\n✨ Aretes Aro Oro 18k - desde $650\n\n¿Cuál te gusta más?',
            buttons: [
                { id: 'prod_boton', title: 'Ver Botón' },
                { id: 'prod_colgante', title: 'Ver Colgante' },
                { id: 'prod_aro', title: 'Ver Aro' }
            ]
        }
    };

    const categoryData = categories[category];
    if (!categoryData) return;

    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: categoryData.description
            },
            action: {
                buttons: categoryData.buttons.map(btn => ({
                    type: 'reply',
                    reply: {
                        id: btn.id,
                        title: btn.title
                    }
                }))
            }
        }
    };
    await sendMessageAPI(data);
}

/**
 * Envía detalles de un producto específico con imagen.
 */
async function sendProductDetail(to, productId) {
    const products = {
        'prod_solitario': {
            name: 'Anillo Solitario Clásico',
            price: '$2,500 - $8,500',
            description: '💍 ANILLO SOLITARIO CLÁSICO\n\n✨ Diamante central desde 0.5ct\n🔶 Oro blanco, amarillo o rosé 14k/18k\n💎 Certificado de autenticidad incluido\n🎁 Perfecto para compromiso\n\n¿Te interesa conocer más detalles o agendar una cita para verlo?',
            image: 'https://github.com/user-attachments/assets/9c7e2e5f-4b7e-46b3-82c5-6d1b4e37a2e3'
        },
        'prod_halo': {
            name: 'Anillo de Compromiso Halo',
            price: '$3,200 - $12,000',
            description: '💍 ANILLO HALO RADIANTE\n\n✨ Diamante central rodeado de pequeños diamantes\n🔶 Oro blanco 18k (disponible en otros metales)\n💎 Efecto de mayor brillo y tamaño\n🎁 Diseño romántico y elegante\n\n¿Te gustaría ver más modelos o agendar una cita?',
            image: 'https://i.imgur.com/example-halo.jpg'
        },
        'prod_eternidad': {
            name: 'Anillo Eternidad',
            price: '$1,800 - $5,500',
            description: '💍 ANILLO ETERNIDAD\n\n✨ Diamantes alrededor de toda la banda\n🔶 Oro blanco o amarillo 14k/18k\n💎 Símbolo de amor eterno\n🎁 Ideal para aniversario o matrimonio\n\n¿Quieres ver otras opciones o necesitas más información?',
            image: 'https://i.imgur.com/example-eternidad.jpg'
        },
        'prod_tenis': {
            name: 'Cadena Tenis Diamante',
            price: '$4,500 - $15,000',
            description: '🔗 CADENA TENIS DIAMANTE\n\n✨ Diamantes de laboratorio o naturales\n🔶 Oro blanco 18k con cierre de seguridad\n💎 Brillos incomparables\n🎁 Elegancia para cualquier ocasión\n\n¿Te interesa una cotización personalizada?',
            image: 'https://i.imgur.com/example-tenis.jpg'
        },
        'prod_corazon': {
            name: 'Collar Corazón Oro 18k',
            price: '$1,200 - $3,500',
            description: '🔗 COLLAR CORAZÓN ORO 18K\n\n✨ Dije en forma de corazón\n🔶 Oro amarillo, blanco o rosé\n💎 Opción con diamantes pequeños\n🎁 Regalo perfecto para ser querida\n\n¿Quieres personalizarlo con grabado?',
            image: 'https://i.imgur.com/example-corazon.jpg'
        },
        'prod_clasica': {
            name: 'Cadena Clásica Oro',
            price: '$800 - $2,200',
            description: '🔗 CADENA CLÁSICA ORO\n\n✨ Diseño atemporal y elegante\n🔶 Oro 14k o 18k, varios largos\n💎 Perfecta para usar sola o con dije\n🎁 Básico esencial en joyería\n\n¿Prefieres verla en tienda o necesitas medidas?',
            image: 'https://i.imgur.com/example-clasica.jpg'
        },
        'prod_boton': {
            name: 'Aretes Botón Diamante',
            price: '$1,500 - $4,500',
            description: '💎 ARETES BOTÓN DIAMANTE\n\n✨ Diamantes de laboratorio o naturales\n🔶 Oro blanco, amarillo o rosé\n💎 Elegantes y versátiles\n🎁 Perfectos para uso diario\n\n¿Te gustaría ver diferentes tamaños?',
            image: 'https://i.imgur.com/example-boton.jpg'
        },
        'prod_colgante': {
            name: 'Aretes Colgantes Perla',
            price: '$900 - $2,800',
            description: '💎 ARETES COLGANTES PERLA\n\n✨ Perlas de cultivo de alta calidad\n🔶 Oro 14k o 18k\n💎 Movimiento elegante\n🎁 Ideales para ocasiones especiales\n\n¿Prefieres perlas blancas o doradas?',
            image: 'https://i.imgur.com/example-colgante.jpg'
        },
        'prod_aro': {
            name: 'Aretes Aro Oro 18k',
            price: '$650 - $1,800',
            description: '💎 ARETES ARO ORO 18K\n\n✨ Diseño clásico atemporal\n🔶 Oro amarillo, blanco o rosé\n💎 Diferentes diámetros disponibles\n🎁 Básicos esenciales\n\n¿Qué tamaño prefieres?',
            image: 'https://i.imgur.com/example-aro.jpg'
        }
    };

    const product = products[productId];
    if (product) {
        // Enviar imagen del producto primero
        await sendImageMessage(to, product.image, "");
        
        // Luego enviar detalles con botones de acción
        const data = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: `${product.description}\n\nPrecio: ${product.price}`
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'cotizar_producto',
                                title: '💰 Cotizar'
                            }
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'agendar_cita',
                                title: '📅 Agendar Cita'
                            }
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'ver_mas_productos',
                                title: '👀 Ver Más'
                            }
                        }
                    ]
                }
            }
        };
        await sendMessageAPI(data);
    }
}


module.exports = {
    sendTextMessage,
    sendImageMessage,
    sendProductListMessage,
    sendFlowMessage,
    sendTemplateMessage,
    sendInteractiveFlowButton,
    sendCategoriesMessage,
    sendCategoryProducts,
    sendProductDetail
};