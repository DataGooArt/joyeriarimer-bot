const dotenv = require('dotenv');
dotenv.config();

const whatsapp = require('./api/whatsapp');

/**
 * Script para probar el envío del Flow de citas
 * Simula la función sendAppointmentFlow del bot
 */
async function testAppointmentFlow() {
    console.log('🧪 Probando envío de Flow de citas...');
    
    // Número de prueba (reemplaza con tu número)
    const testPhone = process.env.TEST_PHONE || '573104202571';
    
    try {
        // Construir el mensaje del Flow tal como lo hace el bot
        const flowMessage = {
            messaging_product: "whatsapp",
            to: testPhone,
            type: "interactive",
            interactive: {
                type: "flow",
                header: {
                    type: "text",
                    text: "Agenda tu Cita ✨"
                },
                body: {
                    text: "Te voy a ayudar a agendar tu cita de manera rápida y sencilla. Solo necesito algunos datos:"
                },
                footer: {
                    text: "Joyería Rimer - Cartagena y Santa Marta"
                },
                action: {
                    name: "flow",
                    parameters: {
                        flow_message_version: "3",
                        flow_token: `appointment_${Date.now()}_${testPhone.replace('+', '')}`,
                        flow_id: "24509326838732458",
                        flow_cta: "Agendar Cita",
                        flow_action: "navigate",
                        flow_action_payload: {
                            screen: "APPOINTMENT"
                        }
                    }
                }
            }
        };

        console.log('📤 Enviando Flow con payload:', JSON.stringify(flowMessage, null, 2));
        
        await whatsapp.sendMessageAPI(flowMessage);
        console.log('✅ Flow de citas enviado exitosamente');
        
    } catch (error) {
        console.error('❌ Error enviando Flow de citas:', error);
        
        if (error.response && error.response.data) {
            console.error('📄 Respuesta de la API:', JSON.stringify(error.response.data, null, 2));
        }
        
        // Mostrar sugerencias de solución
        console.log('\n🔍 Posibles causas del error:');
        console.log('1. Flow ID incorrecto o no publicado en Meta');
        console.log('2. Pantalla "APPOINTMENT" no existe en el Flow');
        console.log('3. Token de acceso de WhatsApp expirado');
        console.log('4. Número de teléfono no válido');
        console.log('5. Flow no está aprobado por Meta');
    }
}

// Función para probar un Flow simple como referencia
async function testSimpleFlow() {
    console.log('\n🧪 Probando Flow simple como referencia...');
    
    const testPhone = process.env.TEST_PHONE || '573104202571';
    
    try {
        await whatsapp.sendInteractiveFlowButton(
            testPhone,
            "Esto es una prueba de Flow simple",
            "Ver Flow",
            "24509326838732458"
        );
        
        console.log('✅ Flow simple enviado exitosamente');
        
    } catch (error) {
        console.error('❌ Error enviando Flow simple:', error);
        
        if (error.response && error.response.data) {
            console.error('📄 Respuesta de la API:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando pruebas de Flow de citas');
    console.log('=====================================');
    
    // Verificar variables de entorno
    if (!process.env.WHATSAPP_TOKEN) {
        console.error('❌ WHATSAPP_TOKEN no configurado');
        process.exit(1);
    }
    
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
        console.error('❌ WHATSAPP_PHONE_NUMBER_ID no configurado');
        process.exit(1);
    }
    
    console.log('✅ Variables de entorno configuradas');
    console.log(`📱 Número de prueba: ${process.env.TEST_PHONE || '573104202571'}`);
    console.log(`🆔 Flow ID: 24509326838732458`);
    console.log(`🖥️ Pantalla inicial: APPOINTMENT`);
    
    // Ejecutar pruebas
    await testAppointmentFlow();
    
    console.log('\n' + '='.repeat(50));
    await testSimpleFlow();
    
    console.log('\n🏁 Pruebas completadas');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testAppointmentFlow, testSimpleFlow };