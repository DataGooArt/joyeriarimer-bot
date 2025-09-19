'use strict';

// --- DEPENDENCIAS ---
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');

// --- CONFIGURACIÓN ---
const PORT = process.env.PORT || 1337;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = "joyeria-rimer-bot"; // Un token secreto que tú inventas
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Asegúrate de tener tu API Key de Gemini en el .env
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const MONGO_URI = process.env.MONGO_URI;
const CHATWOOT_URL = process.env.CHATWOOT_URL;
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
const CHATWOOT_INBOX_ID = process.env.CHATWOOT_INBOX_ID;

// --- INICIALIZACIÓN ---
const app = express();
app.use(express.json()); // Middleware para que Express entienda JSON

// Inicializa Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- MODELO DE BASE DE DATOS (MONGOOSE) ---
const conversationSchema = new mongoose.Schema({
    phoneNumber: String, // El número de WhatsApp del cliente
    history: [
        {
            user: String,
            assistant: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    lastInteraction: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

// --- RUTAS DEL SERVIDOR (WEBHOOKS) ---

// Endpoint para la verificación del Webhook (solo se usa una vez)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.error('❌ Falló la verificación. Tokens no coinciden.');
            res.sendStatus(403);
        }
    }
});

// Endpoint para recibir los mensajes de los usuarios
app.post('/webhook', async (req, res) => {
    const body = req.body;

    // Imprime el cuerpo de la petición para depuración
    console.log(JSON.stringify(body, null, 2));

    // Procesa el mensaje si es de WhatsApp
    if (body.object === 'whatsapp_business_account') {
        const entry = body.entry && body.entry[0];
        const change = entry.changes && entry.changes[0];
        const message = change.value.messages && change.value.messages[0];

        // Si hay un mensaje de texto, procesarlo con Gemini
        if (message && message.type === 'text') {
            const from = message.from; // Número del usuario
            const userQuery = message.text.body; // Texto del mensaje

            console.log(`💬 Mensaje recibido de ${from}: "${userQuery}"`);

            // Llama a la función que consulta a Gemini y responde
            await handleSmartReply(from, userQuery);
        } else if (message && message.type === 'image') {
            // Opcional: Manejar si el usuario envía una imagen
            const from = message.from;
            await sendTextMessage(from, "Gracias por la imagen. En este momento, estoy aprendiendo a interpretar fotos. ¿En qué más te puedo ayudar?");
        } else if (message) {
            // Manejar otros tipos de mensajes (audio, stickers, etc.)
            const from = message.from;
            await sendTextMessage(from, "Gracias por tu mensaje. Por ahora solo puedo procesar mensajes de texto.");
        }

        // Responde a Meta con un 200 OK para confirmar la recepción
        res.sendStatus(200);
    } else {
        // Si no es un evento de WhatsApp, ignóralo
        res.sendStatus(404);
    }
});

// --- FUNCIONES DE IA Y MENSAJERÍA ---

/**
 * Procesa la pregunta del usuario, detecta la intención con Gemini y actúa en consecuencia.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} userQuery - La pregunta del usuario.
 */
