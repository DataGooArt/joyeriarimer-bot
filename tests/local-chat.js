// local-chat.js

require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');

// Importamos el módulo principal de nuestro bot
const bot = require('./core/bot.js');
const { 
    handleSmartReply, 
    handleProductSelection, 
    handleTermsAcceptance, 
    handleCategorySelection,
    handleProductDetailRequest,
    handleProductAction,
    getModel, 
    Customer, 
    ChatSession, 
    MessageLog 
} = bot;
const whatsapp = require('./api/whatsapp.js');

// Variable para guardar los productos de la última lista mostrada
let lastListedProducts = [];

// Función para limpiar datos de prueba
async function cleanupTestData() {
    try {
        console.log('🧹 Limpiando datos de prueba anteriores...');
        
        // Eliminar cliente de prueba
        const deletedCustomers = await Customer.deleteMany({ phone: { $regex: '1234567890' } });
        console.log(`   - Clientes eliminados: ${deletedCustomers.deletedCount}`);
        
        // Eliminar sesiones de prueba
        const deletedSessions = await ChatSession.deleteMany({ phone: { $regex: '1234567890' } });
        console.log(`   - Sesiones eliminadas: ${deletedSessions.deletedCount}`);
        
        // Eliminar logs de prueba
        const deletedLogs = await MessageLog.deleteMany({});
        console.log(`   - Logs eliminados: ${deletedLogs.deletedCount}`);
        
        console.log('✅ Datos de prueba limpiados. Iniciando con cliente fresco...\n');
    } catch (error) {
        console.log('⚠️ Error limpiando datos de prueba:', error.message);
    }
}

// Función para limpiar datos de un cliente específico
async function cleanupCustomerData(phoneNumber) {
    try {
        console.log(`🧹 Limpiando datos del cliente ${phoneNumber}...`);
        
        // Eliminar cliente específico
        const deletedCustomers = await Customer.deleteMany({ phone: phoneNumber });
        console.log(`   - Clientes eliminados: ${deletedCustomers.deletedCount}`);
        
        // Eliminar sesiones específicas
        const deletedSessions = await ChatSession.deleteMany({ phone: phoneNumber });
        console.log(`   - Sesiones eliminadas: ${deletedSessions.deletedCount}`);
        
        // Eliminar logs específicos
        const deletedLogs = await MessageLog.deleteMany({ phone: phoneNumber });
        console.log(`   - Logs eliminados: ${deletedLogs.deletedCount}`);
        
        console.log('✅ Datos del cliente limpiados.\n');
        return { customers: deletedCustomers.deletedCount, sessions: deletedSessions.deletedCount, logs: deletedLogs.deletedCount };
    } catch (error) {
        console.log('⚠️ Error limpiando datos del cliente:', error.message);
        throw error;
    }
}

// Sobrescribimos las funciones de envío con nuestras versiones falsas (mocks)
whatsapp.sendTextMessage = async (to, text) => {
    console.log(`\n🤖 Joyería Rimer: ${text}\n`);
};
whatsapp.sendImageMessage = async (to, imageUrl, caption) => {
    console.log(`\n🤖 Joyería Rimer: ${caption}`);
    console.log(`   (Imagen: ${imageUrl})\n`);
};
whatsapp.sendProductListMessage = async (to, products, bodyText, buttonText) => {
    console.log(`\n🤖 Joyería Rimer: ${bodyText}`);
    console.log(`   [Lista Interactiva: ${buttonText}]`);
    lastListedProducts = products; // Guardamos los productos
    if (products && products.length > 0) {
        // Mostramos la lista numerada para que el usuario pueda seleccionar
        products.forEach((p, index) => console.log(`   ${index + 1}. ${p.name}`));
    }
    console.log('');
};
whatsapp.sendFlowMessage = async (to, flowId, cta, screenId, headerText, bodyText) => {
    console.log('\n--- SIMULACIÓN DE ENVÍO DE FLOW ---');
    console.log(`   Header: ${headerText}`);
    console.log(`   Body: ${bodyText}`);
    console.log(`   Botón (CTA): "${cta}"`);
    console.log('-------------------------------------\n');
};

// Simular los nuevos métodos de categorías y productos
whatsapp.sendCategoriesMessage = async (to) => {
    console.log('\n🤖 Joyería Rimer: 💎 ¡Bienvenido a Joyería Rimer! ¿Qué tipo de joya te interesa?');
    console.log('   [Botones Disponibles]');
    console.log('   1. 💍 Anillos (escribe: cat_anillos)');
    console.log('   2. 🔗 Cadenas & Collares (escribe: cat_cadenas)');
    console.log('   3. 💎 Aretes (escribe: cat_aretes)\n');
};

