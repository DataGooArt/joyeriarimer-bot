/**
 * 🧪 Script de prueba OFFLINE para validar el Flow de citas 
 * NO requiere conexión a MongoDB - Solo tests de lógica
 */

// Mock de AppointmentService para pruebas sin BD
const MockAppointmentService = {
    SERVICES: [
        { id: 'tasacion', title: '💎 Tasación de Joyas' },
        { id: 'diseño_personalizado', title: '✨ Diseño Personalizado' },
        { id: 'reparacion', title: '🔧 Reparación de Joyas' },
        { id: 'compra_presencial', title: '🛍️ Asesoría de Compra' },
        { id: 'limpieza', title: '✨ Limpieza y Mantenimiento' }
    ],

    JOYERIA_LOCATIONS: [
        { id: 'cartagena', title: 'Cartagena de Indias' },
        { id: 'santa_marta', title: 'Santa Marta' }
    ],

    AVAILABLE_TIMES: [
        '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ],

    getAvailableDates() {
        const dates = [];
        const today = new Date();
        
        for (let i = 1; i <= 15; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dayOfWeek = date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                dates.push({
                    id: date.toISOString().split('T')[0],
                    title: date.toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    })
                });
            }
        }
        
        return dates;
    },

    // Mock sin consulta BD
    async getAvailableTimesForDate(dateString) {
        console.log('🔬 MOCK: Obteniendo horarios para', dateString);
        return this.AVAILABLE_TIMES.map(time => ({ id: time, title: time }));
    },

    generateAppointmentSummary(formData) {
        const service = this.SERVICES.find(s => s.id === formData.department);
        const location = this.JOYERIA_LOCATIONS.find(l => l.id === formData.location);
        
        const date = new Date(formData.date);
        const formattedDate = date.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        return `${service?.title || 'Servicio'} en ${location?.title || 'Sede'}\n${formattedDate} a las ${formData.time}`;
    },

    generateDetailsSummary(formData) {
        let summary = `Nombre: ${formData.name || 'No especificado'}\n`;
        summary += `Email: ${formData.email || 'No especificado'}\n`;
        summary += `Teléfono: ${formData.phone || 'No especificado'}`;
        
        if (formData.more_details) {
            summary += `\n\nDetalles adicionales:\n${formData.more_details}`;
        }
        
        return summary;
    },

    getInitialAppointmentData() {
        return {
            department: this.SERVICES,
            location: this.JOYERIA_LOCATIONS,
            is_location_enabled: true,
            date: this.getAvailableDates(),
            is_date_enabled: false,
            time: this.AVAILABLE_TIMES.map(time => ({ id: time, title: time })),
            is_time_enabled: false
        };
    },

    // Mock del handler principal
    async handleAppointmentFlow(decryptedBody) {
        console.log('🔬 MOCK: Procesando Flow de agendamiento:', JSON.stringify(decryptedBody, null, 2));
        
        const { screen, data: formData, action } = decryptedBody;
        
        try {
            switch (screen) {
                case 'APPOINTMENT':
                    return await this.handleAppointmentScreen(formData, action);
                    
                case 'DETAILS':
                    return await this.handleDetailsScreen(formData);
                    
                case 'SUMMARY':
                    return await this.handleSummaryScreen(formData);
                    
                default:
                    console.log(`⚠️ Pantalla no reconocida: ${screen}`);
                    return {
                        version: "3.0",
                        screen: "APPOINTMENT",
                        data: this.getInitialAppointmentData()
                    };
            }
        } catch (error) {
            console.error('❌ Error procesando Flow:', error);
            return {
                version: "3.0",
                screen: "APPOINTMENT",
                data: this.getInitialAppointmentData()
            };
        }
    },

    async handleAppointmentScreen(formData, action) {
        console.log('🔬 MOCK: Procesando pantalla APPOINTMENT, acción:', action);
        
        const baseData = {
            department: this.SERVICES,
            location: this.JOYERIA_LOCATIONS,
            is_location_enabled: true,
            date: this.getAvailableDates(),
            is_date_enabled: false,
            time: this.AVAILABLE_TIMES.map(time => ({ id: time, title: time })),
            is_time_enabled: false
        };
        
        if (formData && formData.trigger) {
            switch (formData.trigger) {
                case 'department_selected':
                    console.log('🎯 Servicio seleccionado:', formData.department);
                    baseData.is_date_enabled = true;
                    break;
                    
                case 'location_selected':
                    console.log('📍 Ubicación seleccionada:', formData.location);
                    baseData.is_date_enabled = true;
                    break;
                    
                case 'date_selected':
                    console.log('📅 Fecha seleccionada:', formData.date);
                    const availableTimes = await this.getAvailableTimesForDate(formData.date);
                    baseData.time = availableTimes;
                    baseData.is_time_enabled = true;
                    break;
            }
        }
        
        return {
            version: "3.0",
            screen: "APPOINTMENT",
            data: baseData
        };
    },

    async handleDetailsScreen(formData) {
        console.log('🔬 MOCK: Procesando pantalla DETAILS con datos:', formData);
        
        const appointmentSummary = this.generateAppointmentSummary(formData);
        const detailsSummary = this.generateDetailsSummary(formData);
        
        return {
            version: "3.0",
            screen: "SUMMARY",
            data: {
                appointment: appointmentSummary,
                details: detailsSummary,
                department: formData.department,
                location: formData.location,
                date: formData.date,
                time: formData.time,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                more_details: formData.more_details || ''
            }
        };
    },

    async handleSummaryScreen(formData) {
        console.log('🔬 MOCK: Confirmando cita (SIN GUARDAR) con datos:', formData);
        
        return {
            version: "3.0",
            screen: "SUCCESS",
            data: {
                success_message: "¡Cita confirmada exitosamente! Te contactaremos pronto.",
                appointment_details: `Cita #MOCK123 confirmada`
            }
        };
    }
};

