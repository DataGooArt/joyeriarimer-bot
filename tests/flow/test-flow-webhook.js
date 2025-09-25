// test-flow-webhook.js
// 🧪 Test para verificar el manejo de respuestas del Flow

require('dotenv').config();
const { handleFlowDataExchange } = require('../../core/webhookHandler');

console.log('🔍 PROBANDO MANEJO DE RESPUESTAS DEL FLOW\n');

// Simular datos que llegarían del Flow de agendamiento
const testScenarios = [
    {
        name: 'Selección de servicio',
        decryptedBody: {
            screen: 'select_service',
            data: {
                service: 'reparacion',
                service_name: 'Reparación de joyas'
            },
            action: 'data_exchange'
        }
    },
    {
        name: 'Selección de fecha',
        decryptedBody: {
            screen: 'select_date',
            data: {
                date: '2025-09-26',
                time: '10:00',
                display_date: 'jueves, 26 de septiembre de 2025',
                display_time: '10:00 AM'
            },
            action: 'data_exchange'
        }
    },
    {
        name: 'Finalización exitosa',
        decryptedBody: {
            screen: 'SUCCESS',
            data: {
                service: 'reparacion',
                date: '2025-09-26',
                time: '10:00',
                customer_name: 'Cliente Test',
                customer_phone: '1234567890'
            },
            action: 'data_exchange'
        }
    },
    {
        name: 'Pantalla desconocida',
        decryptedBody: {
            screen: 'unknown_screen',
            data: {},
            action: 'data_exchange'
        }
    }
];

async function testFlowWebhook() {
    let successCount = 0;
    
    for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        console.log(`🧪 Test ${i + 1}/${testScenarios.length}: ${scenario.name}`);
        
        try {
            const response = await handleFlowDataExchange(scenario.decryptedBody);
            
            if (response && response.data) {
                console.log(`   ✅ Respuesta válida:`, JSON.stringify(response.data, null, 2));
                successCount++;
            } else {
                console.log(`   ❌ Respuesta inválida:`, response);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Línea en blanco para separación
    }
    
    console.log('📊 RESULTADOS:');
    console.log(`✅ Tests exitosos: ${successCount}/${testScenarios.length}`);
    console.log(`❌ Tests fallidos: ${testScenarios.length - successCount}/${testScenarios.length}`);
    console.log(`📈 Tasa de éxito: ${Math.round((successCount / testScenarios.length) * 100)}%`);
    
    if (successCount === testScenarios.length) {
        console.log('\n🎉 PERFECTO! Todas las respuestas del Flow se manejan correctamente');
        console.log('✅ Webhook listo para recibir respuestas reales del Flow');
    } else {
        console.log('\n⚠️  Algunos casos necesitan revisión');
    }
}

testFlowWebhook().catch(console.error);