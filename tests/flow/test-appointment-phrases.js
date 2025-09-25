// test-appointment-phrases.js
// 🧪 Test para verificar detección de diferentes frases de agendamiento

require('dotenv').config();
const { aiService } = require('../../services/aiService');

console.log('🔍 PROBANDO DETECCIÓN DE FRASES DE AGENDAMIENTO\n');

const testPhrases = [
    'quiero agendar una cita',
    'necesito una cita',
    'agendar cita',
    'quiero una cita',
    'como agendo',
    'agenda una cita',
    'cita',
    'reservar cita',
    'apartar cita',
    'cuando puedo ir'
];

async function testPhrase(phrase, index) {
    try {
        console.log(`🧪 Test ${index + 1}/${testPhrases.length}: "${phrase}"`);
        const intent = await aiService.detectIntent(phrase);
        
        if (intent === 'schedule_appointment') {
            console.log(`   ✅ Detectado correctamente: ${intent}`);
            return true;
        } else {
            console.log(`   ❌ Intención incorrecta: ${intent} (esperado: schedule_appointment)`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    let successCount = 0;
    
    for (let i = 0; i < testPhrases.length; i++) {
        const success = await testPhrase(testPhrases[i], i);
        if (success) successCount++;
        
        // Pausa breve entre tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 RESULTADOS:');
    console.log(`✅ Éxitos: ${successCount}/${testPhrases.length}`);
    console.log(`❌ Fallos: ${testPhrases.length - successCount}/${testPhrases.length}`);
    console.log(`📈 Tasa de éxito: ${Math.round((successCount / testPhrases.length) * 100)}%`);
    
    if (successCount === testPhrases.length) {
        console.log('\n🎉 PERFECTO! Todas las frases se detectan correctamente');
    } else if (successCount >= testPhrases.length * 0.8) {
        console.log('\n✅ BUENO! La mayoría de frases se detectan (>80%)');
    } else {
        console.log('\n⚠️  NECESITA MEJORA! Varias frases no se detectan correctamente');
    }
}

runAllTests().catch(console.error);