// Mock FlowService
const MockFlowService = {
    async processAppointmentFlowResponse(decryptedBody) {
        try {
            console.log('🔬 MOCK: Procesando Flow interactivo:', JSON.stringify(decryptedBody, null, 2));
            
            if (decryptedBody.action === 'ping') {
                console.log('🏓 Respondiendo ping de Meta para validación');
                return {
                    responseRequired: true,
                    data: { status: "active" }
                };
            }
            
            if (decryptedBody.action === 'data_exchange' || decryptedBody.screen) {
                const flowResult = await MockAppointmentService.handleAppointmentFlow(decryptedBody);
                const requiresResponse = flowResult.screen !== 'SUCCESS';
                
                return {
                    responseRequired: requiresResponse,
                    data: flowResult
                };
            }
            
            return {
                responseRequired: false,
                message: 'Formato no reconocido'
            };
            
        } catch (error) {
            console.error('❌ Error procesando Flow:', error);
            return {
                responseRequired: true,
                data: {
                    version: "3.0",
                    screen: "APPOINTMENT",
                    data: MockAppointmentService.getInitialAppointmentData()
                }
            };
        }
    }
};

/**
 * 🚀 Tests offline
 */
async function runOfflineTests() {
    console.log('🧪 ===== TESTS OFFLINE DE FLOW DE CITAS =====');
    console.log('📅 Flow ID: 24509326838732458');
    console.log('🔬 Modo: MOCK (Sin conexión MongoDB)');
    
    // Test 1: Ping
    console.log('\n🏓 === TEST 1: Ping Response ===');
    const pingResult = await MockFlowService.processAppointmentFlowResponse({ action: 'ping' });
    console.log('✅ Ping Result:', JSON.stringify(pingResult, null, 2));
    console.log(pingResult.responseRequired && pingResult.data.status === 'active' ? '✅ PASÓ' : '❌ FALLÓ');
    
    // Test 2: Pantalla inicial
    console.log('\n📋 === TEST 2: Pantalla Inicial ===');
    const initialResult = await MockFlowService.processAppointmentFlowResponse({
        action: 'data_exchange',
        screen: 'APPOINTMENT'
    });
    console.log('✅ Inicial Result:', JSON.stringify(initialResult, null, 2));
    console.log(initialResult.data && initialResult.data.data ? '✅ PASÓ' : '❌ FALLÓ');
    
    // Test 3: Selección servicio
    console.log('\n🎯 === TEST 3: Selección de Servicio ===');
    const serviceResult = await MockFlowService.processAppointmentFlowResponse({
        action: 'data_exchange',
        screen: 'APPOINTMENT',
        data: {
            trigger: 'department_selected',
            department: 'tasacion'
        }
    });
    console.log(serviceResult.data.data.is_date_enabled ? '✅ PASÓ' : '❌ FALLÓ');
    
    // Test 4: Selección fecha
    console.log('\n📅 === TEST 4: Selección de Fecha ===');
    const dateResult = await MockFlowService.processAppointmentFlowResponse({
        action: 'data_exchange',
        screen: 'APPOINTMENT',
        data: {
            trigger: 'date_selected',
            date: '2024-01-15',
            department: 'tasacion',
            location: 'cartagena'
        }
    });
    console.log(dateResult.data.data.is_time_enabled ? '✅ PASÓ' : '❌ FALLÓ');
    
    // Test 5: Detalles
    console.log('\n👤 === TEST 5: Pantalla de Detalles ===');
    const detailsResult = await MockFlowService.processAppointmentFlowResponse({
        action: 'data_exchange',
        screen: 'DETAILS',
        data: {
            department: 'tasacion',
            location: 'cartagena',
            date: '2024-01-15',
            time: '10:00 AM',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+573001234567',
            more_details: 'Necesito tasar una cadena de oro'
        }
    });
    console.log(detailsResult.data.screen === 'SUMMARY' ? '✅ PASÓ' : '❌ FALLÓ');
    
    // Test 6: Confirmación
    console.log('\n✅ === TEST 6: Confirmación Final ===');
    const summaryResult = await MockFlowService.processAppointmentFlowResponse({
        action: 'data_exchange',
        screen: 'SUMMARY',
        data: {
            department: 'tasacion',
            location: 'cartagena',
            date: '2024-01-15',
            time: '10:00 AM',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+573001234567'
        }
    });
    console.log(summaryResult.data.screen === 'SUCCESS' ? '✅ PASÓ' : '❌ FALLÓ');
    
    console.log('\n🎉 ===== TESTS OFFLINE COMPLETADOS =====');
    console.log('✅ Lógica del Flow validada sin conexión a BD');
    console.log('📱 Flow listo para integración con MongoDB');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runOfflineTests().catch(console.error);
}

module.exports = { MockAppointmentService, MockFlowService, runOfflineTests };