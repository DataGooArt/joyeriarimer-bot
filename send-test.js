// send-test.js

// Carga las variables de entorno desde el archivo .env
require('dotenv').config();
const axios = require('axios');

// Lee las credenciales desde las variables de entorno
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TO_PHONE_NUMBER = process.env.TO_PHONE_NUMBER;

// Verifica que todas las variables necesarias estén presentes
if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !TO_PHONE_NUMBER) {
    console.error("Error: Asegúrate de definir WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID y TO_PHONE_NUMBER en tu archivo .env");
    process.exit(1); // Termina el script si faltan credenciales
}

// Función asíncrona para enviar el mensaje
async function sendHelloWorldTemplate() {
    console.log(`Intentando enviar plantilla 'hello_world' a ${TO_PHONE_NUMBER}...`);

    // Construye el cuerpo de la petición (payload)
    const data = {
        messaging_product: 'whatsapp',
        to: TO_PHONE_NUMBER,
        type: 'template',
        template: {
            name: 'hello_world', // El nombre de la plantilla
            language: {
                code: 'en_US' // El código de idioma de la plantilla. 'hello_world' suele ser en_US o es.
            }
        }
    };

    // Configura los encabezados de la petición
    const headers = {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
    };

    // URL de la API Graph de Meta
    const url = `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    try {
        // Realiza la petición POST con axios
        const response = await axios.post(url, data, { headers });
        console.log("¡Mensaje enviado exitosamente!");
        console.log("Respuesta de la API:", response.data);
    } catch (error) {
        console.error("Error al enviar el mensaje:");
        // Si la API devuelve un error, los detalles suelen estar en error.response.data
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            // Si el error es de red u otro tipo
            console.error(error.message);
        }
    }
}

// Llama a la función para ejecutar el envío
sendHelloWorldTemplate();
