// add-products.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

// Reutilizamos el esquema del producto definido en index.js
const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    material: String,
    gem: String,
    description: String,
    imageUrl: String
});

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
    {
        name: "Anillo Solitario Clásico",
        category: "compromiso",
        material: "Oro Blanco 18k",
        gem: "Diamante redondo de 0.75ct, certificación GIA",
        description: "Un diseño atemporal que simboliza el amor eterno. El diamante central se eleva con elegancia para capturar la máxima luz.",
        imageUrl: "https://i.imgur.com/TuVo1iX.jpeg" // URL de ejemplo
    },
    {
        name: "Aro de Matrimonio Eternity",
        category: "matrimonio",
        material: "Platino",
        gem: "Banda completa de diamantes pequeños (1.5ct total)",
        description: "Una banda deslumbrante que representa un amor sin fin, con diamantes que rodean todo el aro.",
        imageUrl: "https://i.imgur.com/Sna42aU.jpeg" // URL de ejemplo
    },
    {
        name: "Anillo de Zafiro y Diamantes",
        category: "compromiso",
        material: "Oro Amarillo 18k",
        gem: "Zafiro azul ovalado de 1.2ct rodeado por un halo de diamantes",
        description: "Una pieza majestuosa que combina el intenso azul del zafiro con el brillo de los diamantes, ideal para una propuesta inolvidable.",
        imageUrl: "https://i.imgur.com/b9o2wJ4.jpeg" // URL de ejemplo
    }
];

async function populateDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB para poblar datos.');
        await Product.deleteMany({}); // Borra los productos existentes para evitar duplicados
        await Product.insertMany(sampleProducts);
        console.log('✅ ¡Base de datos poblada con 3 productos de ejemplo!');
    } catch (error) {
        console.error('❌ Error al poblar la base de datos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB.');
    }
}

populateDB();