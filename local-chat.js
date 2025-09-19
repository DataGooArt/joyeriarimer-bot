// local-chat.js

require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');

// Importamos el módulo principal de nuestro bot
const bot = require('./index.js');

// Sobrescribimos las funciones de envío con nuestras versiones falsas (mocks)
bot.sendTextMessage = async (to, text) => {
    console.log(`\n🤖 Joyería Rimer: ${text}\n`);
};
bot.sendImageMessage = async (to, imageUrl, caption) => {
    console.log(`\n🤖 Joyería Rimer: ${caption}`);
    console.log(`   (Imagen: ${imageUrl})\n`);
};
bot.sendProductListMessage = async (to, products, bodyText, buttonText) => {
    console.log(`\n🤖 Joyería Rimer: ${bodyText}`);
    console.log(`   [Lista Interactiva: ${buttonText}]`);
    if (products && products.length > 0) {
        products.forEach(p => console.log(`   - ${p.name}`));
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

            // Llama a la lógica principal del bot con el mensaje del usuario
            await bot.handleSmartReply(FAKE_PHONE_NUMBER, line);

            rl.prompt();
        });
    } catch (error) {
        console.error('❌ Error al iniciar el simulador:', error);
        process.exit(1);
    }
}

startChat();