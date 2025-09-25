const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

/**
 * Script de diagnóstico para verificar conectividad a MongoDB Atlas
 */
async function diagnosticMongoDB() {
    console.log('🔍 Diagnóstico de Conectividad MongoDB Atlas');
    console.log('=' .repeat(50));
    
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
        console.error('❌ Variable MONGO_URI no está definida en .env');
        return false;
    }
    
    console.log('📋 URI de conexión configurada: ✅');
    console.log('🔗 Host detectado:', mongoUri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Servidor local');
    
    // Configurar timeout más corto para diagnóstico
    const connectionOptions = {
        serverSelectionTimeoutMS: 5000, // 5 segundos
        socketTimeoutMS: 10000, // 10 segundos
        connectTimeoutMS: 10000, // 10 segundos
        maxPoolSize: 1,
        bufferCommands: false
    };
    
    console.log('\n🔄 Intentando conectar a MongoDB...');
    console.log('⏱️ Timeout configurado: 5 segundos');
    
    try {
        const startTime = Date.now();
        
        // Intentar conexión
        await mongoose.connect(mongoUri, connectionOptions);
        
        const connectionTime = Date.now() - startTime;
        console.log(`✅ Conectado exitosamente en ${connectionTime}ms`);
        
        // Verificar estado de la conexión
        const dbState = mongoose.connection.readyState;
        const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        console.log(`📊 Estado de conexión: ${stateNames[dbState]} (${dbState})`);
        
        // Probar una operación simple
        console.log('\n🧪 Probando operación de base de datos...');
        const testResult = await mongoose.connection.db.admin().ping();
        console.log('✅ Ping a la base de datos: Exitoso');
        
        // Listar colecciones disponibles
        console.log('\n📚 Colecciones disponibles:');
        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length > 0) {
            collections.forEach(col => {
                console.log(`  📄 ${col.name}`);
            });
        } else {
            console.log('  📭 No hay colecciones creadas aún');
        }
        
        // Cerrar conexión
        await mongoose.disconnect();
        console.log('\n✅ Conexión cerrada correctamente');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Error de conexión:', error.message);
        
        // Diagnóstico detallado del error
        if (error.message.includes('ENOTFOUND')) {
            console.error('🔍 Diagnóstico: Problema de DNS - No se puede resolver el hostname');
            console.error('💡 Posibles causas:');
            console.error('   • Sin conexión a internet');
            console.error('   • Firewall bloqueando conexiones');
            console.error('   • DNS no puede resolver mongodb.net');
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
            console.error('🔍 Diagnóstico: Timeout de conexión');
            console.error('💡 Posibles causas:');
            console.error('   • Firewall/antivirus bloqueando puerto 27017');
            console.error('   • Red corporativa con restricciones');
            console.error('   • Latencia alta de internet');
        } else if (error.message.includes('Authentication failed')) {
            console.error('🔍 Diagnóstico: Error de autenticación');
            console.error('💡 Posibles causas:');
            console.error('   • Usuario/contraseña incorrectos');
            console.error('   • Usuario no tiene permisos en la base de datos');
            console.error('   • IP no está en whitelist de MongoDB Atlas');
        } else if (error.message.includes('buffering timed out')) {
            console.error('🔍 Diagnóstico: Timeout de buffering');
            console.error('💡 Posibles causas:');
            console.error('   • Conexión establecida pero operaciones muy lentas');
            console.error('   • Problema de latencia con MongoDB Atlas');
        }
        
        console.error('\n🔧 Recomendaciones:');
        console.error('   1. Verificar conexión a internet');
        console.error('   2. Revisar configuración de firewall');
        console.error('   3. Comprobar whitelist de IPs en MongoDB Atlas');
        console.error('   4. Usar test-integration-mock.js para desarrollo sin BD');
        
        try {
            await mongoose.disconnect();
        } catch (disconnectError) {
            // Ignorar errores de desconexión
        }
        
        return false;
    }
}

async function quickNetworkTest() {
    console.log('\n🌐 Test rápido de conectividad de red...');
    
    try {
        // Test usando fetch a un endpoint público
        const response = await fetch('https://www.google.com', { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
            console.log('✅ Conectividad a internet: OK');
            return true;
        } else {
            console.log('⚠️ Conectividad a internet: Limitada');
            return false;
        }
    } catch (error) {
        console.error('❌ Sin conectividad a internet');
        return false;
    }
}

async function main() {
    console.log('🏥 Diagnóstico Completo del Sistema\n');
    
    // Test de red básico
    const networkOk = await quickNetworkTest();
    
    if (!networkOk) {
        console.error('\n❌ Sin conectividad básica. Revisar conexión a internet.');
        console.log('\n💡 Para desarrollo offline usar: node tests/flow/test-integration-mock.js');
        return;
    }
    
    // Test de MongoDB
    const mongoOk = await diagnosticMongoDB();
    
    console.log('\n📋 RESUMEN:');
    console.log(`🌐 Internet: ${networkOk ? '✅ OK' : '❌ Fallo'}`);
    console.log(`🗄️ MongoDB: ${mongoOk ? '✅ OK' : '❌ Fallo'}`);
    
    if (mongoOk) {
        console.log('\n🎉 ¡Sistema listo! Puedes ejecutar:');
        console.log('   node tests/flow/test-master-integration.js');
    } else {
        console.log('\n⚠️ Problema con MongoDB. Para desarrollo usar:');
        console.log('   node tests/flow/test-integration-mock.js');
        console.log('\n🔧 O corregir la conectividad y reintentar.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { diagnosticMongoDB, quickNetworkTest };