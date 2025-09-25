const dotenv = require('dotenv');
dotenv.config();

/**
 * Script para probar que nuestro endpoint /webhook/appointment-flow funcione
 * Este simula las peticiones que Meta envía cuando se seleccionan opciones en el Flow
 */
async function testEndpoint() {
    console.log('🧪 Probando endpoint /webhook/appointment-flow...');
    
    // Verificar que las dependencias estén disponibles
    try {
        const { decryptRequest, encryptResponse } = require('./core/encryption');
        const FlowService = require('./services/flowService');
        const AppointmentService = require('./services/appointmentService');
        
        console.log('✅ Dependencias cargadas correctamente');
    } catch (error) {
        console.error('❌ Error cargando dependencias:', error);
        return;
    }
    
    // Simular data_exchange event (cuando se selecciona un servicio)
    console.log('\n📋 Simulando selección de servicio...');
    try {
        const mockDataExchange = {
            action: 'data_exchange',
            screen: 'APPOINTMENT',
            data: {
                trigger: 'department_selected',
                department: 'tasacion'
            }
        };
        
        const AppointmentService = require('./services/appointmentService');
        const result = await AppointmentService.handleAppointmentFlow(mockDataExchange);
        
        console.log('✅ Respuesta del endpoint:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error en endpoint:', error);
    }
    
    // Probar ping event
    console.log('\n🏓 Simulando ping de Meta...');
    try {
        const mockPing = {
            action: 'ping'
        };
        
        const FlowService = require('./services/flowService');
        const result = await FlowService.processAppointmentFlowResponse(mockPing);
        
        console.log('✅ Respuesta al ping:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error en ping:', error);
    }
}

async function main() {
    console.log('🚀 Diagnóstico del endpoint de Flow');
    console.log('=' .repeat(50));
    
    await testEndpoint();
    
    console.log('\n💡 Si ves errores arriba, ese es el problema');
    console.log('💡 Si todo funciona, el problema puede ser de encriptación');
}

if (require.main === module) {
    main().catch(console.error);
}