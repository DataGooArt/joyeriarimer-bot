'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const whatsapp = require('../api/whatsapp.js');
const { buildMainPrompt } = require('./prompts');

// --- CONFIGURACIÓN E INICIALIZACIÓN DEL LLM ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- MODELOS DE BASE DE DATOS (MONGOOSE) ---
const conversationSchema = new mongoose.Schema({
    phoneNumber: String,
    firstName: String,
    lastName: String,
    priority: { type: String, default: 'low' },
    status: { type: String, default: 'open' },
    history: [
        {
            user: String,
            assistant: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    lastInteraction: { type: Date, default: Date.now },
    currentProductContext: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    leadScore: { type: Number, default: 0 },
    extractedData: {
        budget: String,
        event: String,
        urgency: String,
        preferences: String
    }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    material: String,
    gem: String,
    description: String,
    imageUrl: String,
    price: Number,
    isArtisanal: { type: Boolean, default: true }
});
productSchema.index({ name: 'text', description: 'text', category: 'text', material: 'text', gem: 'text' });

const Product = mongoose.model('Product', productSchema);

/**
 * Genera una respuesta estructurada en JSON a partir de un prompt.
 * @param {string} prompt - El prompt completo a enviar al modelo de lenguaje.
 * @returns {Promise<object>} El objeto JSON parseado de la respuesta del modelo.
 */
async function generateJsonResponse(prompt) {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(jsonText);
}

/**
 * Procesa la pregunta del usuario, detecta la intención con Gemini y actúa en consecuencia.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} userQuery - La pregunta del usuario.
 */
async function handleSmartReply(to, userQuery) {
    // Usamos .populate() para traer la información del producto en contexto
    let conversation = await Conversation.findOne({ phoneNumber: to }).populate('currentProductContext');
    if (!conversation) {
        conversation = new Conversation({ phoneNumber: to, history: [] });
    }

    const recentHistory = conversation.history.slice(-5);
    const historyForPrompt = recentHistory
        .map(turn => `Cliente: "${turn.user}"\nAsistente: "${turn.assistant}"`)
        .join('\n');

    try {
        const prompt = buildMainPrompt(conversation, userQuery, historyForPrompt);
        const aiResponse = await generateJsonResponse(prompt);

        console.log(`🤖 Intención detectada: ${aiResponse.intent}`);
        console.log(`🤖 Respuesta generada: "${aiResponse.response}"`);
        console.log(`⭐ Prioridad asignada: ${aiResponse.priority}`);
        console.log(`💯 Lead Score: ${aiResponse.leadScore}`);

        if (aiResponse.firstName) conversation.firstName = aiResponse.firstName;
        if (aiResponse.lastName) conversation.lastName = aiResponse.lastName;

        conversation.priority = aiResponse.priority;
        conversation.status = aiResponse.status;
        conversation.leadScore = aiResponse.leadScore;

        // Guardamos los datos extraídos si existen
        if (aiResponse.extractedData) {
            // Usamos Object.assign para fusionar los datos en el subdocumento de Mongoose
            Object.assign(conversation.extractedData, aiResponse.extractedData);
        }

        if (conversation.priority === 'high') {
            console.log('🔥🔥🔥 ¡ATENCIÓN! Conversación de ALTA PRIORIDAD detectada. 🔥🔥🔥');
        }

        // La respuesta del bot ahora se guarda en el historial
        conversation.history.push({ user: userQuery, assistant: aiResponse.response });
        conversation.lastInteraction = new Date();
        await conversation.save();

        // Actuamos según la acción sugerida por la IA
        switch (aiResponse.intent) { // Cambiado a 'intent' para una acción más directa
            case 'human_handover':
                await whatsapp.sendTextMessage(to, aiResponse.response);
                await transferToChatwoot(to, userQuery);
                break;
            case 'show_image':
                const product = await Product.findOne({ name: /solitario/i });
                await whatsapp.sendTextMessage(to, aiResponse.response);
                if (product && product.imageUrl) {
                    await whatsapp.sendImageMessage(to, product.imageUrl, product.name);
                } else {
                    await whatsapp.sendImageMessage(to, 'https://i.imgur.com/TuVo1iX.jpeg', 'Aquí tienes un ejemplo de nuestros anillos.');
                }
                break;
            case 'list_products':
            case 'product_inquiry':
                let productsToList = [];
                if (userQuery.length > 3) {
                    productsToList = await Product.find(
                        { $text: { $search: userQuery } },
                        { score: { $meta: "textScore" } }
                    ).sort({ score: { $meta: "textScore" } }).limit(3);
                }

                if (productsToList.length === 0) {
                    console.log('⚠️ Búsqueda sin resultados, intentando búsqueda contextual con historial.');
                    const contextKeywords = historyForPrompt.match(/compromiso|matrimonio|solitario|zafiro|pulsera|cadena/gi)?.join(' ') || 'anillo';
                    productsToList = await Product.find({ $text: { $search: contextKeywords } }).limit(3);
                }

                await whatsapp.sendProductListMessage(to, productsToList, aiResponse.response, "Ver Anillos");
                break;
            case 'schedule_appointment':
                // Aquí iría la lógica para agendar una cita (próxima fase)
                await whatsapp.sendTextMessage(to, aiResponse.response + " (Función de agendamiento en desarrollo).");
                break;
            default:
                await whatsapp.sendTextMessage(to, aiResponse.response);
                break;
        }

    } catch (error) {
        console.error("❌ Error en handleSmartReply:", error);
        await whatsapp.sendTextMessage(to, "Lo siento, estoy teniendo problemas para procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.");
    }
}

/**
 * Maneja la selección de un producto de una lista interactiva.
 * @param {string} to - El número de teléfono del destinatario.
 * @param {string} productId - El ID del producto seleccionado.
 */
async function handleProductSelection(to, productId) {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            console.error(`Producto con ID ${productId} no encontrado.`);
            await whatsapp.sendTextMessage(to, "Lo siento, hubo un problema al obtener la información de ese producto. ¿Podrías intentarlo de nuevo?");
            return;
        }

        const conversation = await Conversation.findOne({ phoneNumber: to });
        if (conversation) {
            // Actualizamos el contexto del producto actual en la conversación
            conversation.currentProductContext = product._id;
            conversation.history.push({ user: `Seleccionó: ${product.name}`, assistant: `Mostrando detalles de ${product.name}` });
            await conversation.save();
        }

        await whatsapp.sendImageMessage(to, product.imageUrl, `${product.name}\n\nMaterial: ${product.material}\nGema: ${product.gem}\nPrecio: $${product.price}\n\n${product.description}`);

    } catch (error) {
        console.error("❌ Error en handleProductSelection:", error);
        await whatsapp.sendTextMessage(to, "Lo siento, no pude encontrar los detalles de ese producto.");
    }
}

