'use strict';

// --- DEPENDENCIAS ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { handleSmartReply, handleProductSelection } = require('./core/bot');

// --- CONFIGURACIÓN ---
const PORT = process.env.PORT || 1337;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

// --- INICIALIZACIÓN ---
const app = express();
app.use(express.json()); // Middleware para que Express entienda JSON

// --- RUTAS DEL SERVIDOR (WEBHOOKS) ---

// Endpoint para la verificación del Webhook (solo se usa una vez)
app.get('/webhook', (req, res) => {
    console.log('--- INICIANDO VERIFICACIÓN DE WEBHOOK ---');

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`Modo recibido: ${mode}`);
    console.log(`Token recibido: ${token}`);
    console.log(`Token esperado: ${VERIFY_TOKEN}`);

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
    try {
        const body = req.body;
        console.log(JSON.stringify(body, null, 2));

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry && body.entry[0];
            const change = entry.changes && entry.changes[0];
            const message = change.value.messages && change.value.messages[0];

            if (message) {
                const from = message.from;

                if (message.type === 'text') {
                    console.log(`💬 Mensaje de texto recibido de ${from}: "${message.text.body}"`);
                    await handleSmartReply(from, message.text.body);
                } else if (message.type === 'interactive' && message.interactive.type === 'list_reply') {
                    const selectedProductId = message.interactive.list_reply.id.replace('product_', '');
                    console.log(`🛍️ Usuario ${from} seleccionó un producto de la lista (ID: ${selectedProductId})`);
                    await handleProductSelection(from, selectedProductId);
                } else {
                    console.log(`⏩ Ignorando mensaje de tipo '${message.type}' de ${from}`);
                }
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Error procesando el webhook:', error);
        res.sendStatus(500);
    }
});

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
