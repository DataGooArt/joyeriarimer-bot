// test-flow-config.js
// 🧪 Test para verificar configuración del Flow de citas

require('dotenv').config();

console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL FLOW DE CITAS\n');

// Variables críticas para el Flow
const requiredVars = {
    'WHATSAPP_TOKEN': process.env.WHATSAPP_TOKEN,
    'WHATSAPP_PHONE_NUMBER_ID': process.env.WHATSAPP_PHONE_NUMBER_ID,
    'WHATSAPP_FLOW_APPOINTMENT_ID': process.env.WHATSAPP_FLOW_APPOINTMENT_ID,
    'WHATSAPP_FLOW_PRIVATE_KEY': process.env.WHATSAPP_FLOW_PRIVATE_KEY,
    'WEBHOOK_VERIFY_TOKEN': process.env.WEBHOOK_VERIFY_TOKEN || process.env.VERIFY_TOKEN,
    'MONGO_URI': process.env.MONGO_URI || process.env.MONGODB_URI,
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY
};

let allConfigured = true;

console.log('📋 VARIABLES DE ENTORNO:');
for (const [key, value] of Object.entries(requiredVars)) {
    const status = value ? '✅' : '❌';
    const displayValue = value ? 
        (key.includes('KEY') || key.includes('TOKEN') ? 
            `${value.substring(0, 20)}...` : 
            value) : 
        'NO CONFIGURADA';
    
    console.log(`   ${status} ${key}: ${displayValue}`);
    
    if (!value) allConfigured = false;
}

console.log('\n🎯 FLOW ESPECÍFICO:');
console.log(`   Flow ID: ${process.env.WHATSAPP_FLOW_APPOINTMENT_ID || 'NO CONFIGURADO'}`);
console.log(`   Teléfono ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID || 'NO CONFIGURADO'}`);

// Test básico de funciones críticas
console.log('\n🧪 TESTING FUNCIONES CRÍTICAS:');

try {
    // Test 1: Importar módulos principales
    console.log('   📦 Importando módulos...');
    const { aiService } = require('../../services/aiService');
    const { appointmentService } = require('../../services/appointmentService');
    console.log('   ✅ Módulos importados correctamente');

    // Test 2: Generar fechas disponibles
    console.log('   📅 Generando fechas disponibles...');
    const availableDates = appointmentService.generateAvailableDates(7);
    console.log(`   ✅ ${availableDates.length} fechas generadas`);

    // Test 3: Detectar intención
    console.log('   🤖 Probando detección de intención...');
    aiService.detectIntent('quiero agendar una cita').then(intent => {
        console.log(`   ✅ Intención detectada: ${intent}`);
        
        // Resumen final
        console.log('\n🎉 RESULTADO FINAL:');
        if (allConfigured && intent === 'appointment') {
            console.log('   ✅ CONFIGURACIÓN COMPLETA - FLOW LISTO PARA USAR');
            console.log('\n📞 Para probar:');
            console.log('   1. Envía "agendar cita" al bot de WhatsApp');
            console.log('   2. O ejecuta: node local-chat.js');
            console.log('   3. Dashboard web: http://localhost:3001');
        } else {
            console.log('   ⚠️  CONFIGURACIÓN INCOMPLETA');
            console.log('   📝 Corrige las variables marcadas con ❌');
        }
    }).catch(error => {
        console.log(`   ❌ Error en detección: ${error.message}`);
    });

} catch (error) {
    console.error('   ❌ Error en test:', error.message);
    allConfigured = false;
}