/**
 * Simula la transferencia a un agente humano en Chatwoot.
 * @param {string} from - El número de teléfono del cliente.
 * @param {string} initialMessage - El último mensaje del cliente.
 */
async function transferToChatwoot(from, initialMessage) {
    // La lógica de Chatwoot permanece aquí por ahora, pero podría moverse a su propio módulo api/chatwoot.js en el futuro.
    const CHATWOOT_URL = process.env.CHATWOOT_URL;
    const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
    const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN;
    const CHATWOOT_INBOX_ID = process.env.CHATWOOT_INBOX_ID;

    if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN || !CHATWOOT_INBOX_ID) {
        console.warn('⚠️  Credenciales de Chatwoot no configuradas. Omitiendo transferencia.');
        return;
    }

    console.log(`--- 🚨 INICIANDO TRANSFERENCIA A CHATWOOT PARA ${from} 🚨 ---`);

    const chatwootAPI = require('axios').create({
        baseURL: `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}`,
        headers: {
            'Content-Type': 'application/json',
            'api_access_token': CHATWOOT_API_TOKEN
        }
    });

    try {
        let contact = null;
        const searchResponse = await chatwootAPI.get(`/contacts/search?q=${from}`);
        
        if (searchResponse.data.payload.length > 0) {
            contact = searchResponse.data.payload[0];
            console.log(`✅ Contacto encontrado en Chatwoot (ID: ${contact.id})`);
        } else {
            console.log(`Contacto no encontrado. Creando uno nuevo...`);
            const createResponse = await chatwootAPI.post('/contacts', {
                inbox_id: CHATWOOT_INBOX_ID,
                name: `Cliente WhatsApp ${from}`,
                phone_number: `+${from}`
            });
            contact = createResponse.data.payload.contact;
            console.log(`✅ Contacto nuevo creado (ID: ${contact.id})`);
        }

        const conversationResponse = await chatwootAPI.post(`/contacts/${contact.id}/conversations`, {
            inbox_id: CHATWOOT_INBOX_ID,
            source_id: contact.source_id
        });
        const conversation = conversationResponse.data;
        console.log(`✅ Conversación creada (ID: ${conversation.id})`);

        const dbConversation = await Conversation.findOne({ phoneNumber: from });
        const historyText = (dbConversation.history || [])
            .map(turn => `Cliente: "${turn.user}"\nAsistente: "${turn.assistant}"`)
            .join('\n\n');
        if (historyText) {
            await chatwootAPI.post(`/conversations/${conversation.id}/messages`, {
                content: `--- Historial de la conversación con el bot ---\n${historyText}`,
                private: true,
                message_type: "private"
            });
            console.log(`✅ Historial de la conversación añadido como nota privada.`);
        }

        await chatwootAPI.post(`/conversations/${conversation.id}/messages`, {
            content: initialMessage,
            message_type: "incoming"
        });
        console.log(`✅ Mensaje inicial del cliente añadido a la conversación.`);
        console.log(`--- ✅ TRANSFERENCIA COMPLETADA ---`);

        if (dbConversation.priority === 'high') {
            await chatwootAPI.post(`/conversations/${conversation.id}/labels`, {
                labels: ["prioridad_alta"]
            });
            console.log(`🏷️ Etiqueta 'prioridad_alta' añadida a la conversación en Chatwoot.`);
        }

    } catch (error) {
        console.error("❌ Error al transferir a Chatwoot:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        await whatsapp.sendTextMessage(from, "Tuvimos un problema al transferirte con un asesor. Por favor, intenta de nuevo en un momento.");
    }
}

module.exports = {
    handleSmartReply,
    handleProductSelection,
    Conversation,
    Product,
    // Exportamos los modelos para que otros scripts (como add-products) puedan usarlos
    getModel: (modelName) => {
        if (modelName === 'Product') return Product;
        if (modelName === 'Conversation') return Conversation;
        return null;
    }
};