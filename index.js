'use strict';

// --- DEPENDENCIAS ---
// En producción (Docker), el archivo de config se monta en /joyeria-rimer-env
// En desarrollo, se usa el .env local.
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const { connectDB } = require('./services/dbService');
const { processWebhook } = require('./core/webhookHandler.js'); // Importamos el nuevo manejador

// --- CONFIGURACIÓN ---
const PORT = process.env.PORT || 1337;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Leemos el token desde .env
const APP_SECRET = process.env.APP_SECRET || process.env.WHATSAPP_APP_SECRET; // Para verificación HMAC
const MONGO_URI = process.env.MONGO_URI;

// --- INICIALIZACIÓN ---
const app = express();

// Configurar express.json para capturar raw body (necesario para verificación HMAC)
app.use(express.json({
    verify: (req, res, buf) => { 
        req.rawBody = buf; 
    }
}));

// --- FUNCIÓN DE VERIFICACIÓN DE FIRMA HMAC-SHA256 ---
function verifySignature(rawBody, headerSignature) {
    // Si no hay APP_SECRET, mostrar advertencia pero continuar en desarrollo
    if (!APP_SECRET) {
        console.warn('⚠️ APP_SECRET no configurado - verificación HMAC deshabilitada (solo para desarrollo)');
        return true; // Permitir en desarrollo sin APP_SECRET
    }
    
    if (!headerSignature) return false;
    
    // headerSignature suele tener formato: "sha256=HEX"
    const parts = headerSignature.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') return false;
    
    try {
        const expected = crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
        const actual = parts[1];
        
        // timing-safe compare
        const a = Buffer.from(actual, 'hex');
        const b = Buffer.from(expected, 'hex');
        if (a.length !== b.length) return false;
        
        return crypto.timingSafeEqual(a, b);
    } catch (err) {
        console.error('❌ Error en verificación de firma:', err.message);
        return false;
    }
}

// Middleware de debugging para ver todas las peticiones (temporal)
app.use((req, res, next) => {
    console.log('🔍 REQ', new Date().toISOString(), req.ip, req.method, req.originalUrl);
    console.log('🔍 HEADERS', JSON.stringify(req.headers, null, 2));
    console.log('🔍 QUERY', JSON.stringify(req.query, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('🔍 BODY', JSON.stringify(req.body, null, 2));
    }
    next();
});

// --- RUTAS DEL SERVIDOR (WEBHOOKS) ---

// Endpoint para la verificación del Webhook (solo se usa una vez)
// Manejo de OPTIONS para CORS (antes de las rutas específicas)
app.options('/webhook', (req, res) => {
    console.log('ℹ️ Petición OPTIONS para CORS - configurando headers');
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hub-Signature-256'
    });
    res.sendStatus(204);
});

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
    } else {
        // Meta a veces hace peticiones GET sin parámetros para verificar disponibilidad
        console.log('ℹ️ Petición GET sin parámetros de verificación - respondiendo OK');
        res.status(200).send('Webhook endpoint is active');
    }
});

// Endpoint para recibir los mensajes de los usuarios
app.post('/webhook', async (req, res) => {
    try {
        // Configurar headers CORS para WhatsApp Flows
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hub-Signature-256'
        });

        // Verificar firma HMAC-SHA256 si está presente y APP_SECRET está configurado
        const signature = req.get('X-Hub-Signature-256') || req.get('x-hub-signature-256');
        if (signature && APP_SECRET) {
            const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
            const isValid = verifySignature(rawBody, signature);
            
            if (!isValid) {
                console.warn('⚠️ Firma HMAC inválida', { 
                    ip: req.ip, 
                    userAgent: req.get('User-Agent'),
                    signature: signature.substring(0, 20) + '...' 
                });
                return res.status(403).json({ error: 'Invalid signature' });
            }
            
            console.log('✅ Firma HMAC verificada correctamente');
        } else if (signature && !APP_SECRET) {
            console.warn('⚠️ Firma HMAC presente pero APP_SECRET no configurado - continuando en modo desarrollo');
        } else {
            console.log('ℹ️ No se envió firma HMAC (modo desarrollo)');
        }

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

// --- ENDPOINTS ADICIONALES PARA WHATSAPP FLOWS ---

// Health check endpoint para WhatsApp Flows
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'active',
        timestamp: new Date().toISOString(),
        service: 'WhatsApp Flow Endpoint'
    });
});

