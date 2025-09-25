// seed-services-locations.js
// 🌱 Script para inicializar servicios y ubicaciones en MongoDB

const mongoose = require('mongoose');
const Service = require('./models/Service');
const Location = require('./models/Location');
require('dotenv').config();

const SERVICES_DATA = [
    {
        id: 'consulta',
        name: 'Consulta General',
        flowDisplayName: 'Consulta General',
        description: 'Consulta general sobre joyas y servicios',
        duration: 30,
        price: 0,
        category: 'consultation'
    },
    {
        id: 'diseno',
        name: 'Diseño Personalizado',
        flowDisplayName: 'Diseño Personalizado',
        description: 'Diseño de joyas personalizadas según tus gustos',
        duration: 60,
        price: 100000,
        category: 'design'
    },
    {
        id: 'reparacion',
        name: 'Reparación',
        flowDisplayName: 'Reparación',
        description: 'Reparación de joyas dañadas',
        duration: 45,
        price: 50000,
        category: 'repair'
    },
    {
        id: 'valoracion',
        name: 'Valoración de Joyas',
        flowDisplayName: 'Valoración de Joyas',
        description: 'Tasación profesional de joyas',
        duration: 30,
        price: 25000,
        category: 'valuation'
    }
];

const LOCATIONS_DATA = [
    {
        id: 'cartagena',
        name: 'Sede Cartagena',
        flowDisplayName: 'Cartagena',
        address: 'Centro Histórico, Cartagena',
        city: 'Cartagena',
        phone: '+57 5 664 8080',
        coordinates: { lat: 10.4236, lng: -75.5378 },
        businessHours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '17:00' },
            sunday: { open: null, close: null }
        }
    },
    {
        id: 'santa_marta',
        name: 'Sede Santa Marta',
        flowDisplayName: 'Santa Marta',
        address: 'El Rodadero, Santa Marta',
        city: 'Santa Marta',
        phone: '+57 5 422 1234',
        coordinates: { lat: 11.2091, lng: -74.2238 },
        businessHours: {
            monday: { open: '09:00', close: '18:00' },
            tuesday: { open: '09:00', close: '18:00' },
            wednesday: { open: '09:00', close: '18:00' },
            thursday: { open: '09:00', close: '18:00' },
            friday: { open: '09:00', close: '18:00' },
            saturday: { open: '09:00', close: '17:00' },
            sunday: { open: null, close: null }
        }
    }
];

async function seedData() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar datos existentes
        await Service.deleteMany({});
        await Location.deleteMany({});
        console.log('🧹 Datos anteriores eliminados');

        // Insertar servicios
        const services = await Service.insertMany(SERVICES_DATA);
        console.log(`✅ ${services.length} servicios insertados:`);
        services.forEach(service => {
            console.log(`   - ${service.name} (${service.id})`);
        });

        // Insertar ubicaciones
        const locations = await Location.insertMany(LOCATIONS_DATA);
        console.log(`✅ ${locations.length} ubicaciones insertadas:`);
        locations.forEach(location => {
            console.log(`   - ${location.name} (${location.id})`);
        });

        console.log('\n🎉 ¡Seed completado exitosamente!');
        
        // Verificar datos para el Flow
        console.log('\n📱 DATOS OPTIMIZADOS PARA EL FLOW:');
        const flowServices = await Service.getForFlow();
        const flowLocations = await Location.getForFlow();
        
        console.log('Servicios:', JSON.stringify(flowServices, null, 2));
        console.log('Ubicaciones:', JSON.stringify(flowLocations, null, 2));

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    seedData();
}

module.exports = { seedData };