// 🧪 Test de la lógica del Flow (sin MongoDB)
// Simula la navegación entre pantallas

console.log('🧪 TEST DE LÓGICA DEL FLOW...\n');

// Mock de los modelos para evitar dependencia de MongoDB
const mockService = { id: 'tasacion', flowDisplayName: 'Tasación de Joyas', name: 'Tasación' };
const mockLocation = { id: 'cartagena', flowDisplayName: 'Cartagena Centro', name: 'Cartagena' };

// Mock de los modelos
const Service = {
    findOne: async (query) => {
        if (query.id === 'tasacion') return mockService;
        return null;
    }
};

const Location = {
    findOne: async (query) => {
        if (query.id === 'cartagena') return mockLocation;
        return null;
    }
};

const Appointment = function(data) {
    this._id = 'mock_appointment_id';
    this.save = async () => {
        console.log('📝 Mock: Cita guardada exitosamente');
        return this;
    };
};

// Simular la función handleFlowDataExchange (sin require)
async function handleFlowDataExchange(decryptedBody) {
    const { screen, data, action } = decryptedBody;
    
    console.log(`🔄 Procesando pantalla del Flow: ${screen}, action: ${action}`, data);
    
    switch (screen) {
        case 'APPOINTMENT':
            console.log('📅 Procesando pantalla APPOINTMENT:', data);
            
            if (data.department && data.location && data.date && data.time) {
                console.log('✅ Navegando hacia DETAILS con datos:', {
                    department: data.department,
                    location: data.location,
                    date: data.date,
                    time: data.time
                });
                
                return {
                    screen: 'DETAILS',
                    data: {
                        department: data.department,
                        location: data.location,
                        date: data.date,
                        time: data.time
                    }
                };
            }
            
            return {
                screen: 'APPOINTMENT',
                data: {
                    acknowledged: true,
                    is_location_enabled: Boolean(data.department),
                    is_date_enabled: Boolean(data.department) && Boolean(data.location),
                    is_time_enabled: Boolean(data.department) && Boolean(data.location) && Boolean(data.date)
                }
            };
            
        case 'DETAILS':
            console.log('👤 Procesando pantalla DETAILS:', data);
            
            const service = await Service.findOne({ id: data.department });
            const location = await Location.findOne({ id: data.location });
            
            const dateObj = new Date(data.date);
            const formattedDate = dateObj.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            const appointmentSummary = `💎 ${service?.flowDisplayName || service?.name}\n📍 ${location?.flowDisplayName || location?.name}\n📅 ${formattedDate}\n🕒 ${data.time}`;
            const detailsSummary = `👤 ${data.name}\n📧 ${data.email}\n📱 ${data.phone}${data.more_details ? '\n📝 ' + data.more_details : ''}`;
            
            console.log('✅ Navegando hacia SUMMARY con datos completos');
            
            return {
                screen: 'SUMMARY',
                data: {
                    appointment: appointmentSummary,
                    details: detailsSummary,
                    department: data.department,
                    location: data.location,
                    date: data.date,
                    time: data.time,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    more_details: data.more_details || '',
                    terms_accepted: false,
                    privacy_accepted: false
                }
            };
            
        case 'SUMMARY':
            console.log('✅ Procesando pantalla SUMMARY (confirmación final):', data);
            
            const appointment = new Appointment({
                serviceId: data.department,
                locationId: data.location,
                scheduledDate: new Date(`${data.date}T${data.time}`),
                customerName: data.name,
                customerEmail: data.email,
                customerPhone: data.phone,
                notes: data.more_details || '',
                status: 'confirmed',
                termsAccepted: data.terms_accepted,
                privacyAccepted: data.privacy_accepted,
                createdAt: new Date()
            });
            
            await appointment.save();
            
            const reference = `JR${Date.now().toString().slice(-8)}`;
            
            console.log('✅ Cita guardada exitosamente:', {
                reference,
                appointmentId: appointment._id
            });
            
            return {
                screen: 'SUCCESS',
                data: {
                    success_message: '¡Tu cita ha sido confirmada exitosamente!',
                    appointment_details: `📋 Referencia: ${reference}\n💎 Servicio: ${data.department}\n📍 Sede: ${data.location}\n📅 Fecha: ${data.date}\n🕒 Hora: ${data.time}`
                }
            };
            
        case 'SUCCESS':
            console.log('🎉 Flow completado exitosamente:', data);
            return {
                data: {
                    acknowledged: true,
                    status: 'completed'
                }
            };
            
        default:
            console.log(`⚠️ Pantalla desconocida del Flow: ${screen}`, data);
            return {
                data: {
                    acknowledged: true
                }
            };
    }
}

// Ejecutar test
async function runTest() {
    try {
        // 1. APPOINTMENT
        console.log('📱 1. SIMULANDO PANTALLA APPOINTMENT...');
        const appointmentResponse = await handleFlowDataExchange({
            screen: 'APPOINTMENT',
            action: 'data_exchange',
            data: {
                department: 'tasacion',
                location: 'cartagena',
                date: '2025-09-26',
                time: '10:00'
            }
        });
        console.log('✅ Respuesta APPOINTMENT:', JSON.stringify(appointmentResponse, null, 2));
        console.log('');

        // 2. DETAILS
        console.log('📱 2. SIMULANDO PANTALLA DETAILS...');
        const detailsResponse = await handleFlowDataExchange({
            screen: 'DETAILS',
            action: 'data_exchange',
            data: {
                department: 'tasacion',
                location: 'cartagena',
                date: '2025-09-26',
                time: '10:00',
                name: 'María García',
                email: 'maria@example.com',
                phone: '+57 300 123 4567',
                more_details: 'Necesito tasación de un anillo de oro'
            }
        });
        console.log('✅ Respuesta DETAILS:', JSON.stringify(detailsResponse, null, 2));
        console.log('');

        // 3. SUMMARY
        console.log('📱 3. SIMULANDO PANTALLA SUMMARY...');
        const summaryResponse = await handleFlowDataExchange({
            screen: 'SUMMARY',
            action: 'data_exchange',
            data: {
                department: 'tasacion',
                location: 'cartagena',
                date: '2025-09-26',
                time: '10:00',
                name: 'María García',
                email: 'maria@example.com',
                phone: '+57 300 123 4567',
                more_details: 'Necesito tasación de un anillo de oro',
                terms_accepted: true,
                privacy_accepted: true
            }
        });
        console.log('✅ Respuesta SUMMARY:', JSON.stringify(summaryResponse, null, 2));
        console.log('');

        // 4. SUCCESS
        console.log('📱 4. SIMULANDO PANTALLA SUCCESS...');
        const successResponse = await handleFlowDataExchange({
            screen: 'SUCCESS',
            action: 'data_exchange',
            data: {
                success_message: '¡Tu cita ha sido confirmada exitosamente!',
                appointment_details: 'Referencia: JR12345678'
            }
        });
        console.log('✅ Respuesta SUCCESS:', JSON.stringify(successResponse, null, 2));
        console.log('');

        console.log('🎉 TEST DE LÓGICA DEL FLOW COMPLETADO EXITOSAMENTE!');

    } catch (error) {
        console.error('❌ Error durante el test:', error);
    }
}

runTest();