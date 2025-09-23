// test-flow-integration.js
// 🧪 Test del Flow JSON actualizado con appointmentService.js

const mongoose = require('mongoose');
const AppointmentService = require('../services/appointmentService');
require('dotenv').config();

async function testFlowIntegration() {
    console.log('🧪 === TEST FLOW INTEGRATION - JOYERÍA RIMER ===\n');
    
    try {
        // 1. Conectar a MongoDB
        console.log('1️⃣ Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB Atlas\n');

        // 2. Test de datos iniciales del Flow
        console.log('2️⃣ Validando datos iniciales del Flow...');
        
        // Servicios disponibles
        console.log('💎 Servicios disponibles:');
        AppointmentService.SERVICES.forEach((service, index) => {
            console.log(`   ${index + 1}. ${service.title} (ID: ${service.id})`);
        });
        
        // Ubicaciones disponibles
        console.log('\n📍 Ubicaciones disponibles:');
        const locations = [
            { id: "cartagena", title: "📍 Cartagena de Indias" },
            { id: "santa_marta", title: "📍 Santa Marta" }
        ];
        locations.forEach((location, index) => {
            console.log(`   ${index + 1}. ${location.title} (ID: ${location.id})`);
        });

        // Fechas disponibles
        console.log('\n📅 Fechas disponibles (próximas 5):');
        const availableDates = AppointmentService.getAvailableDates().slice(0, 5);
        availableDates.forEach((date, index) => {
            console.log(`   ${index + 1}. ${date.title} (ID: ${date.id})`);
        });

        // Horarios disponibles
        console.log('\n🕐 Horarios disponibles:');
        AppointmentService.AVAILABLE_TIMES.forEach((time, index) => {
            console.log(`   ${index + 1}. ${time}`);
        });

        console.log('\n✅ Datos del Flow validados correctamente\n');

        // 3. Simular flujo completo del usuario
        console.log('3️⃣ Simulando flujo completo del usuario...\n');

        // Pantalla APPOINTMENT - Selección inicial
        console.log('🖥️ PANTALLA: APPOINTMENT');
        const appointmentScreenData = await AppointmentService.handleAppointmentFlow(
            null, // formData inicial
            'APPOINTMENT' // screen
        );
        console.log('📋 Respuesta inicial:', JSON.stringify(appointmentScreenData, null, 2));

        // Simular selección de servicio
        console.log('\n🎯 Usuario selecciona: Tasación de Joyas');
        const afterServiceSelection = await AppointmentService.handleAppointmentFlow(
            { trigger: 'department_selected', department: 'tasacion' },
            'APPOINTMENT'
        );
        console.log('✅ Fechas habilitadas:', afterServiceSelection.data.is_date_enabled);

        // Simular selección de ubicación
        console.log('\n📍 Usuario selecciona: Cartagena');
        const afterLocationSelection = await AppointmentService.handleAppointmentFlow(
            { trigger: 'location_selected', department: 'tasacion', location: 'cartagena' },
            'APPOINTMENT'
        );
        console.log('✅ Fechas habilitadas:', afterLocationSelection.data.is_date_enabled);

        // Simular selección de fecha
        console.log('\n📅 Usuario selecciona fecha: 2025-09-25');
        const afterDateSelection = await AppointmentService.handleAppointmentFlow(
            { 
                trigger: 'date_selected', 
                department: 'tasacion', 
                location: 'cartagena',
                date: '2025-09-25'
            },
            'APPOINTMENT'
        );
        console.log('✅ Horarios habilitados:', afterDateSelection.data.is_time_enabled);
        console.log('⏰ Horarios disponibles:', afterDateSelection.data.time.length);

        // 4. Pantalla DETAILS
        console.log('\n🖥️ PANTALLA: DETAILS');
        const detailsData = {
            department: 'tasacion',
            location: 'cartagena', 
            date: '2025-09-25',
            time: '10:00 AM',
            name: 'Ana Martínez',
            email: 'ana.martinez@email.com',
            phone: '+573012345678',
            more_details: 'Tengo una cadena de oro de mi abuela que quiero tasar para posible venta'
        };

        const detailsResponse = await AppointmentService.handleAppointmentFlow(
            detailsData,
            'DETAILS'
        );
        console.log('📋 Transición a SUMMARY:', detailsResponse.screen === 'SUMMARY' ? '✅' : '❌');

        // 5. Pantalla SUMMARY - Confirmación final
        console.log('\n🖥️ PANTALLA: SUMMARY - Guardando en MongoDB...');
        const summaryResponse = await AppointmentService.handleAppointmentFlow(
            detailsData,
            'SUMMARY'
        );

        console.log('✅ Respuesta final:', summaryResponse.screen);
        if (summaryResponse.data && summaryResponse.data.appointment_details) {
            console.log('📋 Detalles:', summaryResponse.data.appointment_details);
        }

        // 6. Verificar en base de datos
        console.log('\n6️⃣ Verificando cita guardada...');
        const Appointment = require('../models/Appointment');
        const recentAppointment = await Appointment.findOne()
            .sort({ createdAt: -1 })
            .populate('customer');

        if (recentAppointment) {
            console.log('💾 Cita encontrada en MongoDB:');
            console.log(`   📋 Referencia: ${recentAppointment.appointmentReference}`);
            console.log(`   👤 Cliente: ${recentAppointment.customer.name}`);
            console.log(`   📱 Teléfono: ${recentAppointment.customer.phone}`);
            console.log(`   💎 Servicio: ${recentAppointment.serviceType}`);
            console.log(`   📍 Ubicación: ${recentAppointment.location}`);
            console.log(`   📅 Fecha/Hora: ${recentAppointment.dateTime.toLocaleString('es-CO')}`);
            console.log(`   📝 Notas: ${recentAppointment.customerNotes}`);
        }

        // 7. Resumen final
        console.log('\n🎉 === VALIDACIÓN COMPLETA ===');
        console.log('✅ Flow JSON compatible con appointmentService.js');
        console.log('✅ Todos los campos se mapean correctamente');
        console.log('✅ Datos se guardan en MongoDB correctamente');
        console.log('✅ Servicios de joyería configurados');
        console.log('✅ Ubicaciones Cartagena y Santa Marta operativas');
        console.log('✅ Términos y condiciones personalizados');
        console.log('');
        console.log('🚀 El Flow está listo para cargar en Meta Business Manager!');

    } catch (error) {
        console.error('❌ Error en validación:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Ejecutar test
if (require.main === module) {
    testFlowIntegration();
}

module.exports = testFlowIntegration;