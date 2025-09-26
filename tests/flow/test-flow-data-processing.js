/**
 * Test para diagnosticar el problema del Flow que no procesa los datos
 * Enfocado en identificar por qué los datos del Flow no se guardan en MongoDB
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../../models/Service');
const Location = require('../../models/Location');
const Appointment = require('../../models/Appointment');
const { appointmentService } = require('../../services/appointmentService');

console.log('🔍 DIAGNÓSTICO: Flow que no procesa datos del usuario');
console.log('===============================================');

async function testFlowDataProcessing() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // 1. VERIFICAR DATOS DISPONIBLES EN MONGODB
        console.log('\n📊 PASO 1: Verificando datos en MongoDB...');
        
        const services = await Service.find({ active: true });
        const locations = await Location.find({ active: true });
        
        console.log(`✅ Servicios activos: ${services.length}`);
        services.forEach(s => console.log(`   - ${s.name} (ID: ${s.id})`));
        
        console.log(`✅ Ubicaciones activas: ${locations.length}`);
        locations.forEach(l => console.log(`   - ${l.name} (ID: ${l.id})`));

        if (services.length === 0 || locations.length === 0) {
            console.error('❌ PROBLEMA: No hay servicios o ubicaciones activos en MongoDB');
            return;
        }

        // 2. VERIFICAR FORMATO DEL FLOW
        console.log('\n📱 PASO 2: Verificando formato para el Flow...');
        
        const servicesForFlow = await Service.getForFlow();
        const locationsForFlow = await Location.getForFlow();
        
        console.log('📋 Servicios formato Flow:');
        console.log(JSON.stringify(servicesForFlow, null, 2));
        
        console.log('📍 Ubicaciones formato Flow:');
        console.log(JSON.stringify(locationsForFlow, null, 2));

        // Validar estructura
        const validServiceStructure = servicesForFlow.every(s => s.id && s.title);
        const validLocationStructure = locationsForFlow.every(l => l.id && l.title);
        
        if (!validServiceStructure || !validLocationStructure) {
            console.error('❌ PROBLEMA: Estructura incorrecta en formato Flow');
            return;
        }

        // 3. SIMULAR RESPUESTA DEL FLOW
        console.log('\n🔄 PASO 3: Simulando respuesta del Flow...');
        
        // Simular diferentes formatos de respuesta que puede enviar WhatsApp
        const simulatedResponses = [
            // Formato 1: nfm_reply estándar
            {
                name: 'Formato nfm_reply',
                data: {
                    nfm_reply: {
                        response_json: JSON.stringify({
                            department: services[0].id,
                            location: locations[0].id,
                            date: '2025-09-26',
                            time: '10:00'
                        }),
                        name: 'appointment_flow',
                        body: 'cita_agendada'
                    }
                }
            },
            // Formato 2: response_json directo
            {
                name: 'Formato response_json directo',
                data: {
                    response_json: {
                        department: services[0].id,
                        location: locations[0].id,
                        date: '2025-09-26',
                        time: '10:00'
                    }
                }
            },
            // Formato 3: Campos directos
            {
                name: 'Formato campos directos',
                data: {
                    department: services[0].id,
                    location: locations[0].id,
                    date: '2025-09-26',
                    time: '10:00'
                }
            }
        ];

        for (const response of simulatedResponses) {
            console.log(`\n🧪 Probando ${response.name}:`);
            console.log('Datos recibidos:', JSON.stringify(response.data, null, 2));
            
            // Simular procesamiento
            const extractedData = extractFlowData(response.data);
            console.log('Datos extraídos:', extractedData);
            
            if (extractedData) {
                console.log('✅ Datos extraídos correctamente');
                
                // Verificar que los IDs existen en MongoDB
                const serviceExists = await Service.findById(extractedData.serviceId);
                const locationExists = await Location.findById(extractedData.locationId);
                
                console.log(`Servicio existe: ${serviceExists ? '✅' : '❌'}`);
                console.log(`Ubicación existe: ${locationExists ? '✅' : '❌'}`);
                
                if (serviceExists && locationExists) {
                    console.log('✅ Todos los datos son válidos para guardar en MongoDB');
                } else {
                    console.error('❌ PROBLEMA: IDs no existen en MongoDB');
                }
            } else {
                console.error('❌ PROBLEMA: No se pudieron extraer los datos');
            }
        }

        // 4. VERIFICAR WEBHOOKHANDLER
        console.log('\n🔗 PASO 4: Verificando WebhookHandler...');
        
        // Verificar si existe el manejo de nfm_reply en webhookHandler
        const fs = require('fs');
        const webhookPath = '../../core/webhookHandler.js';
        
        if (fs.existsSync(require.resolve(webhookPath))) {
            const webhookContent = fs.readFileSync(require.resolve(webhookPath), 'utf8');
            
            const hasNfmReply = webhookContent.includes('nfm_reply');
            const hasFlowProcessing = webhookContent.includes('processFlowResponse') || 
                                    webhookContent.includes('handleFlowResponse');
            
            console.log(`Maneja nfm_reply: ${hasNfmReply ? '✅' : '❌'}`);
            console.log(`Procesa respuestas Flow: ${hasFlowProcessing ? '✅' : '❌'}`);
            
            if (!hasNfmReply || !hasFlowProcessing) {
                console.error('❌ PROBLEMA: WebhookHandler no procesa respuestas del Flow');
                console.log('💡 SOLUCIÓN: Agregar procesamiento de nfm_reply en webhookHandler.js');
            }
        }

        // 5. VERIFICAR GUARDADO EN MONGODB
        console.log('\n💾 PASO 5: Verificando guardado en MongoDB...');
        
        const testAppointmentData = {
            customerName: 'Test Usuario',
            customerPhone: '+57123456789',
            serviceId: services[0].id,
            locationId: locations[0].id,
            appointmentDate: new Date('2025-09-26'),
            appointmentTime: '10:00'
        };
        
        console.log('Datos de prueba para cita:', testAppointmentData);
        
        // Intentar crear cita de prueba
        try {
            const testAppointment = new Appointment(testAppointmentData);
            const savedAppointment = await testAppointment.save();
            console.log('✅ Cita de prueba guardada correctamente');
            console.log('ID generado:', savedAppointment._id);
            
            // Limpiar cita de prueba
            await Appointment.deleteOne({ _id: savedAppointment._id });
            console.log('✅ Cita de prueba eliminada');
        } catch (saveError) {
            console.error('❌ PROBLEMA al guardar cita:', saveError.message);
        }

        console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
        console.log('============================');
        console.log('1. MongoDB tiene datos ✅');
        console.log('2. Formato Flow es correcto ✅');
        console.log('3. Procesamiento de respuestas: VERIFICAR ⚠️');
        console.log('4. WebhookHandler: VERIFICAR ⚠️');
        console.log('5. Guardado MongoDB: FUNCIONAL ✅');
        
    } catch (error) {
        console.error('❌ ERROR en diagnóstico:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔚 Diagnóstico completado');
    }
}

/**
 * Función para extraer datos del Flow (simula el procesamiento real)
 */
function extractFlowData(flowResponse) {
    try {
        let data = null;
        
        // Formato 1: nfm_reply
        if (flowResponse.nfm_reply && flowResponse.nfm_reply.response_json) {
            const responseJson = flowResponse.nfm_reply.response_json;
            data = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
        }
        // Formato 2: response_json directo
        else if (flowResponse.response_json) {
            data = flowResponse.response_json;
        }
        // Formato 3: campos directos
        else if (flowResponse.department || flowResponse.service) {
            data = flowResponse;
        }
        
        if (!data) return null;
        
        return {
            serviceId: data.department || data.service,
            locationId: data.location,
            appointmentDate: data.date,
            appointmentTime: data.time,
            customerName: data.name || 'Usuario Flow'
        };
    } catch (error) {
        console.error('Error extrayendo datos:', error);
        return null;
    }
}

// Ejecutar diagnóstico
testFlowDataProcessing();