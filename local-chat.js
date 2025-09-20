// local-chat.js

require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');

// Importamos el módulo principal de nuestro bot
const { handleSmartReply, handleProductSelection } = require('./core/bot.js');
const whatsapp = require('./api/whatsapp.js');

// Variable para guardar los productos de la última lista mostrada
let lastListedProducts = [];

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
        console.log('--- INICIO DEL SIMULADOR DE CHAT ---');
        console.log('Escribe tu mensaje y presiona Enter. Escribe "salir" para terminar.');

        rl.prompt();

        rl.on('line', async (line) => {
            if (line.toLowerCase() === 'salir') {
                console.log('👋 ¡Adiós!');
                await mongoose.disconnect();
                process.exit(0);
            }

            // Simulación de selección de lista
            if (line.toLowerCase().startsWith('select ')) {
                const selectionIndex = parseInt(line.split(' ')[1], 10) - 1;
                if (lastListedProducts && lastListedProducts[selectionIndex]) {
                    const selectedProduct = lastListedProducts[selectionIndex];
                    console.log(`\n(Simulando selección del producto: ${selectedProduct.name})`);
                    await handleProductSelection(FAKE_PHONE_NUMBER, selectedProduct._id);
                } else {
                    console.log('\nSelección inválida. Por favor, escribe "select" seguido del número de la lista.\n');
                }
            } else {
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