async function handleSmartReply(to, userQuery) {
    // Busca la conversación en la base de datos
    let conversation = await Conversation.findOne({ phoneNumber: to });

    // Si no existe, crea una nueva
    if (!conversation) {
        conversation = new Conversation({ phoneNumber: to, history: [] });
    }

    // Formatea el historial para el prompt
    // Tomamos solo los últimos 5 intercambios para no exceder el límite del prompt
    const recentHistory = conversation.history.slice(-5);
    const historyForPrompt = recentHistory
        .map(turn => `Cliente: "${turn.user}"\nAsistente: "${turn.assistant}"`)
        .join('\n');

    try {
        // --- INYECCIÓN DE CONOCIMIENTO (RAG Básico) ---
        let productInfo = "";
        // Si la intención parece ser sobre productos, buscamos en la BD
        if (userQuery.toLowerCase().includes('anillo') || userQuery.toLowerCase().includes('aro')) {
            const products = await Product.find({ $text: { $search: userQuery } }).limit(2);
            if (products.length > 0) {
                productInfo = "Basado en tu pregunta, he encontrado estos productos en nuestro catálogo:\n" + products.map(p => `- Nombre: ${p.name}, Material: ${p.material}, Gema: ${p.gem}, Descripción: ${p.description}`).join('\n');
            }
        }

        // Prompt mejorado para que Gemini devuelva una estructura JSON
        const prompt = `
            Eres un asistente virtual experto de "Joyería Rimer", una prestigiosa joyería especialista en anillos de compromiso y matrimonio.
            Analiza la "Pregunta Actual del Cliente" basándote en el "Historial de Conversación".
            Tu tarea es generar una respuesta en formato JSON con dos campos: "intent" y "response".

            Posibles intenciones ("intent"):
            - "greeting": El cliente está saludando.
            - "product_inquiry": El cliente pregunta sobre productos, materiales, precios, etc.
            - "show_image": El cliente pide ver una foto de un producto específico (ej: "muéstrame un anillo solitario").
            - "human_handover": El cliente pide explícitamente hablar con una persona, un asesor o un humano.
            - "off_topic": La pregunta no tiene relación con la joyería.
            - "general_question": Cualquier otra pregunta relacionada con la joyería (horarios, ubicación, etc.).

            Historial de Conversación:
            ${historyForPrompt}

            Información Relevante de Nuestro Catálogo (si aplica):
            ${productInfo}

            Pregunta Actual del Cliente: "${userQuery}"

            Genera solo el objeto JSON, sin texto adicional.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        // Limpiamos la respuesta para asegurarnos de que sea un JSON válido
        const jsonText = response.text().replace(/```json|```/g, '').trim();
        const aiResponse = JSON.parse(jsonText);

        console.log(`🤖 Intención detectada: ${aiResponse.intent}`);
        console.log(`🤖 Respuesta generada: "${aiResponse.response}"`);

        // Guarda el nuevo intercambio en la base de datos
        conversation.history.push({ user: userQuery, assistant: aiResponse.response });
        conversation.lastInteraction = new Date();
        await conversation.save();

        // Actuar según la intención detectada
        switch (aiResponse.intent) {
            case 'human_handover':
                // La transferencia a Chatwoot está temporalmente desactivada.
                // await transferToChatwoot(to, userQuery); 
                await sendTextMessage(to, "En este momento, nuestros asesores no están disponibles. Por favor, intenta más tarde.");
                break;
            case 'show_image':
                // Para este ejemplo, enviamos una imagen genérica. En un caso real, buscarías la imagen correcta.
                const product = await Product.findOne({ name: /solitario/i }); // Búsqueda simple por nombre
                await sendTextMessage(to, aiResponse.response);
                if (product && product.imageUrl) {
                    await sendImageMessage(to, product.imageUrl, product.name);
                } else {
                    await sendImageMessage(to, 'https://i.imgur.com/TuVo1iX.jpeg', 'Aquí tienes un ejemplo de nuestros anillos.');
                }
                break;
            case 'list_products':
                // Buscamos productos en la base de datos para mostrarlos en la lista
                const productsToList = await Product.find({ category: /compromiso/i }).limit(10); // Busca hasta 10 anillos de compromiso
                await sendProductListMessage(to, productsToList, aiResponse.response, "Ver Anillos");
                break;
            default:
                // Para cualquier otra intención, simplemente envía la respuesta de texto.
                await sendTextMessage(to, aiResponse.response);
                break;
        }

    } catch (error) {
        console.error("❌ Error en handleSmartReply:", error);
        await sendTextMessage(to, "Lo siento, estoy teniendo problemas para procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.");
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
 * Simula la transferencia a un agente humano en Chatwoot.
 * @param {string} from - El número de teléfono del cliente.
 * @param {string} initialMessage - El último mensaje del cliente.
 */
async function transferToChatwoot(from, initialMessage) {
    console.log(`--- 🚨 INICIANDO TRANSFERENCIA A CHATWOOT PARA ${from} 🚨 ---`);

    const chatwootAPI = axios.create({
        baseURL: `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}`,
        headers: {
            'Content-Type': 'application/json',
            'api_access_token': CHATWOOT_API_TOKEN
        }
    });

    try {
        // 1. Buscar si el contacto ya existe
        let contact = null;
        const searchResponse = await chatwootAPI.get(`/contacts/search?q=${from}`);
        
        if (searchResponse.data.payload.length > 0) {
            contact = searchResponse.data.payload[0];
            console.log(`✅ Contacto encontrado en Chatwoot (ID: ${contact.id})`);
        } else {
            // 2. Si no existe, crearlo
            console.log(`Contacto no encontrado. Creando uno nuevo...`);
            const createResponse = await chatwootAPI.post('/contacts', {
                inbox_id: CHATWOOT_INBOX_ID,
                name: `Cliente WhatsApp ${from}`, // Un nombre temporal
                phone_number: `+${from}` // Chatwoot requiere el '+'
            });
            contact = createResponse.data.payload.contact;
            console.log(`✅ Contacto nuevo creado (ID: ${contact.id})`);
        }

        // 3. Crear una nueva conversación para ese contacto
        const conversationResponse = await chatwootAPI.post(`/contacts/${contact.id}/conversations`, {
            inbox_id: CHATWOOT_INBOX_ID,
            source_id: contact.source_id // Reutiliza el source_id del contacto
        });
        const conversation = conversationResponse.data;
        console.log(`✅ Conversación creada (ID: ${conversation.id})`);

        // 4. (Opcional pero recomendado) Añadir el historial como una nota privada
        const dbConversation = await Conversation.findOne({ phoneNumber: from });
        const historyText = (dbConversation.history || [])
            .map(turn => `Cliente: "${turn.user}"\nAsistente: "${turn.assistant}"`)
            .join('\n\n');
        if (historyText) {
            await chatwootAPI.post(`/conversations/${conversation.id}/messages`, {
                content: `--- Historial de la conversación con el bot ---\n${historyText}`,
                private: true, // Esto hace que sea una nota interna
                message_type: "private"
            });
            console.log(`✅ Historial de la conversación añadido como nota privada.`);
        }

        // 5. Añadir el último mensaje del usuario para iniciar la conversación
        await chatwootAPI.post(`/conversations/${conversation.id}/messages`, {
            content: initialMessage,
            message_type: "incoming"
        });
        console.log(`✅ Mensaje inicial del cliente añadido a la conversación.`);
        console.log(`--- ✅ TRANSFERENCIA COMPLETADA ---`);

    } catch (error) {
        console.error("❌ Error al transferir a Chatwoot:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        await sendTextMessage(from, "Tuvimos un problema al transferirte con un asesor. Por favor, intenta de nuevo en un momento.");
    }
}

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

// --- INICIAR SERVIDOR ---

/**
 * Inicia el servidor Express y el túnel de ngrok.
 */
async function startServer() {
  try {
    // 1. Conectar a la base de datos
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // 2. Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor de producción escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();