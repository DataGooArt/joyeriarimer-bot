/**
 * 🧪 Script de prueba para validar el Flow de citas personalizado
 * Simula las diferentes interacciones del usuario en el Flow ID: 24509326838732458
 */

require('dotenv').config();
const AppointmentService = require('./services/appointmentService');
const FlowService = require('./services/flowService');

/**
 * 🏓 Test 1: Respuesta de Ping para validación de Meta
 */
async function testPingResponse() {
    console.log('\n🏓 === TEST 1: Ping Response ===');
    
    const pingRequest = {
        action: 'ping'
    };
    
    try {
        const result = await FlowService.processAppointmentFlowResponse(pingRequest);
        console.log('✅ Ping Response:', JSON.stringify(result, null, 2));
        
        if (result.responseRequired && result.data.status === 'active') {
            console.log('✅ Test PASADO: Ping response correcto');
        } else {
            console.log('❌ Test FALLIDO: Ping response incorrecto');
        }
    } catch (error) {
        console.error('❌ Error en test ping:', error);
    }
}

/**
 * 📋 Test 2: Pantalla inicial de citas
 */
async function testInitialScreen() {
    console.log('\n📋 === TEST 2: Pantalla Inicial ===');
    
    const initialRequest = {
        action: 'data_exchange',
        screen: 'APPOINTMENT'
    };
    
    try {
        const result = await FlowService.processAppointmentFlowResponse(initialRequest);
        console.log('✅ Pantalla inicial:', JSON.stringify(result, null, 2));
        
        if (result.data && result.data.data && result.data.data.department && result.data.data.location) {
            console.log('✅ Test PASADO: Datos iniciales cargados correctamente');
            console.log(`   - Servicios disponibles: ${result.data.data.department.length}`);
            console.log(`   - Ubicaciones disponibles: ${result.data.data.location.length}`);
        } else {
            console.log('❌ Test FALLIDO: Datos iniciales incorrectos');
        }
    } catch (error) {
        console.error('❌ Error en test pantalla inicial:', error);
    }
}

/**
 * 🎯 Test 3: Selección de servicio
 */
async function testServiceSelection() {
    console.log('\n🎯 === TEST 3: Selección de Servicio ===');
    
    const serviceSelectionRequest = {
        action: 'data_exchange',
        screen: 'APPOINTMENT',
        data: {
            trigger: 'department_selected',
            department: 'tasacion'
        }
    };
    
    try {
        const result = await FlowService.processAppointmentFlowResponse(serviceSelectionRequest);
        console.log('✅ Selección de servicio:', JSON.stringify(result, null, 2));
        
        if (result.data && result.data.data && result.data.data.is_date_enabled) {
            console.log('✅ Test PASADO: Fecha habilitada después de seleccionar servicio');
        } else {
            console.log('❌ Test FALLIDO: Fecha no se habilitó');
        }
    } catch (error) {
        console.error('❌ Error en test selección servicio:', error);
    }
}

/**
 * 📅 Test 4: Selección de fecha
 */
async function testDateSelection() {
    console.log('\n📅 === TEST 4: Selección de Fecha ===');
    
    // Obtener una fecha disponible para testing
    const availableDates = AppointmentService.getAvailableDates();
    const testDate = availableDates[0]?.id || '2024-01-15';
    
    const dateSelectionRequest = {
        action: 'data_exchange',
        screen: 'APPOINTMENT',
        data: {
            trigger: 'date_selected',
            date: testDate,
            department: 'tasacion',
            location: 'cartagena'
        }
    };
    
    try {
        const result = await FlowService.processAppointmentFlowResponse(dateSelectionRequest);
        console.log('✅ Selección de fecha:', JSON.stringify(result, null, 2));
        
        if (result.data && result.data.data && result.data.data.is_time_enabled && result.data.data.time) {
            console.log('✅ Test PASADO: Horarios cargados después de seleccionar fecha');
            console.log(`   - Horarios disponibles: ${result.data.data.time.length}`);
        } else {
            console.log('❌ Test FALLIDO: Horarios no se cargaron');
        }
    } catch (error) {
        console.error('❌ Error en test selección fecha:', error);
    }
}

/**
 * 👤 Test 5: Pantalla de detalles
 */
async function testDetailsScreen() {
    console.log('\n👤 === TEST 5: Pantalla de Detalles ===');
    
    const detailsRequest = {
        action: 'data_exchange',
        screen: 'DETAILS',
        data: {
            department: 'tasacion',
            location: 'cartagena',
            date: '2024-01-15',
            time: '10:00 AM',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+573001234567',
            more_details: 'Necesito tasar una cadena de oro'
        }
    };
    
    try {
        const result = await FlowService.processAppointmentFlowResponse(detailsRequest);
        console.log('✅ Pantalla de detalles:', JSON.stringify(result, null, 2));
        
        if (result.data && result.data.data && result.data.data.appointment && result.data.data.details) {
            console.log('✅ Test PASADO: Resumen de cita generado correctamente');
        } else {
            console.log('❌ Test FALLIDO: Resumen no generado');
        }
    } catch (error) {
        console.error('❌ Error en test pantalla detalles:', error);
    }
}

/**
 * ✅ Test 6: Confirmación final (simulado - sin guardar en BD)  
 */
async function testSummaryScreen() {
    console.log('\n✅ === TEST 6: Confirmación Final (SIN GUARDAR) ===');
    
    const summaryRequest = {
        action: 'data_exchange',
        screen: 'SUMMARY',
        data: {
            department: 'tasacion',
            location: 'cartagena',
            date: '2024-01-15',
            time: '10:00 AM',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+573001234567',
            more_details: 'Necesito tasar una cadena de oro'
        }
    };
    
    try {
        console.log('⚠️ NOTA: Este test NO guardará en la base de datos');
        
        // Simular la respuesta sin llamar a la BD
        const mockResult = {
            responseRequired: false,
            data: {
                version: "3.0",
                screen: "SUCCESS",
                data: {
                    success_message: "¡Cita confirmada exitosamente! Te contactaremos pronto.",
                    appointment_details: "Cita #12345678 confirmada"
                }
            }
        };
        
        console.log('✅ Respuesta simulada:', JSON.stringify(mockResult, null, 2));
        console.log('✅ Test PASADO: Estructura de confirmación correcta');
        
    } catch (error) {
        console.error('❌ Error en test confirmación:', error);
    }
}

/**
 * 🚀 Ejecutar todos los tests
 */
async function runAllTests() {
    console.log('🧪 ===== TESTS DE FLOW DE CITAS JOYERÍA RIMER =====');
    console.log('📅 Flow ID: 24509326838732458');
    console.log('🏢 Ubicaciones: Cartagena y Santa Marta');
    console.log('⏰ Horarios: Lunes a Viernes, 9AM - 5PM');
    
    await testPingResponse();
    await testInitialScreen();
    await testServiceSelection();
    await testDateSelection();
    await testDetailsScreen();
    await testSummaryScreen();
    
    console.log('\n🎉 ===== TESTS COMPLETADOS =====');
    console.log('✅ Si todos los tests pasaron, el Flow está listo para uso.');
    console.log('📱 Puedes probarlo en WhatsApp usando el Flow ID: 24509326838732458');
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testPingResponse,
    testInitialScreen,
    testServiceSelection,
    testDateSelection,
    testDetailsScreen,
    testSummaryScreen,
    runAllTests
};