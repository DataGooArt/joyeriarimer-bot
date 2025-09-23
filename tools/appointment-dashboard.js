// appointment-dashboard.js
// 📊 Dashboard simple para gestionar citas desde terminal

const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
require('dotenv').config();

class AppointmentDashboard {
    
    static async connect() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Conectado a MongoDB Atlas');
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            process.exit(1);
        }
    }

    /**
     * 📋 Mostrar todas las citas pendientes
     */
    static async showPendingAppointments() {
        console.log('\n📅 === CITAS PENDIENTES ===\n');
        
        const appointments = await Appointment.find({ 
            status: 'pending',
            dateTime: { $gte: new Date() } // Solo futuras
        })
        .populate('customer')
        .sort({ dateTime: 1 });

        if (appointments.length === 0) {
            console.log('✨ No hay citas pendientes');
            return;
        }

        appointments.forEach((apt, index) => {
            const date = apt.dateTime.toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });

            console.log(`${index + 1}. 📌 REF: ${apt.appointmentReference}`);
            console.log(`   👤 Cliente: ${apt.customer?.name || 'Sin nombre'}`);
            console.log(`   📱 Teléfono: ${apt.customer?.phone}`);
            console.log(`   💎 Servicio: ${apt.serviceType}`);
            console.log(`   📍 Sede: ${apt.location}`);
            console.log(`   📅 Fecha: ${date}`);
            console.log(`   📧 Email: ${apt.customerEmail || 'No proporcionado'}`);
            console.log(`   📝 Notas: ${apt.customerNotes || 'Sin notas'}`);
            console.log(`   ⏰ Creada: ${apt.createdAt.toLocaleDateString('es-CO')}`);
            console.log('   ' + '─'.repeat(50));
        });
    }

    /**
     * 📈 Estadísticas generales
     */
    static async showStats() {
        console.log('\n📊 === ESTADÍSTICAS DE CITAS ===\n');

        const today = new Date();
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const stats = await Promise.all([
            Appointment.countDocuments({ status: 'pending' }),
            Appointment.countDocuments({ status: 'confirmed' }),
            Appointment.countDocuments({ status: 'completed' }),
            Appointment.countDocuments({ status: 'cancelled' }),
            Appointment.countDocuments({ 
                createdAt: { $gte: thisWeek } 
            }),
            Appointment.countDocuments({ 
                createdAt: { $gte: thisMonth } 
            }),
            Appointment.countDocuments(),
        ]);

        const [pending, confirmed, completed, cancelled, thisWeekCount, thisMonthCount, total] = stats;

        console.log(`📋 Citas pendientes: ${pending}`);
        console.log(`✅ Citas confirmadas: ${confirmed}`);
        console.log(`✨ Citas completadas: ${completed}`);
        console.log(`❌ Citas canceladas: ${cancelled}`);
        console.log(`📅 Esta semana: ${thisWeekCount}`);
        console.log(`🗓️  Este mes: ${thisMonthCount}`);
        console.log(`📊 Total histórico: ${total}`);

        // Servicios más populares
        console.log('\n🏆 === SERVICIOS MÁS POPULARES ===\n');
        const serviceStats = await Appointment.aggregate([
            { $group: { _id: '$serviceType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        serviceStats.forEach((service, index) => {
            console.log(`${index + 1}. ${service._id}: ${service.count} citas`);
        });
    }

    /**
     * ✅ Confirmar una cita por referencia
     */
    static async confirmAppointment(reference) {
        const appointment = await Appointment.findOne({ 
            appointmentReference: reference 
        }).populate('customer');

        if (!appointment) {
            console.log(`❌ No se encontró cita con referencia: ${reference}`);
            return;
        }

        appointment.status = 'confirmed';
        appointment.confirmationSent = true;
        await appointment.save();

        console.log(`✅ Cita ${reference} confirmada exitosamente`);
        console.log(`👤 Cliente: ${appointment.customer?.name}`);
        console.log(`📅 Fecha: ${appointment.dateTime.toLocaleDateString('es-CO')}`);
    }

    /**
     * 🔍 Buscar citas por teléfono
     */
    static async searchByPhone(phone) {
        console.log(`\n🔍 Buscando citas para: ${phone}\n`);

        const customer = await Customer.findOne({ phone: phone });
        if (!customer) {
            console.log('❌ No se encontró cliente con ese teléfono');
            return;
        }

        const appointments = await Appointment.find({ 
            customer: customer._id 
        }).sort({ createdAt: -1 });

        if (appointments.length === 0) {
            console.log('📭 Este cliente no tiene citas registradas');
            return;
        }

        console.log(`👤 Cliente: ${customer.name || 'Sin nombre'}`);
        console.log(`📧 Email: ${customer.email || 'No registrado'}`);
        console.log(`\n📅 Historial de citas:\n`);

        appointments.forEach((apt, index) => {
            const status = {
                'pending': '⏳ Pendiente',
                'confirmed': '✅ Confirmada', 
                'completed': '✨ Completada',
                'cancelled': '❌ Cancelada'
            }[apt.status];

            console.log(`${index + 1}. ${apt.appointmentReference} - ${status}`);
            console.log(`   📅 ${apt.dateTime.toLocaleDateString('es-CO')}`);
            console.log(`   💎 ${apt.serviceType} en ${apt.location}`);
            console.log(`   📝 ${apt.customerNotes || 'Sin notas'}`);
            console.log('');
        });
    }

    /**
     * 🗓️ Citas de hoy
     */
    static async showTodayAppointments() {
        console.log('\n📅 === CITAS DE HOY ===\n');

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const appointments = await Appointment.find({
            dateTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).populate('customer').sort({ dateTime: 1 });

        if (appointments.length === 0) {
            console.log('✨ No hay citas programadas para hoy');
            return;
        }

        appointments.forEach((apt, index) => {
            const time = apt.dateTime.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const status = {
                'pending': '⏳',
                'confirmed': '✅',
                'completed': '✨',
                'cancelled': '❌'
            }[apt.status];

            console.log(`${index + 1}. ${status} ${time} - ${apt.customer?.name || 'Sin nombre'}`);
            console.log(`   📱 ${apt.customer?.phone}`);
            console.log(`   💎 ${apt.serviceType} (${apt.location})`);
            console.log(`   🔖 ${apt.appointmentReference}`);
            console.log('');
        });
    }
}

// Funciones de interfaz de línea de comandos
async function main() {
    await AppointmentDashboard.connect();

    const command = process.argv[2];
    const param = process.argv[3];

    switch (command) {
        case 'pending':
            await AppointmentDashboard.showPendingAppointments();
            break;
        case 'stats':
            await AppointmentDashboard.showStats();
            break;
        case 'today':
            await AppointmentDashboard.showTodayAppointments();
            break;
        case 'confirm':
            if (!param) {
                console.log('❌ Proporciona la referencia: node appointment-dashboard.js confirm JR123456');
                break;
            }
            await AppointmentDashboard.confirmAppointment(param);
            break;
        case 'search':
            if (!param) {
                console.log('❌ Proporciona el teléfono: node appointment-dashboard.js search +573001234567');
                break;
            }
            await AppointmentDashboard.searchByPhone(param);
            break;
        default:
            console.log(`
📊 Dashboard de Citas - Joyería Rimer

Comandos disponibles:
  pending  - Ver citas pendientes
  stats    - Estadísticas generales
  today    - Citas de hoy
  confirm  - Confirmar cita (ej: confirm JR123456)
  search   - Buscar por teléfono (ej: search +573001234567)

Ejemplos:
  node tools/appointment-dashboard.js pending
  node tools/appointment-dashboard.js stats
  node tools/appointment-dashboard.js confirm JR123456
            `);
    }

    mongoose.connection.close();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AppointmentDashboard;