// Endpoint alternativo para health check
app.post('/health', (req, res) => {
    // Verificar si es un health check de WhatsApp Flow
    if (req.body && req.body.action === 'ping') {
        res.status(200).json({
            data: {
                status: 'active'
            }
        });
    } else {
        res.status(200).json({
            status: 'active',
            timestamp: new Date().toISOString(),
            service: 'WhatsApp Flow Endpoint'
        });
    }
});

// Endpoint adicional que a veces requiere Meta para verificaciones
app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'WhatsApp Bot',
        version: '2.1.1',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Endpoint específico para phone_number_id (requerido por algunos flows)
app.get('/webhook/:phone_number_id', (req, res) => {
    const phoneNumberId = req.params.phone_number_id;
    console.log(`📞 Verificación específica para phone_number_id: ${phoneNumberId}`);
    
    res.status(200).json({
        phone_number_id: phoneNumberId,
        status: 'active',
        encryption: 'enabled',
        timestamp: new Date().toISOString()
    });
});

app.post('/webhook/:phone_number_id', async (req, res) => {
    try {
        const phoneNumberId = req.params.phone_number_id;
        console.log(`📞 Webhook específico para phone_number_id: ${phoneNumberId}`);
        
        // Procesar igual que el webhook principal
        const responsePayload = await processWebhook(req.body);
        
        if (responsePayload) {
            res.status(200).send(responsePayload);
        } else {
            res.sendStatus(200);
        }
    } catch (error) {
        console.error('Error procesando webhook específico:', error);
        res.sendStatus(500);
    }
});

// Endpoint raíz con información básica
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'Joyería Rimer WhatsApp Bot',
        version: '2.1.1',
        status: 'active',
        endpoints: {
            webhook: '/webhook',
            health: '/health',
            encryption: '/encryption'
        }
    });
});

// Endpoint específico para verificación de cifrado de WhatsApp Flows
app.get('/encryption', (req, res) => {
    res.status(200).json({
        status: 'active',
        encryption: 'enabled',
        version: '2.1.1',
        timestamp: new Date().toISOString()
    });
});

