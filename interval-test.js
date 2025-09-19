// interval-test.js

require('dotenv').config();
const axios = require('axios');

// --- CONFIGURACIÓN ---
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TO_PHONE_NUMBER = process.env.TO_PHONE_NUMBER; // Leemos el número desde el archivo .env

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !TO_PHONE_NUMBER) {
    console.error("Error: Asegúrate de que WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID y TO_PHONE_NUMBER estén en tu archivo .env");
    process.exit(1);
}

// --- FUNCIONES DE ENVÍO ---

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
        console.log(`✅ Mensaje de tipo '${data.type}' enviado a ${data.to}`);
    } catch (error) {
        console.error(`❌ Error al enviar mensaje de tipo '${data.type}':`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

/**
 * Envía un mensaje de texto simple.
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
 * Envía un mensaje con una imagen desde una URL.
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
 * Envía un mensaje interactivo con botones.
 */
async function sendButtonsMessage(to) {
    const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: 'Este es un mensaje con botones. ¿Qué te gustaría ver?'
            },
            action: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: 'ver_anillos_compromiso',
                            title: 'Anillos de Compromiso'
                        }
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: 'ver_aros_matrimonio',
                            title: 'Aros de Matrimonio'
                        }
                    }
                ]
            }
        }
    };
    await sendMessageAPI(data);
}

/**
 * Función principal que orquesta el envío de los mensajes de prueba.
 */
async function runTest() {
  console.log(`🚀 Iniciando secuencia de pruebas para ${TO_PHONE_NUMBER}...`);

  // 1. Enviar PLANTILLA para abrir la ventana de 24 horas.
  console.log("Enviando plantilla 'hello_world' para iniciar la conversación...");
  await sendMessageAPI({
    messaging_product: 'whatsapp',
    to: TO_PHONE_NUMBER,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' }
    }
  });

  // Esperar un poco para que el mensaje llegue y se procese
  console.log("\nEsperando 15 segundos para continuar...");
  await new Promise(resolve => setTimeout(resolve, 15000));

  // 2. Enviar mensaje de texto simple (ahora debería funcionar)
  console.log("Enviando mensaje de texto simple...");
  await sendTextMessage(TO_PHONE_NUMBER, "Ahora que la conversación está abierta, este es un mensaje de texto libre.");

  // Esperar 1 minuto (60,000 milisegundos)
  console.log("\nEsperando 1 minuto para el siguiente mensaje...");
  await new Promise(resolve => setTimeout(resolve, 60000));

  // 3. Enviar mensaje con imagen
  console.log("Enviando mensaje con imagen...");
  await sendImageMessage(
    TO_PHONE_NUMBER,
    "https://i.imgur.com/TuVo1iX.jpeg", // URL de la imagen del anillo solitario
    "Este es un ejemplo de nuestro Anillo Solitario Clásico."
  );

  // Esperar 1 minuto
  console.log("\nEsperando 1 minuto para el siguiente mensaje...");
  await new Promise(resolve => setTimeout(resolve, 60000));

  // 4. Enviar mensaje con botones
  console.log("Enviando mensaje con botones interactivos...");
  await sendButtonsMessage(TO_PHONE_NUMBER);

  console.log("\n✅ Secuencia de pruebas completada.");
}

// Inicia la secuencia de pruebas
runTest();