// 🧪 Test completo de las 4 pantallas del Flow
// Simula el flujo completo: APPOINTMENT → DETAILS → SUMMARY → SUCCESS

require('dotenv').config();
const mongoose = require('mongoose');
const { handleFlowDataExchange } = require('../../core/webhookHandler');

async function testCompleteFlow() {
    try {
        console.log('🧪 INICIANDO TEST DEL FLOW COMPLETO...\n');
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // 1. SIMULAR PANTALLA APPOINTMENT - Selección inicial
        console.log('📱 1. SIMULANDO PANTALLA APPOINTMENT...');
        const appointmentResponse = await handleFlowDataExchange({
            screen: 'APPOINTMENT',
            action: 'data_exchange',
            data: {
                department: 'tasacion',
                location: 'cartagena',
                date: '2025-09-26',
                time: '10:00'
            }
        });
        console.log('✅ Respuesta APPOINTMENT:', JSON.stringify(appointmentResponse, null, 2));
        console.log('');

        // 2. SIMULAR PANTALLA DETAILS - Datos del cliente
        console.log('📱 2. SIMULANDO PANTALLA DETAILS...');
        const detailsResponse = await handleFlowDataExchange({
            screen: 'DETAILS',
            action: 'data_exchange',
            data: {
                department: 'tasacion',
                location: 'cartagena', 
                date: '2025-09-26',
                time: '10:00',
                name: 'María García',
                email: 'maria@example.com',
                phone: '+57 300 123 4567',
                more_details: 'Necesito tasación de un anillo de oro'
            }
        });
        console.log('✅ Respuesta DETAILS:', JSON.stringify(detailsResponse, null, 2));
        console.log('');

        // 3. SIMULAR PANTALLA SUMMARY - Confirmación
        console.log('📱 3. SIMULANDO PANTALLA SUMMARY...');
        const summaryResponse = await handleFlowDataExchange({
            screen: 'SUMMARY',
            action: 'data_exchange',
            data: {
                department: 'tasacion',
                location: 'cartagena',
                date: '2025-09-26', 
                time: '10:00',
                name: 'María García',
                email: 'maria@example.com',
                phone: '+57 300 123 4567',
                more_details: 'Necesito tasación de un anillo de oro',
                terms_accepted: true,
                privacy_accepted: true
            }
        });
        console.log('✅ Respuesta SUMMARY:', JSON.stringify(summaryResponse, null, 2));
        console.log('');

        // 4. SIMULAR PANTALLA SUCCESS - Final
        console.log('📱 4. SIMULANDO PANTALLA SUCCESS...');
        const successResponse = await handleFlowDataExchange({
            screen: 'SUCCESS',
            action: 'data_exchange',
            data: {
                success_message: '¡Tu cita ha sido confirmada exitosamente!',
                appointment_details: 'Referencia: JR12345678'
            }
        });
        console.log('✅ Respuesta SUCCESS:', JSON.stringify(successResponse, null, 2));
        console.log('');

        console.log('🎉 TEST DEL FLOW COMPLETO FINALIZADO EXITOSAMENTE!');

    } catch (error) {
        console.error('❌ Error durante el test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Desconectado de MongoDB');
    }
}

// Ejecutar el test
testCompleteFlow();