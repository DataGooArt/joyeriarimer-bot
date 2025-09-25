// test-flow-api-payload.js
// 🧪 Test para verificar el payload exacto que se envía a la API de WhatsApp

require('dotenv').config();
const { appointmentService } = require('../../services/appointmentService');

console.log('🔍 SIMULANDO PAYLOAD EXACTO ENVIADO A WHATSAPP API\n');

try {
    const flowId = process.env.WHATSAPP_FLOW_APPOINTMENT_ID || '1123954915939585';
    const to = '573104202571'; // Número de prueba
    
    // Generar datos igual que en sendAppointmentFlow
    const availableDates = appointmentService.generateAvailableDates(30);
    const services = [
        { id: 'consulta', name: 'Consulta General', duration: '30 min' },
        { id: 'diseno', name: 'Diseño Personalizado', duration: '60 min' },
        { id: 'reparacion', name: 'Reparación', duration: '45 min' },
        { id: 'valoracion', name: 'Valoración de Joyas', duration: '30 min' }
    ];

    const flowActionPayload = {
        data: {
            available_dates: availableDates.slice(0, 15), // Limitar para el Flow
            services: services,
            business_info: {
                name: 'Joyería Rimer',
                phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
                hours: 'Lun-Sáb 9:00-18:00'
            },
            locations: [
                { id: 'cartagena', name: 'Cartagena', address: 'Centro Histórico' },
                { id: 'santa_marta', name: 'Santa Marta', address: 'Rodadero' }
            ]
        }
    };

    // Simular estructura exacta que se envía a WhatsApp API
    const whatsappPayload = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
            type: 'flow',
            header: {
                type: 'text',
                text: '📅 Agendar tu Cita'
            },
            body: {
                text: '¡Perfecto! Te ayudo a agendar tu cita. Completa la información:'
            },
            footer: {
                text: 'Toca el botón para continuar'
            },
            action: {
                name: 'flow',
                parameters: {
                    flow_message_version: '3',
                    flow_id: flowId,
                    flow_cta: 'Agendar Cita',
                    flow_action: 'navigate',
                    flow_action_payload: {
                        screen: 'APPOINTMENT',
                        ...flowActionPayload
                    }
                }
            }
        }
    };

    console.log('📋 INFORMACIÓN DEL FLOW:');
    console.log(`Flow ID: ${flowId}`);
    console.log(`Pantalla inicial: APPOINTMENT`);
    console.log(`Destinatario: ${to}`);

    console.log('\n📤 PAYLOAD COMPLETO ENVIADO A WHATSAPP:');
    console.log(JSON.stringify(whatsappPayload, null, 2));

    console.log('\n🔍 ANÁLISIS DEL FLOW_ACTION_PAYLOAD:');
    const payload = whatsappPayload.interactive.action.parameters.flow_action_payload;
    console.log(`Pantalla: ${payload.screen}`);
    console.log(`Fechas incluidas: ${payload.data.available_dates.length}`);
    console.log(`Servicios incluidos: ${payload.data.services.length}`);
    console.log(`Ubicaciones incluidas: ${payload.data.locations.length}`);

    console.log('\n⚠️  POSIBLES PROBLEMAS:');
    console.log('1. El Flow en WhatsApp Business puede estar configurado para otra pantalla inicial');
    console.log('2. Los nombres de campos pueden no coincidir con la configuración del Flow');
    console.log('3. El Flow puede requerir datos en formato diferente');
    
    console.log('\n🔧 RECOMENDACIONES:');
    console.log('1. Verificar en WhatsApp Business Manager que la pantalla inicial sea "APPOINTMENT"');
    console.log('2. Confirmar los nombres exactos de los campos en el Flow');
    console.log('3. Probar con datos más simples primero');

} catch (error) {
    console.error('❌ Error simulando payload:', error.message);
}