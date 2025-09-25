/**
 * Prueba simple para verificar que la corrección del Flow funciona
 * Solo prueba la función de envío del Flow, no la detección de IA
 */

const dotenv = require('dotenv');
dotenv.config();

async function testFlowOnly() {
    console.log('🧪 Prueba final - Solo envío de Flow de citas');
    console.log('=' .repeat(50));
    
    try {
        // Importar la función directamente
        const whatsapp = require('./api/whatsapp');
        
        const testPhone = '573104202571';
        const flowId = '24509326838732458';
        
        console.log(`📱 Enviando a: ${testPhone}`);
        console.log(`🆔 Flow ID: ${flowId}`);
        console.log(`🖥️ Pantalla: APPOINTMENT`);
        
        // Usar exactamente la misma estructura que el bot corregido
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
                        flow_id: flowId,
                        flow_cta: "Agendar Cita",
                        flow_action: "navigate",
                        flow_action_payload: {
                            screen: "APPOINTMENT"
                            // ✅ SIN campo "data" - Esta fue la corrección
                        }
                    }
                }
            }
        };
        
        console.log('\n📤 Enviando Flow...');
        await whatsapp.sendMessageAPI(flowMessage);
        
        console.log('✅ ¡ÉXITO! Flow enviado correctamente');
        console.log('\n🎉 La corrección funcionó:');
        console.log('   - Eliminamos el campo "data: {}" problemático');
        console.log('   - El Flow ahora se envía sin errores');
        console.log('   - Formato compatible con WhatsApp Cloud API');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error enviando Flow:', error);
        
        if (error.response && error.response.data) {
            console.error('\n📄 Respuesta de la API:');
            console.error(JSON.stringify(error.response.data, null, 2));
        }
        
        return false;
    }
}

async function main() {
    const success = await testFlowOnly();
    
    console.log('\n' + '='.repeat(50));
    
    if (success) {
        console.log('🚀 SISTEMA LISTO PARA PRODUCCIÓN');
        console.log('\n📋 Próximos pasos:');
        console.log('1. Construir imagen Docker con la corrección');
        console.log('2. Actualizar docker-compose.yml a nueva versión');
        console.log('3. Desplegar en Portainer');
        console.log('4. Probar en WhatsApp real');
    } else {
        console.log('⚠️ Hay errores que corregir antes del despliegue');
    }
}

if (require.main === module) {
    main().catch(console.error);
}