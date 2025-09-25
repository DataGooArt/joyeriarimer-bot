'use strict';

// --- DEPENDENCIAS ---
// En producción (Docker), el archivo de config se monta en /joyeria-rimer-env
// En desarrollo, se usa el .env local.
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { processWebhook } = require('./core/webhookHandler.js'); // Importamos el nuevo manejador

// --- CONFIGURACIÓN ---
const PORT = process.env.PORT || 1337;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Leemos el token desde .env
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
        // processWebhook ahora puede devolver una respuesta para cifrar.
        const responsePayload = await processWebhook(req.body);

        if (responsePayload) {
            // Si hay una respuesta, es una respuesta cifrada de un Flow.
            res.status(200).send(responsePayload);
        } else {
            // Si no, es un webhook normal (mensaje de texto, etc.), solo confirmamos la recepción.
            res.sendStatus(200);
        }
    } catch (error) {
        console.error('Error procesando el webhook:', error);
        res.sendStatus(500);
    }
});

// Endpoint específico para WhatsApp Flows de citas
app.post('/webhook/appointment-flow', async (req, res) => {
    try {
        console.log('🔄 Solicitud de Flow de citas recibida en /webhook/appointment-flow');
        
        // Usar el manejador específico para Flows
        const responsePayload = await processWebhook(req.body);

        if (responsePayload) {
            // Respuesta cifrada de Flow
            console.log('✅ Enviando respuesta cifrada del Flow');
            res.status(200).send(responsePayload);
        } else {
            // Respuesta básica
            console.log('✅ Enviando respuesta básica del Flow');
            res.sendStatus(200);
        }
    } catch (error) {
        console.error('❌ Error procesando Flow de citas:', error);
        res.sendStatus(500);
    }
});

// --- INICIAR SERVIDOR ---

/**
 * Inicia el servidor Express.
 */
async function startServer() {
  // Verificación de variables de entorno esenciales
  const requiredEnvVars = ['MONGO_URI', 'GEMINI_API_KEY', 'WHATSAPP_TOKEN', 'VERIFY_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_FLOW_WELCOME_ID'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`❌ Error: Faltan variables de entorno esenciales: ${missingVars.join(', ')}`);
    console.error('Asegúrate de que tu archivo .env (local) o la configuración del entorno (producción) estén completos.');
    process.exit(1);
  }

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
