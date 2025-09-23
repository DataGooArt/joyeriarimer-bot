const axios = require('axios');

/**
 * Script para diagnosticar el problema 405 en el endpoint
 */

async function testEndpoint() {
    const baseUrl = 'https://bot.tallerdejoyeriarimer.com';
    
    console.log('🔍 Diagnóstico del endpoint WhatsApp Flow\n');
    
    // Test 1: GET al webhook (verificación)
    console.log('📡 Test 1: GET /webhook (verificación Meta)...');
    try {
        const response = await axios.get(`${baseUrl}/webhook`, {
            params: {
                'hub.mode': 'subscribe',
                'hub.challenge': 'test-challenge-12345',
                'hub.verify_token': 'joyeria-rimer-bot'
            },
            timeout: 10000
        });
        console.log(`✅ GET /webhook: ${response.status} - ${response.data}`);
    } catch (error) {
        console.log(`❌ GET /webhook: ${error.response?.status} - ${error.message}`);
        if (error.response?.data) {
            console.log('📄 Response body:', error.response.data);
        }
    }
    
    // Test 2: POST al webhook (datos de WhatsApp)
    console.log('\n📡 Test 2: POST /webhook (simulando WhatsApp)...');
    try {
        const testPayload = {
            object: 'whatsapp_business_account',
            entry: [{
                id: 'test',
                changes: [{
                    value: {
                        messages: [{
                            from: '573104202571',
                            text: { body: 'test' },
                            type: 'text'
                        }]
                    }
                }]
            }]
        };
        
        const response = await axios.post(`${baseUrl}/webhook`, testPayload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        console.log(`✅ POST /webhook: ${response.status}`);
    } catch (error) {
        console.log(`❌ POST /webhook: ${error.response?.status} - ${error.message}`);
        if (error.response?.status === 405) {
            console.log('⚠️  Error 405: El endpoint no acepta POST requests');
        }
    }
    
    // Test 3: Verificar si hay otros endpoints
    console.log('\n📡 Test 3: Otros endpoints...');
    const endpoints = ['/', '/health', '/status'];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${baseUrl}${endpoint}`, { timeout: 5000 });
            console.log(`✅ GET ${endpoint}: ${response.status}`);
        } catch (error) {
            console.log(`❌ GET ${endpoint}: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 4: Verificar headers del servidor
    console.log('\n📡 Test 4: Headers del servidor...');
    try {
        const response = await axios.head(`${baseUrl}/`, { timeout: 5000 });
        console.log('📋 Headers del servidor:');
        Object.entries(response.headers).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
        });
    } catch (error) {
        console.log('❌ No se pudieron obtener headers');
    }
}

if (require.main === module) {
    testEndpoint().catch(console.error);
}