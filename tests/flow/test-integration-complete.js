// test-integration-complete.js
// 🧪 Test completo de integración end-to-end del sistema de agendamiento

require('dotenv').config();
const mongoose = require('mongoose');
const { aiService } = require('../../services/aiService');
const { appointmentService } = require('../../services/appointmentService');
const Customer = require('../../models/Customer');

console.log('🚀 TEST COMPLETO DE INTEGRACIÓN - SISTEMA DE AGENDAMIENTO');
console.log('=' .repeat(65));

async function runCompleteIntegrationTest() {
    let testResults = {
        database: false,
        aiService: false,
        appointmentService: false,
        intentDetection: false,
        flowData: false,
        webhookConfig: false
    };

    try {
        // 1. Test de conexión a base de datos
        console.log('\n🔗 1. PROBANDO CONEXIÓN A BASE DE DATOS...');
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 30000,
                bufferCommands: false
            });
        }
        console.log('   ✅ Conectado a MongoDB Atlas');
        testResults.database = true;

        // 2. Test de AI Service
        console.log('\n🤖 2. PROBANDO AI SERVICE...');
        const testIntent = await aiService.detectIntent('quiero agendar una cita');
        if (testIntent === 'schedule_appointment') {
            console.log('   ✅ Detección de intención funcional');
            testResults.aiService = true;
        } else {
            console.log(`   ❌ Intención incorrecta: ${testIntent}`);
        }

        // 3. Test de Appointment Service
        console.log('\n📅 3. PROBANDO APPOINTMENT SERVICE...');
        const dates = appointmentService.generateAvailableDates(7);
        if (dates && dates.length > 0) {
            console.log(`   ✅ Fechas generadas: ${dates.length} días disponibles`);
            testResults.appointmentService = true;
        } else {
            console.log('   ❌ No se generaron fechas');
        }

        // 4. Test de detección de múltiples intenciones
        console.log('\n🎯 4. PROBANDO DETECCIÓN DE INTENCIONES MÚLTIPLES...');
        const testPhrases = [
            'quiero agendar una cita',
            'necesito una cita',
            'agendar cita'
        ];
        
        let correctDetections = 0;
        for (const phrase of testPhrases) {
            const intent = await aiService.detectIntent(phrase);
            if (intent === 'schedule_appointment') {
                correctDetections++;
            }
            await new Promise(resolve => setTimeout(resolve, 200)); // Pausa breve
        }
        
        if (correctDetections === testPhrases.length) {
            console.log(`   ✅ ${correctDetections}/${testPhrases.length} frases detectadas correctamente`);
            testResults.intentDetection = true;
        } else {
            console.log(`   ⚠️  ${correctDetections}/${testPhrases.length} frases detectadas correctamente`);
        }

        // 5. Test de estructura de datos del Flow
        console.log('\n📋 5. PROBANDO ESTRUCTURA DE DATOS DEL FLOW...');
        const flowData = {
            dates: dates.slice(0, 3), // Primeras 3 fechas
            services: [
                { id: 'consultation', name: 'Consulta general' },
                { id: 'repair', name: 'Reparación' },
                { id: 'custom', name: 'Diseño personalizado' }
            ]
        };
        
        if (flowData.dates.length > 0 && flowData.services.length > 0) {
            console.log('   ✅ Estructura de datos del Flow válida');
            console.log(`   📅 Fechas disponibles: ${flowData.dates.length}`);
            console.log(`   🛍️  Servicios disponibles: ${flowData.services.length}`);
            testResults.flowData = true;
        } else {
            console.log('   ❌ Estructura de datos del Flow inválida');
        }

        // 6. Test de configuración del webhook
        console.log('\n🔗 6. PROBANDO CONFIGURACIÓN DEL WEBHOOK...');
        const requiredVars = {
            WHATSAPP_FLOW_APPOINTMENT_ID: process.env.WHATSAPP_FLOW_APPOINTMENT_ID,
            WHATSAPP_FLOW_PRIVATE_KEY: process.env.WHATSAPP_FLOW_PRIVATE_KEY,
            WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
            WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID
        };

        let configOk = true;
        for (const [key, value] of Object.entries(requiredVars)) {
            if (!value) {
                console.log(`   ❌ Variable no configurada: ${key}`);
                configOk = false;
            }
        }

        if (configOk) {
            console.log('   ✅ Todas las variables del webhook configuradas');
            testResults.webhookConfig = true;
        }

        // 7. Test de creación de cliente (simulado)
        console.log('\n👤 7. PROBANDO CREACIÓN DE CLIENTE...');
        const testCustomer = new Customer({
            phone: '1234567890',
            name: 'Cliente Test',
            consent: true,
            leadScore: 75,
            priority: 'high'
        });

        // Validar sin guardar
        const validationError = testCustomer.validateSync();
        if (!validationError) {
            console.log('   ✅ Modelo de cliente válido');
        } else {
            console.log('   ❌ Error en modelo de cliente:', validationError.message);
        }

    } catch (error) {
        console.error('❌ Error en test de integración:', error.message);
    } finally {
        // Cerrar conexión si la abrimos
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('\n🔌 Desconectado de MongoDB');
        }
    }

    // Mostrar resultados finales
    console.log('\n📊 RESULTADOS FINALES:');
    console.log('=' .repeat(50));
    
    const results = Object.entries(testResults);
    const successCount = results.filter(([, success]) => success).length;
    
    results.forEach(([test, success]) => {
        const status = success ? '✅' : '❌';
        const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
        console.log(`${status} ${testName}`);
    });

    console.log(`\n📈 Tasa de éxito: ${successCount}/${results.length} (${Math.round((successCount / results.length) * 100)}%)`);

    if (successCount === results.length) {
        console.log('\n🎉 ¡INTEGRACIÓN COMPLETA EXITOSA!');
        console.log('✅ El sistema está listo para producción');
        console.log('\n🚀 Próximos pasos:');
        console.log('   1. Construir imagen Docker: docker build -t joyeria-bot:v2.3.1 .');
        console.log('   2. Desplegar en producción');
        console.log('   3. Probar con WhatsApp real');
    } else {
        console.log('\n⚠️  Algunos componentes necesitan revisión');
        console.log('📝 Corrige los elementos marcados con ❌ antes de desplegar');
    }
}

runCompleteIntegrationTest().catch(console.error);