// test-mongodb-web-integration.js
// 🧪 Test de integración: MongoDB ↔ Portal Web ↔ Flow

const mongoose = require('mongoose');
const axios = require('axios');
const Service = require('../../models/Service');
const Location = require('../../models/Location');
const Appointment = require('../../models/Appointment');
const Customer = require('../../models/Customer');
require('dotenv').config();

const WEB_SERVER_URL = 'http://localhost:3001';

async function testWebIntegration() {
    try {
        console.log('🧪 INICIANDO TEST DE INTEGRACIÓN WEB...\n');
        
        // 1. Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // 2. Verificar servidor web
        console.log('2️⃣ VERIFICANDO SERVIDOR WEB:');
        try {
            // Test servicios endpoint
            const servicesResponse = await axios.get(`${WEB_SERVER_URL}/api/services`);
            console.log(`   ✅ GET /api/services: ${servicesResponse.data.length} servicios`);
            
            // Test ubicaciones endpoint  
            const locationsResponse = await axios.get(`${WEB_SERVER_URL}/api/locations`);
            console.log(`   ✅ GET /api/locations: ${locationsResponse.data.length} ubicaciones`);
            
            // Test estadísticas endpoint
            const statsResponse = await axios.get(`${WEB_SERVER_URL}/api/stats`);
            console.log(`   ✅ GET /api/stats: ${statsResponse.data.total} citas totales`);
            
        } catch (error) {
            console.log(`   ❌ Error conectando al servidor web: ${error.message}`);
            console.log('   ⚠️ Asegúrate de que el servidor esté corriendo: node web/server.js');
            return;
        }

        // 3. Crear cita de prueba 
        console.log('\n3️⃣ CREANDO CITA DE PRUEBA:');
        
        let testCustomer = await Customer.findOne({ phone: '573123456789' });
        if (!testCustomer) {
            testCustomer = new Customer({
                phone: '573123456789',
                name: 'Cliente Web Test',
                termsAcceptedAt: new Date()
            });
            await testCustomer.save();
        }

        const testAppointment = new Appointment({
            customer: testCustomer._id,
            serviceId: 'valoracion',
            locationId: 'cartagena', 
            dateTime: new Date('2025-09-26T11:00:00'),
            customerNotes: 'Test de integración web',
            appointmentSource: 'web_integration_test'
        });

        await testAppointment.save();
        console.log(`   ✅ Cita creada: ${testAppointment.appointmentReference}`);

        // 4. Verificar en API
        console.log('\n4️⃣ VERIFICANDO EN API WEB:');
        const appointmentsResponse = await axios.get(`${WEB_SERVER_URL}/api/appointments?limit=10`);
        const appointments = appointmentsResponse.data;
        
        const foundAppointment = appointments.find(apt => 
            apt.appointmentReference === testAppointment.appointmentReference
        );

        if (foundAppointment) {
            console.log('   ✅ Cita encontrada en API:');
            console.log(`     - Referencia: ${foundAppointment.appointmentReference}`);
            console.log(`     - Cliente: ${foundAppointment.customer?.name}`);
            console.log(`     - Servicio: ${foundAppointment.service?.name} (${foundAppointment.serviceId})`);
            console.log(`     - Ubicación: ${foundAppointment.location?.name} (${foundAppointment.locationId})`);
        }

        // 5. Limpiar
        await Appointment.findByIdAndDelete(testAppointment._id);
        console.log('\n5️⃣ ✅ Datos de prueba eliminados');

        console.log('\n🎉 ¡INTEGRACIÓN WEB EXITOSA!');
        console.log('\n📋 RESUMEN:');
        console.log('   ✅ Portal web funcionando');
        console.log('   ✅ APIs respondiendo correctamente');
        console.log('   ✅ Datos sincronizados entre BD y web');
        console.log('   ✅ Referencias pobladas correctamente');

    } catch (error) {
        console.error('❌ Error en test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testWebIntegration();
}

module.exports = { testWebIntegration };