// Endpoint POST para el cifrado de WhatsApp Flows
app.post('/encryption', (req, res) => {
    try {
        // Este endpoint maneja las verificaciones de cifrado de Meta
        console.log('🔐 Verificación de cifrado recibida:', JSON.stringify(req.body, null, 2));
        
        // Respuesta estándar para verificaciones de cifrado
        res.status(200).json({
            status: 'verified',
            encryption: 'active',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error en endpoint de cifrado:', error);
        res.status(500).json({
            error: 'Encryption verification failed',
            timestamp: new Date().toISOString()
        });
    }
});

// --- ENDPOINT TEMPORAL PARA LIMPIAR DATOS (SOLO PARA TESTING) ---
app.delete('/clean-user/:phone', async (req, res) => {
    try {
        const { cleanUserData } = require('./core/bot.js');
        const phoneNumber = req.params.phone;
        
        console.log(`🧪 TESTING: Solicitud de limpieza para usuario: ${phoneNumber}`);
        
        const result = await cleanUserData(phoneNumber);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: `Datos del usuario ${phoneNumber} limpiados correctamente`,
                details: result.message
            });
        } else {
            res.status(500).json({
                success: false,
                message: `Error limpiando datos del usuario ${phoneNumber}`,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ Error en endpoint de limpieza:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Manejo de OPTIONS para el endpoint de Flow (CORS)
app.options('/webhook/appointment-flow', (req, res) => {
    console.log('ℹ️ Petición OPTIONS para Flow endpoint - configurando headers CORS');
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Hub-Signature-256'
    });
    res.sendStatus(204);
});

// Endpoint específico para flows de citas (con encriptación)
app.post('/webhook/appointment-flow', async (req, res) => {
    try {
        console.log('📅 Procesando petición de flow encriptado:', JSON.stringify(req.body, null, 2));
        
        // Verificar que la petición tiene la estructura correcta de Flow encriptado
        if (!req.body.encrypted_flow_data || !req.body.encrypted_aes_key || !req.body.initial_vector) {
            console.error('❌ Estructura de Flow encriptado incorrecta');
            return res.status(400).json({
                error: 'Invalid encrypted flow structure'
            });
        }

        // Importar funciones de encriptación
        const { decryptRequest, encryptResponse, FlowEndpointException } = require('./core/encryption');
        
        // Desencriptar la petición
        let decryptedData;
        try {
            decryptedData = decryptRequest(req.body, process.env.WHATSAPP_FLOW_PRIVATE_KEY);
            console.log('✅ Datos desencriptados:', JSON.stringify(decryptedData, null, 2));
        } catch (decryptError) {
            console.error('❌ Error desencriptando Flow:', decryptError);
            // Código 421 específico para errores de encriptación según documentación Meta
            return res.status(421).json({
                error: 'Decryption failed'
            });
        }

        // Procesar la respuesta del Flow
        const FlowService = require('./services/flowService');
        let flowResponse;
        
        try {
            flowResponse = await FlowService.processAppointmentFlowResponse(decryptedData);
            console.log('✅ Flow procesado exitosamente:', flowResponse);
        } catch (flowError) {
            console.error('❌ Error procesando Flow:', flowError);
            return res.status(400).json({
                error: 'Flow processing failed'
            });
        }

        // Si el Flow requiere una respuesta (navegación entre pantallas)
        if (flowResponse && flowResponse.responseRequired) {
            try {
                // Usar los buffers originales de la petición desencriptada
                const { aesKeyBuffer, initialVectorBuffer } = decryptedData;
                const encryptedResponse = encryptResponse(flowResponse.data, aesKeyBuffer, initialVectorBuffer);
                console.log('✅ Respuesta encriptada enviada');
                // Responder como plain text según ejemplo de Meta
                return res.status(200).send(encryptedResponse);
            } catch (encryptError) {
                console.error('❌ Error encriptando respuesta:', encryptError);
                return res.status(500).send('Encryption failed');
            }
        } else {
            // Flow completado, respuesta simple como texto plano
            console.log('✅ Flow completado exitosamente');
            return res.status(200).send('OK');
        }

    } catch (error) {
        console.error('❌ Error en endpoint de flow de citas:', error);
        
        // Manejar excepciones específicas de Flow
        if (error instanceof FlowEndpointException) {
            return res.status(error.statusCode).json({
                error: error.message
            });
        }
        
        return res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// --- INICIAR SERVIDOR ---

/**
 * Inicia el servidor Express.
 */
async function startServer() {
  // Verificación de variables de entorno esenciales
  const requiredEnvVars = ['MONGO_URI', 'GEMINI_API_KEY', 'WHATSAPP_TOKEN', 'VERIFY_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_FLOW_WELCOME_ID'];
  const optionalEnvVars = ['APP_SECRET']; // Opcional para desarrollo, requerido para producción
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.error(`❌ Error: Faltan variables de entorno esenciales: ${missingVars.join(', ')}`);
    console.error('Asegúrate de que tu archivo .env (local) o la configuración del entorno (producción) estén completos.');
    process.exit(1);
  }

  try {
    // 1. Conectar a la base de datos
    await connectDB();
    console.log('✅ Conectado a MongoDB');

    // 2. Inicializar servicio de notificaciones
    const NotificationService = require('./services/notificationService');
    NotificationService.init();

    // 3. Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor de producción escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
