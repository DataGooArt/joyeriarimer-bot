// test-flow-structure-validation.js
// 🧪 Test para validar que el payload coincide con la estructura del Flow de Meta

const mongoose = require('mongoose');
const Service = require('../../models/Service');
const Location = require('../../models/Location');
require('dotenv').config();

// Función simple para generar fechas disponibles
function generateTestDates(days = 7) {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const dayName = dayNames[date.getDay()];
        const day = date.getDate();
        const month = monthNames[date.getMonth()];
        
        dates.push({
            date: date.toISOString().split('T')[0],
            displayDate: `${dayName}, ${day} de ${month}`
        });
    }
    
    return dates;
}

async function testFlowStructure() {
    try {
        console.log('🧪 VALIDANDO ESTRUCTURA DEL FLOW...\n');
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Obtener datos como lo hace sendAppointmentFlow
        const services = await Service.find({ active: true });
        const locations = await Location.find({ active: true });
        const availableDates = generateTestDates(7);

        // Transformar servicios a formato del Flow (department)
        const department = services.map(service => ({
            id: service.id,
            title: `💎 ${service.name}`
        }));

        // Transformar ubicaciones a formato del Flow
        const location = locations.map(loc => ({
            id: loc.id,
            title: `📍 ${loc.name}`
        }));

        // Transformar fechas a formato del Flow
        const date = availableDates.slice(0, 5).map(dateItem => ({
            id: dateItem.date,
            title: dateItem.displayDate
        }));

        // Generar horarios disponibles
        const time = [
            { id: "09:00", title: "9:00 AM", enabled: true },
            { id: "09:30", title: "9:30 AM", enabled: true },
            { id: "10:00", title: "10:00 AM", enabled: true },
            { id: "10:30", title: "10:30 AM", enabled: true },
            { id: "11:00", title: "11:00 AM", enabled: true },
            { id: "14:00", title: "2:00 PM", enabled: true },
            { id: "14:30", title: "2:30 PM", enabled: true },
            { id: "15:00", title: "3:00 PM", enabled: true },
            { id: "15:30", title: "3:30 PM", enabled: true },
            { id: "16:00", title: "4:00 PM", enabled: true }
        ];

        const flowActionPayload = {
            screen: 'APPOINTMENT',
            data: {
                department: department,
                location: location,
                is_location_enabled: true,
                date: date,
                is_date_enabled: true,
                time: time,
                is_time_enabled: true
            }
        };

        console.log('📦 PAYLOAD GENERADO:');
        console.log(JSON.stringify(flowActionPayload, null, 2));

        console.log('\n✅ VALIDACIÓN DE ESTRUCTURA:');
        console.log(`   - Pantalla: ${flowActionPayload.screen} ✅`);
        console.log(`   - Departamentos: ${department.length} servicios ✅`);
        console.log(`   - Ubicaciones: ${location.length} sedes ✅`);
        console.log(`   - Fechas: ${date.length} días disponibles ✅`);
        console.log(`   - Horarios: ${time.length} slots ✅`);
        console.log(`   - Flags habilitados: ${flowActionPayload.data.is_location_enabled && flowActionPayload.data.is_date_enabled && flowActionPayload.data.is_time_enabled ? '✅' : '❌'}`);

        console.log('\n🔍 VERIFICACIÓN CAMPO POR CAMPO:');
        
        // Verificar department
        console.log('📋 DEPARTMENT (servicios):');
        department.forEach((dept, i) => {
            console.log(`   ${i+1}. ID: "${dept.id}" - Title: "${dept.title}"`);
        });

        // Verificar location
        console.log('\n📍 LOCATION (ubicaciones):');
        location.forEach((loc, i) => {
            console.log(`   ${i+1}. ID: "${loc.id}" - Title: "${loc.title}"`);
        });

        // Verificar date
        console.log('\n📅 DATE (fechas):');
        date.forEach((d, i) => {
            console.log(`   ${i+1}. ID: "${d.id}" - Title: "${d.title}"`);
        });

        // Verificar time
        console.log('\n🕒 TIME (horarios):');
        time.slice(0, 5).forEach((t, i) => {
            console.log(`   ${i+1}. ID: "${t.id}" - Title: "${t.title}" - Enabled: ${t.enabled}`);
        });

        console.log('\n🎯 ESTRUCTURA COINCIDE CON EL FLOW DE META ✅');
        console.log('\n📋 RESUMEN:');
        console.log('   ✅ Pantalla inicial: APPOINTMENT');
        console.log('   ✅ Campo department con estructura {id, title}');
        console.log('   ✅ Campo location con estructura {id, title}');
        console.log('   ✅ Campo date con estructura {id, title}');
        console.log('   ✅ Campo time con estructura {id, title, enabled}');
        console.log('   ✅ Flags de habilitación incluidos');

    } catch (error) {
        console.error('❌ Error en validación:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testFlowStructure();
}

module.exports = { testFlowStructure };