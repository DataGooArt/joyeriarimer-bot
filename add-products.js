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
    imageUrl: String,
    price: Number,
    isArtisanal: { type: Boolean, default: true }
});
// Añadimos el índice de texto aquí también para que se cree al ejecutar el script
productSchema.index({ name: 'text', description: 'text', category: 'text', material: 'text', gem: 'text' });

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
    {
        name: "Anillo Solitario Clásico",
        category: "compromiso",
        material: "Oro Blanco 18k",
        gem: "Diamante redondo de 0.75ct, certificación GIA",
        description: "Un diseño atemporal que simboliza el amor eterno. Realizado artesanalmente para capturar la máxima luz.",
        imageUrl: "https://i.imgur.com/TuVo1iX.jpeg", // URL de ejemplo
        price: 2500,
        isArtisanal: true
    },
    {
        name: "Aro de Matrimonio Eternity",
        category: "matrimonio",
        material: "Platino",
        gem: "Banda completa de diamantes pequeños (1.5ct total)",
        description: "Una banda deslumbrante que representa un amor sin fin. Cada diamante es engastado a mano por nuestros artesanos.",
        imageUrl: "https://i.imgur.com/Sna42aU.jpeg", // URL de ejemplo
        price: 3200,
        isArtisanal: true
    },
    {
        name: "Anillo de Zafiro y Diamantes",
        category: "compromiso",
        material: "Oro Amarillo 18k",
        gem: "Zafiro azul ovalado de 1.2ct rodeado por un halo de diamantes",
        description: "Una pieza majestuosa que combina el intenso azul del zafiro con el brillo de los diamantes, ideal para una propuesta inolvidable.",
        imageUrl: "https://i.imgur.com/b9o2wJ4.jpeg", // URL de ejemplo
        price: 1850,
        isArtisanal: true
    },
    {
        name: "Pulsera de Eslabones de Oro",
        category: "pulseras",
        material: "Oro Amarillo 18k",
        gem: "N/A",
        description: "Una pulsera robusta y elegante, con eslabones sólidos pulidos a mano. Perfecta para uso diario o para ocasiones especiales.",
        imageUrl: "https://i.imgur.com/Lp5gWjR.jpeg", // Placeholder image
        price: 950,
        isArtisanal: true
    },
    {
        name: "Cadena con Nombre Personalizado",
        category: "cadenas",
        material: "Oro Rosa 18k",
        gem: "Opcional: pequeño diamante",
        description: "Una pieza única y personal. Creamos artesanalmente tu nombre o una palabra especial en una delicada cadena de oro rosa. El regalo perfecto.",
        imageUrl: "https://i.imgur.com/9hC7f4g.jpeg", // Placeholder image
        price: 750,
        isArtisanal: true
    }
];

async function populateDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB para poblar datos.');
        await Product.deleteMany({}); // Borra los productos existentes para evitar duplicados
        await Product.insertMany(sampleProducts);
        console.log(`✅ ¡Base de datos poblada con ${sampleProducts.length} productos de ejemplo!`);
    } catch (error) {
        console.error('❌ Error al poblar la base de datos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB.');
    }
}

populateDB();