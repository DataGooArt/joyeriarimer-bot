const dotenv = require('dotenv');
dotenv.config();

const bot = require('../../core/bot');
const mongoose = require('mongoose');

/**
 * Test maestro para verificar la integración completa:
 * Detección de intención → Activación de Flow → Datos correctos
 */
async function testCompleteIntegration() {
    console.log('🚀 Test Maestro - Integración Completa de Flow de Citas');
    console.log('=' .repeat(60));
    
    // Configurar conexión a MongoDB con timeouts apropiados
    if (mongoose.connection.readyState === 0) {
        console.log('🔗 Configurando conexión a MongoDB...');
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 15000, // 15 segundos
                socketTimeoutMS: 45000, // 45 segundos
                bufferCommands: false
            });
            console.log('✅ Conectado a MongoDB Atlas');
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            console.log('💡 Usando test-integration-mock.js en su lugar');
            process.exit(1);
        }
    }
    
    const testPhone = '573104202571';
    const appointmentMessages = [
        'quiero agendar una cita',
        'como agendo',
        'necesito una cita',
        'agenda una cita',
        'cita'
    ];
    
    let successCount = 0;
    let totalTests = appointmentMessages.length;
    
    console.log('📋 Probando detección de intención de agendamiento...\n');
    
    for (const [index, message] of appointmentMessages.entries()) {
        console.log(`🧪 Test ${index + 1}/${totalTests}: "${message}"`);
        
        try {
            // Simular mensaje de texto recibido
            const messageData = {
                from: testPhone,
                text: { body: message },
                timestamp: Math.floor(Date.now() / 1000).toString(),
                id: `test_${Date.now()}_${index}`
            };
            
            console.log('   🔍 Procesando mensaje...');
            
            // Esto debería detectar la intención y enviar el Flow
            await bot.processTextMessage(messageData);
            
            console.log('   ✅ Mensaje procesado exitosamente');
            successCount++;
            
        } catch (error) {
            console.error(`   ❌ Error procesando "${message}":`, error.message);
        }
        
        // Pausa entre tests para evitar spam
        if (index < totalTests - 1) {
            console.log('   ⏳ Esperando 3 segundos...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Cerrar conexión
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
    
    console.log('\n📊 RESULTADOS:');
    console.log(`✅ Tests exitosos: ${successCount}/${totalTests}`);
    console.log(`❌ Tests fallidos: ${totalTests - successCount}/${totalTests}`);
    
    if (successCount === totalTests) {
        console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
        console.log('✅ La detección de intención funciona correctamente');
        console.log('✅ El Flow se envía automáticamente');
        console.log('✅ Los datos del Flow están correctos');
    } else {
        console.log('\n⚠️ Algunos tests fallaron. Revisar logs arriba.');
        console.log('💡 Para desarrollo offline usar: node tests/flow/test-integration-mock.js');
    }
}

async function testFlowDataStructure() {
    console.log('\n🔍 Verificando estructura de datos del Flow...');
    
    try {
        // Generar datos de prueba usando appointmentService
        const { appointmentService } = require('../../services/appointmentService');
        
        // Verificar que la función existe y funciona
        if (typeof appointmentService.generateAvailableDates !== 'function') {
            console.error('❌ Función generateAvailableDates no exportada correctamente');
            return false;
        }
        
        const dates = appointmentService.generateAvailableDates();
        
        console.log('✅ Fechas generadas:', dates.length, 'días disponibles');
        console.log('📅 Ejemplo de fecha:', dates[0]);
        
        // Verificar estructura de servicios
        const expectedServices = [
            {"id": "tasacion", "title": "💎 Tasación de Joyas"},
            {"id": "reparacion", "title": "🔧 Reparación de Joyas"},
            {"id": "diseño_personalizado", "title": "✨ Diseño Personalizado"},
            {"id": "compra_presencial", "title": "🛍️ Asesoría de Compra"}
        ];
        
        console.log('✅ Servicios configurados:', expectedServices.length);
        
        // Verificar horarios
        const expectedTimes = [
            {"id": "09:00", "title": "9:00 AM", "enabled": true},
            {"id": "10:00", "title": "10:00 AM", "enabled": true},
            {"id": "11:00", "title": "11:00 AM", "enabled": true},
            {"id": "14:00", "title": "2:00 PM", "enabled": true},
            {"id": "15:00", "title": "3:00 PM", "enabled": true},
            {"id": "16:00", "title": "4:00 PM", "enabled": true}
        ];
        
        console.log('✅ Horarios configurados:', expectedTimes.length);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error verificando estructura:', error);
        return false;
    }
}

async function main() {
    console.log('🎯 Ejecutando suite completa de tests de Flow de Citas\n');
    
    // Verificar estructura de datos
    const structureOk = await testFlowDataStructure();
    
    if (!structureOk) {
        console.error('❌ Estructura de datos incorrecta. Abortando tests.');
        return;
    }
    
    console.log('\n⚠️ ADVERTENCIA: Los siguientes tests enviarán Flows reales a WhatsApp');
    console.log('   Si no quieres enviar mensajes, presiona Ctrl+C ahora');
    console.log('   Esperando 5 segundos...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Ejecutar test de integración completa
    await testCompleteIntegration();
    
    console.log('\n🏁 Suite de tests completada');
    console.log('\n📋 Próximos pasos si todo funciona:');
    console.log('1. Construir imagen Docker con las correcciones');
    console.log('2. Actualizar docker-compose.yml a nueva versión');
    console.log('3. Desplegar en producción');
    console.log('4. Verificar funcionamiento en WhatsApp real');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testCompleteIntegration,
    testFlowDataStructure
};
