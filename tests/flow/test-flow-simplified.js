const dotenv = require('dotenv');
dotenv.config();

const whatsapp = require('./api/whatsapp');

/**
 * Prueba del Flow SIN eventos data_exchange que pueden causar errores
 * Versión simplificada que envía todos los datos estáticos
 */
async function testSimplifiedFlow() {
    console.log('🧪 Probando Flow SIMPLIFICADO sin data_exchange...');
    
    const testPhone = '573104202571';
    
    try {
        // Función para generar fechas
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
        
        // Flow simplificado con TODOS los campos habilitados desde el inicio
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
                    text: "Completa los datos para agendar tu cita:"
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
                                // Servicios - SIEMPRE habilitados
                                department: [
                                    {"id": "tasacion", "title": "💎 Tasación de Joyas"},
                                    {"id": "reparacion", "title": "🔧 Reparación de Joyas"}
                                ],
                                
                                // Sedes - SIEMPRE habilitadas
                                location: [
                                    {"id": "cartagena", "title": "📍 Cartagena"},
                                    {"id": "santa_marta", "title": "📍 Santa Marta"}
                                ],
                                is_location_enabled: true,
                                
                                // Fechas - SIEMPRE habilitadas
                                date: generateAvailableDates(),
                                is_date_enabled: true,
                                
                                // Horarios - SIEMPRE habilitados
                                time: [
                                    {"id": "09:00", "title": "9:00 AM", "enabled": true},
                                    {"id": "10:00", "title": "10:00 AM", "enabled": true},
                                    {"id": "14:00", "title": "2:00 PM", "enabled": true},
                                    {"id": "15:00", "title": "3:00 PM", "enabled": true}
                                ],
                                is_time_enabled: true
                            }
                        }
                    }
                }
            }
        };

        console.log('\n📤 Enviando Flow SIMPLIFICADO...');
        console.log('🔍 Características:');
        console.log('   ✅ Solo 2 servicios (Tasación, Reparación)');
        console.log('   ✅ Solo 2 sedes (Cartagena, Santa Marta)');
        console.log('   ✅ Fechas disponibles');
        console.log('   ✅ 4 horarios básicos');
        console.log('   ✅ TODOS los campos habilitados desde el inicio');
        console.log('   ❌ SIN eventos data_exchange que causan errores');
        
        await whatsapp.sendMessageAPI(flowMessage);
        console.log('\n✅ Flow SIMPLIFICADO enviado exitosamente');
        
        console.log('\n📋 Ahora verifica en WhatsApp:');
        console.log('1. ¿Puedes seleccionar un servicio sin error?');
        console.log('2. ¿Puedes seleccionar una sede sin error?'); 
        console.log('3. ¿Puedes seleccionar una fecha sin error?');
        console.log('4. ¿Puedes seleccionar un horario sin error?');
        console.log('5. ¿Puedes hacer clic en "Continuar" y avanzar?');
        
    } catch (error) {
        console.error('❌ Error enviando Flow:', error);
        
        if (error.response && error.response.data) {
            console.error('📄 Respuesta de la API:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function main() {
    console.log('🚀 Prueba de Flow SIMPLIFICADO sin eventos complejos');
    console.log('=' .repeat(60));
    console.log('💡 Esta versión evita los eventos data_exchange que causan errores');
    console.log('💡 Todos los campos están habilitados desde el inicio');
    console.log('💡 Solo opciones básicas para eliminar variables');
    
    await testSimplifiedFlow();
}

if (require.main === module) {
    main().catch(console.error);
}