whatsapp.sendCategoryProducts = async (to, category) => {
    const categories = {
        'anillos': {
            title: '💍 ANILLOS MÁS POPULARES',
            products: ['prod_solitario', 'prod_halo', 'prod_eternidad']
        },
        'cadenas': {
            title: '🔗 CADENAS & COLLARES MÁS POPULARES', 
            products: ['prod_tenis', 'prod_corazon', 'prod_clasica']
        },
        'aretes': {
            title: '💎 ARETES MÁS POPULARES',
            products: ['prod_boton', 'prod_colgante', 'prod_aro']
        }
    };
    
    const categoryData = categories[category];
    if (categoryData) {
        console.log(`\n🤖 Joyería Rimer: ${categoryData.title}`);
        console.log('   [Productos Disponibles]');
        categoryData.products.forEach((prod, index) => {
            console.log(`   ${index + 1}. ${prod} (escribe: ${prod})`);
        });
        console.log('');
    }
};

whatsapp.sendProductDetail = async (to, productId) => {
    const productNames = {
        'prod_solitario': 'Anillo Solitario Clásico',
        'prod_halo': 'Anillo de Compromiso Halo',
        'prod_eternidad': 'Anillo Eternidad',
        'prod_tenis': 'Cadena Tenis Diamante',
        'prod_corazon': 'Collar Corazón Oro 18k',
        'prod_clasica': 'Cadena Clásica Oro',
        'prod_boton': 'Aretes Botón Diamante',
        'prod_colgante': 'Aretes Colgantes Perla',
        'prod_aro': 'Aretes Aro Oro 18k'
    };
    
    const productName = productNames[productId] || productId;
    console.log(`\n🤖 Joyería Rimer: Detalles de ${productName}`);
    console.log('   (Imagen del producto)');
    console.log('   [Acciones Disponibles]');
    console.log('   1. 💰 Cotizar (escribe: cotizar_producto)');
    console.log('   2. 📅 Agendar Cita (escribe: agendar_cita)');
    console.log('   3. 👀 Ver Más (escribe: ver_mas_productos)\n');
};

const MONGO_URI = process.env.MONGO_URI;
const FAKE_PHONE_NUMBER = '1234567890'; // Usamos un número falso para la prueba

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Cliente > '
});

async function startChat() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB para la simulación.');
        
        // LIMPIAR DATOS DE PRUEBA
        await cleanupTestData();
        
        console.log('--- INICIO DEL SIMULADOR DE CHAT ---');
        console.log('Escribe tu mensaje y presiona Enter. Escribe "salir" para terminar.');

        rl.prompt();

        rl.on('line', async (line) => {
            if (line.toLowerCase() === 'salir') {
                console.log('👋 ¡Adiós!');
                await mongoose.disconnect();
                process.exit(0);
            }

            // Intenta interpretar la entrada como un número de selección de la lista
            const selectionIndex = parseInt(line.trim(), 10) - 1;
            const isNumericSelection = !isNaN(selectionIndex) && selectionIndex >= 0;

            // Simulación de selección de lista
            if (isNumericSelection && lastListedProducts && lastListedProducts[selectionIndex]) {
                const selectedProduct = lastListedProducts[selectionIndex];
                console.log(`\n(Simulando selección del producto: ${selectedProduct.name})`);
                await handleProductSelection(FAKE_PHONE_NUMBER, selectedProduct._id);
                // Limpiamos la lista para que no se pueda volver a seleccionar por accidente
                lastListedProducts = [];
            } else if (line.toLowerCase().startsWith('select ')) {
                // Mantenemos la lógica de "select X" como alternativa
                console.log('\nSelección inválida o la lista ha expirado. Por favor, pide el catálogo de nuevo si lo necesitas.\n');
            } else if (line.trim().toLowerCase() === 'aceptar y continuar') {
                console.log('\n(Simulando clic en el botón "Aceptar y continuar")...');
                // Llamar directamente a la función de aceptación de términos
                await handleTermsAcceptance(FAKE_PHONE_NUMBER);
                // En producción, esto iniciaría el siguiente paso. Lo simulamos aquí.
                await handleSmartReply(FAKE_PHONE_NUMBER, "El usuario acaba de aceptar los términos.");
            } else if (line.toLowerCase().includes('aceptar y continuar') || line.toLowerCase().includes('acepto')) {
                console.log('\n(Simulando clic en el botón "Aceptar y continuar")...');
                // Usar handleSmartReply con un texto que active los patrones de aceptación
                await handleSmartReply(FAKE_PHONE_NUMBER, 'acepto');
            } 
            // Manejar botones de categorías
            else if (line.startsWith('cat_')) {
                console.log(`\n(Simulando clic en categoría: ${line})`);
                await handleCategorySelection(FAKE_PHONE_NUMBER, line);
            }
            // Manejar botones de productos
            else if (line.startsWith('prod_')) {
                console.log(`\n(Simulando clic en producto: ${line})`);
                await handleProductDetailRequest(FAKE_PHONE_NUMBER, line);
            }
            // Manejar botones de acciones
            else if (['cotizar_producto', 'agendar_cita', 'ver_mas_productos'].includes(line)) {
                console.log(`\n(Simulando clic en acción: ${line})`);
                await handleProductAction(FAKE_PHONE_NUMBER, line);
            }
            else {
                // Llama a la lógica principal del bot con el mensaje del usuario
                await handleSmartReply(FAKE_PHONE_NUMBER, line);
            }

            rl.prompt();
        });
    } catch (error) {
        console.error('❌ Error al iniciar el simulador:', error);
        process.exit(1);
    }
}

startChat();