const dotenv = require('dotenv');
dotenv.config();

const whatsapp = require('./api/whatsapp');

/**
 * Prueba del Flow con configuración progressive mejorada
 */
async function testProgressiveFlow() {
    console.log('🧪 Probando Flow con activación progresiva de campos...');
    
    const testPhone = '573104202571';
    
    try {
        // Función para generar fechas (copiada del bot)
        function generateAvailableDates() {
            const dates = [];
            const today = new Date();
            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                               "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
            const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
            
            for (let i = 1; i <= 10; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                
                if (date.getDay() === 0) continue; // Saltar domingos
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateId = `${year}-${month}-${day}`;
                
                const dayName = dayNames[date.getDay()];
                const monthName = monthNames[date.getMonth()];
                const dayNumber = date.getDate();
                
                let title;
                if (i === 1) {
                    title = `Mañana - ${dayNumber} ${monthName}`;
                } else {
                    title = `${dayName} - ${dayNumber} ${monthName}`;
                }
                
                dates.push({ id: dateId, title: title });
                
                if (dates.length >= 6) break;
            }
            
            return dates;
        }
        
        // Construir mensaje con configuración progresiva
        const flowMessage = {
            messaging_product: "whatsapp",
            to: testPhone,
            type: "interactive",
            interactive: {
                type: "flow",
                header: {
                    type: "text",
                    text: "Agenda tu Cita ✨"
                },
                body: {
                    text: "Te voy a ayudar a agendar tu cita de manera rápida y sencilla. Solo necesito algunos datos:"
                },
                footer: {
                    text: "Joyería Rimer - Cartagena y Santa Marta"
                },
                action: {
                    name: "flow",
                    parameters: {
                        flow_message_version: "3",
                        flow_token: `appointment_${Date.now()}_${testPhone.replace('+', '')}`,
                        flow_id: "24509326838732458",
                        flow_cta: "Agendar Cita",
                        flow_action: "navigate",
                        flow_action_payload: {
                            screen: "APPOINTMENT",
                            data: {
                                department: [
                                    {"id": "tasacion", "title": "💎 Tasación de Joyas"},
                                    {"id": "diseño_personalizado", "title": "✨ Diseño Personalizado"},
                                    {"id": "reparacion", "title": "🔧 Reparación de Joyas"},
                                    {"id": "compra_presencial", "title": "🛍️ Asesoría de Compra"},
                                    {"id": "limpieza", "title": "✨ Limpieza y Mantenimiento"}
                                ],
                                location: [
                                    {"id": "cartagena", "title": "📍 Cartagena"},
                                    {"id": "santa_marta", "title": "📍 Santa Marta"}
                                ],
                                is_location_enabled: true,
                                date: generateAvailableDates(),
                                is_date_enabled: false, // ← Se activa después del servicio
                                time: [
                                    {"id": "09:00", "title": "9:00 AM", "enabled": true},
                                    {"id": "10:00", "title": "10:00 AM", "enabled": true},
                                    {"id": "11:00", "title": "11:00 AM", "enabled": true},
                                    {"id": "14:00", "title": "2:00 PM", "enabled": true},
                                    {"id": "15:00", "title": "3:00 PM", "enabled": true},
                                    {"id": "16:00", "title": "4:00 PM", "enabled": true}
                                ],
                                is_time_enabled: false // ← Se activa después de la fecha
                            }
                        }
                    }
                }
            }
        };

        console.log('\n📤 Enviando Flow con configuración progresiva...');
        
        await whatsapp.sendMessageAPI(flowMessage);
        console.log('✅ Flow enviado exitosamente');
        
        console.log('\n🎯 Configuración progresiva:');
        console.log('   ✅ Servicios: Siempre habilitados');
        console.log('   ✅ Sedes: Siempre habilitadas');
        console.log('   ⚪ Fechas: Se habilitan después de seleccionar servicio');
        console.log('   ⚪ Horarios: Se habilitan después de seleccionar fecha');
        
        console.log('\n📋 Verifica en WhatsApp que:');
        console.log('1. Puedas seleccionar un servicio sin error');
        console.log('2. Puedas seleccionar una sede sin error');
        console.log('3. Las fechas se habiliten después del servicio');
        console.log('4. Los horarios se habiliten después de la fecha');
        console.log('5. Puedas navegar a la siguiente pantalla');
        
    } catch (error) {
        console.error('❌ Error enviando Flow:', error);
        
        if (error.response && error.response.data) {
            console.error('📄 Respuesta de la API:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function main() {
    console.log('🚀 Prueba de Flow con configuración progresiva mejorada');
    console.log('=' .repeat(60));
    
    await testProgressiveFlow();
}

if (require.main === module) {
    main().catch(console.error);
}