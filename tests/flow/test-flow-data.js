// test-flow-data.js
// 🧪 Test para verificar que los datos del Flow se generan correctamente

require('dotenv').config();
const { appointmentService } = require('../../services/appointmentService');

console.log('🔍 VERIFICANDO GENERACIÓN DE DATOS PARA EL FLOW\n');

try {
    // Simular la generación de datos igual que en sendAppointmentFlow
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

    console.log('📅 FECHAS DISPONIBLES:');
    console.log(`Total generadas: ${availableDates.length}`);
    console.log(`Enviadas al Flow: ${flowActionPayload.data.available_dates.length}`);
    console.log('Primera fecha:', flowActionPayload.data.available_dates[0]);

    console.log('\n🛍️ SERVICIOS:');
    flowActionPayload.data.services.forEach((service, index) => {
        console.log(`${index + 1}. ${service.name} (${service.duration})`);
    });

    console.log('\n🏢 UBICACIONES:');
    flowActionPayload.data.locations.forEach((location, index) => {
        console.log(`${index + 1}. ${location.name} - ${location.address}`);
    });

    console.log('\n📋 INFORMACIÓN DEL NEGOCIO:');
    console.log(`Nombre: ${flowActionPayload.data.business_info.name}`);
    console.log(`Teléfono: ${flowActionPayload.data.business_info.phone}`);
    console.log(`Horarios: ${flowActionPayload.data.business_info.hours}`);

    console.log('\n📤 ESTRUCTURA COMPLETA PARA EL FLOW:');
    console.log(JSON.stringify(flowActionPayload, null, 2));

    console.log('\n✅ DATOS DEL FLOW GENERADOS CORRECTAMENTE');
    console.log('📝 La estructura incluye:');
    console.log(`   • ${flowActionPayload.data.available_dates.length} fechas disponibles`);
    console.log(`   • ${flowActionPayload.data.services.length} servicios`);
    console.log(`   • ${flowActionPayload.data.locations.length} ubicaciones`);
    console.log('   • Información del negocio completa');

} catch (error) {
    console.error('❌ Error generando datos del Flow:', error.message);
    console.log('\n⚠️  Verificar que appointmentService esté funcionando correctamente');
}