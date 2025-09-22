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
    sku: { type: String, unique: true, sparse: true },
    minPrice: { type: Number, required: true, min: 0 },
    maxPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    tags: [{ type: String, lowercase: true }],
    isAvailable: { type: Boolean, default: true }, // Añadido en la refactorización anterior
    isArtisanal: { type: Boolean, default: true },
    size: String,
    parentProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
});
// Añadimos el índice de texto aquí también para que se cree al ejecutar el script
productSchema.index({ name: 'text', description: 'text', category: 'text', material: 'text', gem: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
    {
        name: "Anillo Solitario Clásico",
        sku: "AN-SOL-001",
        category: "anillos",
        material: "Oro Blanco 18k",
        gem: "Diamante redondo de 0.75ct, certificación GIA",
        description: "Un diseño atemporal que simboliza el amor eterno. Realizado artesanalmente para capturar la máxima luz.",
        imageUrl: "https://i.imgur.com/TuVo1iX.jpeg", // URL de ejemplo
        minPrice: 2500,
        stock: 5,
        tags: ["compromiso", "solitario", "con gema"],
        isAvailable: true,
        isArtisanal: true
    },
    {
        name: "Aro de Matrimonio Eternity",
        category: "anillos",
        sku: "AN-ETERN-001",
        material: "Platino",
        gem: "Banda completa de diamantes pequeños (1.5ct total)",
        description: "Una banda deslumbrante que representa un amor sin fin. Cada diamante es engastado a mano por nuestros artesanos.",
        imageUrl: "https://i.imgur.com/Sna42aU.jpeg", // URL de ejemplo
        minPrice: 3200,
        stock: 3,
        tags: ["matrimonio", "eternity", "con gema"],
        isAvailable: true,
        isArtisanal: true
    },
    {
        name: "Anillo de Zafiro y Diamantes",
        category: "anillos",
        sku: "AN-ZAF-001",
        material: "Oro Amarillo 18k",
        gem: "Zafiro azul ovalado de 1.2ct rodeado por un halo de diamantes",
        description: "Una pieza majestuosa que combina el intenso azul del zafiro con el brillo de los diamantes, ideal para una propuesta inolvidable.",
        imageUrl: "https://i.imgur.com/b9o2wJ4.jpeg", // URL de ejemplo
        minPrice: 1850,
        stock: 0,
        tags: ["compromiso", "con gema", "promocion"],
        isAvailable: false, // Ejemplo de un producto no disponible
        isArtisanal: true
    },
    {
        name: "Pulsera de Eslabones de Oro",
        category: "pulseras",
        sku: "PUL-ESL-001",
        material: "Oro Amarillo 18k",
        gem: "Sin gema",
        description: "Una pulsera robusta y elegante, con eslabones sólidos pulidos a mano. Perfecta para uso diario o para ocasiones especiales.",
        imageUrl: "https://i.imgur.com/Lp5gWjR.jpeg", // Placeholder image
        minPrice: 950,
        stock: 10,
        tags: ["personalizado"],
        isAvailable: true,
        isArtisanal: true
    },
    {
        name: "Cadena con Nombre Personalizado",
        category: "cadenas",
        sku: "CAD-NOM-001",
        material: "Oro Rosa 18k",
        gem: "Sin gema",
        description: "Una pieza única y personal. Creamos artesanalmente tu nombre o una palabra especial en una delicada cadena de oro rosa. El regalo perfecto.",
        imageUrl: "https://i.imgur.com/9hC7f4g.jpeg", // Placeholder image
        minPrice: 750,
        stock: 15, // Stock alto para productos personalizables
        tags: ["personalizado", "regalo"],
        isAvailable: true,
        isArtisanal: true
    },
    {
        name: "Aretes de Perlas y Oro",
        category: "aretes",
        sku: "ARE-PERL-001",
        material: "Oro Amarillo 18k",
        gem: "Perlas de Akoya",
        description: "Un clásico que nunca pasa de moda. Aretes de perlas cultivadas de Akoya con un lustre excepcional, montadas en oro de 18 quilates.",
        imageUrl: "https://i.imgur.com/5J2Yq3a.jpeg", // Placeholder image
        minPrice: 450,
        stock: 8,
        tags: ["clásico", "regalo"],
        isAvailable: true,
        isArtisanal: true
    },
    // --- Ejemplo de Producto Padre con Variaciones ---
    {
        _id: new mongoose.Types.ObjectId("60c72b2f9b1d8c001f8e4c1a"), // ID Fijo para referencia
        name: "Anillo Personalizado 'Infinito'",
        sku: "AN-INF-PADRE",
        category: "anillos",
        description: "Un anillo elegante con el símbolo del infinito, personalizable en diferentes metales y con la opción de añadir una gema.",
        imageUrl: "https://i.imgur.com/example.jpeg",
        minPrice: 800,
        maxPrice: 1200, // Rango de precios
        stock: 99, // Stock virtualmente infinito para el padre
        tags: ["personalizado", "regalo"],
        isAvailable: true,
        isArtisanal: true
    },
    {
        name: "Anillo 'Infinito' en Oro Amarillo",
        sku: "AN-INF-ORO",
        category: "anillos",
        material: "Oro Amarillo 18k",
        gem: "Sin gema",
        minPrice: 800,
        stock: 4,
        size: "7",
        tags: ["personalizado", "sin gema"],
        isAvailable: true,
        parentProduct: new mongoose.Types.ObjectId("60c72b2f9b1d8c001f8e4c1a") // Referencia al padre
    },
    {
        name: "Anillo 'Infinito' en Plata con Gema",
        sku: "AN-INF-PLATA-GEMA",
        category: "anillos",
        material: "Plata 925",
        gem: "Topacio azul",
        minPrice: 1200,
        stock: 6,
        size: "8",
        tags: ["personalizado", "con gema"],
        isAvailable: true,
        parentProduct: new mongoose.Types.ObjectId("60c72b2f9b1d8c001f8e4c1a") // Referencia al padre
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