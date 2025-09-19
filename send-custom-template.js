// send-custom-template.js

require('dotenv').config();
const axios = require('axios');

// Lee las credenciales desde las variables de entorno
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TO_PHONE_NUMBER = process.env.TO_PHONE_NUMBER;

// Verifica que todas las variables necesarias estén presentes
if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !TO_PHONE_NUMBER) {
    console.error("Error: Asegúrate de definir WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID y TO_PHONE_NUMBER en tu archivo .env");
    process.exit(1);
}

// Función para enviar una plantilla con variables
async function sendCustomWelcomeTemplate(customerName) {
    // --- ¡PUNTOS A VERIFICAR! ---
    // 1. El nombre de la plantilla debe ser EXACTAMENTE igual al que aparece en el Administrador de WhatsApp.
    //    Es sensible a mayúsculas/minúsculas.
    const templateName = 'bienvenida_personalizada'; 
    
    console.log(`Intentando enviar plantilla '${templateName}' a ${TO_PHONE_NUMBER}...`);

    const data = {
        messaging_product: 'whatsapp',
        to: TO_PHONE_NUMBER,
        type: 'template',
        template: {
            name: templateName,
            language: {
                // 2. El código de idioma debe coincidir con el de tu plantilla aprobada (ej. 'es', 'es_MX', etc.).
                code: 'es' 
            },
            components: [
                {
                    type: 'body',
                    parameters: [
                        {
                            type: 'text',
                            // Este valor reemplazará a la variable {{1}} en tu plantilla
                            text: customerName 
                        }
                    ]
                }
            ]
        }
    };

    const headers = {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
    };

    const url = `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    try {
        const response = await axios.post(url, data, { headers });
        console.log("✅ ¡Plantilla personalizada enviada exitosamente!");
        console.log("Respuesta de la API:", response.data);
    } catch (error) {
        console.error("❌ Error al enviar la plantilla:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

// Llama a la función con el nombre que quieres usar en la variable.
sendCustomWelcomeTemplate("Rafael");