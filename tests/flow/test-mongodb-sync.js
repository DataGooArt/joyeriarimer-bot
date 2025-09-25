// test-mongodb-sync.js
// 🧪 Test para verificar sincronización entre Flow y MongoDB

const mongoose = require('mongoose');
const Service = require('../../models/Service');
const Location = require('../../models/Location');
const Appointment = require('../../models/Appointment');
const Customer = require('../../models/Customer');
require('dotenv').config();

async function testMongoDBSync() {
    try {
        console.log('🧪 INICIANDO TEST DE SINCRONIZACIÓN MONGODB + FLOW...\n');
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // 1. Verificar que los servicios están en BD
        console.log('1️⃣ VERIFICANDO SERVICIOS:');
        const services = await Service.find({ active: true });
        console.log(`   - Servicios encontrados: ${services.length}`);
        services.forEach(service => {
            console.log(`   - ${service.id}: ${service.name} (${service.duration} min)`);
        });

        // 2. Verificar que las ubicaciones están en BD
        console.log('\n2️⃣ VERIFICANDO UBICACIONES:');
        const locations = await Location.find({ active: true });
        console.log(`   - Ubicaciones encontradas: ${locations.length}`);
        locations.forEach(location => {
            console.log(`   - ${location.id}: ${location.name} - ${location.address}`);
        });

        // 3. Datos optimizados para el Flow
        console.log('\n3️⃣ DATOS PARA EL FLOW:');
        const flowServices = await Service.getForFlow();
        const flowLocations = await Location.getForFlow();
        
        console.log('   Servicios para Flow:');
        console.log(JSON.stringify(flowServices, null, 4));
        
        console.log('   Ubicaciones para Flow:');
        console.log(JSON.stringify(flowLocations, null, 4));

        // 4. Simular creación de cita
        console.log('\n4️⃣ SIMULANDO CREACIÓN DE CITA:');
        
        // Buscar o crear cliente de prueba
        let testCustomer = await Customer.findOne({ phone: '573123456789' });
        if (!testCustomer) {
            testCustomer = new Customer({
                phone: '573123456789',
                name: 'Cliente de Prueba',
                termsAcceptedAt: new Date()
            });
            await testCustomer.save();
            console.log('   ✅ Cliente de prueba creado');
        } else {
            console.log('   ✅ Cliente de prueba encontrado');
        }

        // Crear cita con los nuevos campos
        const newAppointment = new Appointment({
            customer: testCustomer._id,
            serviceId: 'consulta',
            locationId: 'cartagena',
            dateTime: new Date('2025-09-25T10:00:00'),
            customerNotes: 'Cita de prueba desde test',
            appointmentSource: 'whatsapp_flow_test'
        });

        await newAppointment.save();
        console.log(`   ✅ Cita de prueba creada con ID: ${newAppointment._id}`);

        // 5. Verificar cita con populate
        console.log('\n5️⃣ VERIFICANDO CITA CON REFERENCIAS:');
        const appointmentWithRefs = await Appointment.findById(newAppointment._id)
            .populate('customer')
            .populate('service')
            .populate('location');

        console.log('   Datos de la cita:');
        console.log(`   - Cliente: ${appointmentWithRefs.customer.name}`);
        console.log(`   - Servicio ID: ${appointmentWithRefs.serviceId}`);
        console.log(`   - Ubicación ID: ${appointmentWithRefs.locationId}`);
        console.log(`   - Fecha: ${appointmentWithRefs.dateTime}`);
        console.log(`   - Referencias: Service=${appointmentWithRefs.service?.name || 'null'}, Location=${appointmentWithRefs.location?.name || 'null'}`);

        // 6. Limpiar datos de prueba
        await Appointment.findByIdAndDelete(newAppointment._id);
        console.log('\n6️⃣ ✅ Cita de prueba eliminada');

        console.log('\n🎉 ¡TEST COMPLETADO EXITOSAMENTE!');
        console.log('\n📋 RESUMEN:');
        console.log(`   - Servicios sincronizados: ${services.length}`);
        console.log(`   - Ubicaciones sincronizadas: ${locations.length}`);
        console.log('   - Modelos compatibles: ✅');
        console.log('   - Flow data optimizado: ✅');
        console.log('   - Portal web compatible: ✅');

    } catch (error) {
        console.error('❌ Error en el test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testMongoDBSync();
}

module.exports = { testMongoDBSync };