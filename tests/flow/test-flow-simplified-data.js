const { sendFlowMessage } = require('../../api/whatsapp');

console.log('🧪 Iniciando test de Flow con datos simplificados...\n');

// Simulación de datos más simples para debugger
const testNumber = '+573123456789';
const flowId = '1123954915939585';

// Payload simplificado para debugging
const simplifiedData = {
    screen: 'APPOINTMENT',
    data: {
        services: [
            {
                id: 'consulta',
                name: 'Consulta General'
            },
            {
                id: 'diseno',
                name: 'Diseño Personalizado'
            }
        ],
        locations: [
            {
                id: 'cartagena',
                name: 'Cartagena'
            }
        ],
        available_dates: [
            {
                date: '2025-01-02',
                displayDate: 'Mañana, 2 de enero'
            },
            {
                date: '2025-01-03',
                displayDate: 'Pasado mañana, 3 de enero'
            }
        ]
    }
};

console.log('📦 PAYLOAD SIMPLIFICADO:');
console.log(JSON.stringify(simplifiedData, null, 2));

console.log('\n🔍 VERIFICACIÓN:');
console.log(`- Servicios: ${simplifiedData.data.services.length}`);
console.log(`- Ubicaciones: ${simplifiedData.data.locations.length}`);
console.log(`- Fechas: ${simplifiedData.data.available_dates.length}`);

console.log('\n🎯 PASOS PARA IMPLEMENTAR EN PRODUCCIÓN:');
console.log('1. Modificar sendAppointmentFlow para usar datos simplificados');
console.log('2. Verificar que el Flow muestre las opciones');
console.log('3. Incrementar gradualmente la complejidad de los datos');

console.log('\n✅ Test completado - Payload simplificado listo para testing');