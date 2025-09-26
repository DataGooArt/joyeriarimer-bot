require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar productos existentes
        await Product.deleteMany({});
        console.log('🧹 Productos anteriores eliminados');

        const sampleProducts = [
            // ANILLOS
            {
                name: 'Anillo Solitario Clásico',
                description: 'Elegante anillo solitario con diamante de 0.5 quilates, perfecto para compromiso',
                category: 'anillos',
                material: 'oro',
                gem: 'diamante',
                minPrice: 1200000,
                maxPrice: 1800000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Anillo+Solitario',
                tags: ['compromiso', 'solitario', 'clásico'],
                isAvailable: true,
                stock: 3,
                customizable: true
            },
            {
                name: 'Anillo de Matrimonio Oro Blanco',
                description: 'Anillo de matrimonio en oro blanco 18k, diseño clásico y elegante',
                category: 'anillos',
                material: 'oro-blanco',
                gem: 'sin-gema',
                minPrice: 450000,
                maxPrice: 650000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Anillo+Matrimonio',
                tags: ['matrimonio', 'clásico'],
                isAvailable: true,
                stock: 5
            },
            {
                name: 'Anillo Esmeralda Vintage',
                description: 'Hermoso anillo vintage con esmeralda natural y diamantes pequeños',
                category: 'anillos',
                material: 'oro',
                gem: 'esmeralda',
                minPrice: 900000,
                maxPrice: 1300000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Anillo+Esmeralda',
                tags: ['personalizado', 'clásico'],
                isAvailable: true,
                stock: 2
            },

            // CADENAS
            {
                name: 'Cadena Cubana Oro 18k',
                description: 'Cadena cubana en oro 18k, eslabones gruesos, 50cm de longitud',
                category: 'cadenas',
                material: 'oro',
                gem: 'sin-gema',
                minPrice: 800000,
                maxPrice: 1200000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Cadena+Cubana',
                tags: ['clásico'],
                isAvailable: true,
                stock: 4,
                size: '50cm'
            },
            {
                name: 'Cadena con Dije Corazón',
                description: 'Delicada cadena de plata 925 con dije de corazón con circonias',
                category: 'cadenas',
                material: 'plata',
                gem: 'cuarzo',
                minPrice: 180000,
                maxPrice: 250000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Cadena+Corazón',
                tags: ['regalo', 'personalizado'],
                isAvailable: true,
                stock: 8,
                size: '45cm'
            },

            // ARETES
            {
                name: 'Aretes Diamante Clásicos',
                description: 'Aretes de botón con diamantes naturales, engaste en oro blanco',
                category: 'aretes',
                material: 'oro-blanco',
                gem: 'diamante',
                minPrice: 600000,
                maxPrice: 900000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Aretes+Diamante',
                tags: ['clásico'],
                isAvailable: true,
                stock: 6
            },
            {
                name: 'Aretes Largos Perla',
                description: 'Elegantes aretes largos con perlas cultivadas y detalles en plata',
                category: 'aretes',
                material: 'plata',
                gem: 'sin-gema',
                minPrice: 220000,
                maxPrice: 320000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Aretes+Perla',
                tags: ['regalo', 'clásico'],
                isAvailable: true,
                stock: 5
            },

            // PULSERAS
            {
                name: 'Pulsera Tennis Diamante',
                description: 'Pulsera tennis con diamantes engarzados en oro blanco 18k',
                category: 'pulseras',
                material: 'oro-blanco',
                gem: 'diamante',
                minPrice: 1500000,
                maxPrice: 2200000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Pulsera+Tennis',
                tags: ['clásico'],
                isAvailable: true,
                stock: 2
            },
            {
                name: 'Pulsera Charm Personalizada',
                description: 'Pulsera de plata con charms personalizables, perfecta para regalo',
                category: 'pulseras',
                material: 'plata',
                gem: 'sin-gema',
                minPrice: 150000,
                maxPrice: 350000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Pulsera+Charm',
                tags: ['personalizado', 'regalo'],
                isAvailable: true,
                stock: 10,
                customizable: true
            },

            // PRODUCTOS EN PROMOCIÓN
            {
                name: 'Anillo Topacio Promoción',
                description: 'Anillo con topacio azul en promoción especial, oro 14k',
                category: 'anillos',
                material: 'oro',
                gem: 'topacio',
                minPrice: 300000,
                maxPrice: 450000,
                imageUrl: 'https://via.placeholder.com/300x300?text=Anillo+Topacio',
                tags: ['promocion', 'temporada_verano'],
                isAvailable: true,
                stock: 7
            }
        ];

        await Product.insertMany(sampleProducts);
        console.log(`✅ ${sampleProducts.length} productos de ejemplo creados`);

        console.log('\n📊 Resumen de productos:');
        const categories = await Product.aggregate([
            { $match: { isAvailable: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        
        categories.forEach(cat => {
            console.log(`   ${cat._id}: ${cat.count} productos`);
        });

        console.log('\n✅ Base de datos poblada exitosamente');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error poblando base de datos:', error);
        process.exit(1);
    }
}

seedProducts();