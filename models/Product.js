const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        index: 'text'
    },
    category: {
        type: String,
        required: true,
        enum: ['anillos', 'cadenas', 'aretes', 'pulseras'],
        index: true
    },
    material: {
        type: String,
        required: true,
        enum: ['oro', 'plata', 'oro-blanco', 'oro-rosa'],
        index: true
    },
    gem: {
        type: String,
        default: 'sin-gema',
        enum: ['sin-gema', 'diamante', 'esmeralda', 'rubi', 'zafiro', 'topacio', 'amatista', 'cuarzo']
    },
    minPrice: {
        type: Number,
        required: true,
        min: 0
    },
    maxPrice: {
        type: Number,
        min: 0,
        validate: {
            validator: function(value) {
                return !value || value >= this.minPrice;
            },
            message: 'maxPrice debe ser mayor o igual a minPrice'
        }
    },
    imageUrl: {
        type: String,
        default: 'https://via.placeholder.com/300x300?text=Joya'
    },
    tags: [{
        type: String,
        enum: [
            'compromiso', 'matrimonio', 'personalizado', 'solitario', 'eternity',
            'regalo', 'promocion', 'temporada_verano', 'temporada_invierno', 'clásico'
        ]
    }],
    isAvailable: {
        type: Boolean,
        default: true,
        index: true
    },
    stock: {
        type: Number,
        default: 1,
        min: 0
    },
    weight: {
        type: Number, // en gramos
        min: 0
    },
    size: {
        type: String, // para anillos: talla, para cadenas: longitud, etc.
    },
    customizable: {
        type: Boolean,
        default: false
    },
    parentProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Índices compuestos para búsquedas optimizadas
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ material: 1, isAvailable: 1 });
productSchema.index({ tags: 1, isAvailable: 1 });
productSchema.index({ minPrice: 1, maxPrice: 1 });

// Índice de texto para búsqueda completa
productSchema.index({ 
    name: 'text', 
    description: 'text', 
    tags: 'text' 
}, {
    weights: {
        name: 10,
        tags: 5,
        description: 1
    }
});

// Middleware para actualizar updatedAt
productSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Métodos virtuales
productSchema.virtual('priceRange').get(function() {
    if (this.maxPrice && this.maxPrice > this.minPrice) {
        return `$${this.minPrice.toLocaleString()} - $${this.maxPrice.toLocaleString()}`;
    }
    return `$${this.minPrice.toLocaleString()}`;
});

productSchema.virtual('displayName').get(function() {
    return `${this.name} - ${this.material}${this.gem !== 'sin-gema' ? ` con ${this.gem}` : ''}`;
});

// Métodos estáticos
productSchema.statics.findByCategory = function(category) {
    return this.find({ category: category, isAvailable: true });
};

productSchema.statics.findByMaterial = function(material) {
    return this.find({ material: material, isAvailable: true });
};

productSchema.statics.findByPriceRange = function(minPrice, maxPrice) {
    return this.find({
        minPrice: { $lte: maxPrice },
        $or: [
            { maxPrice: { $gte: minPrice } },
            { maxPrice: { $exists: false } }
        ],
        isAvailable: true
    });
};

productSchema.statics.searchProducts = function(searchTerm) {
    return this.find({
        $text: { $search: searchTerm },
        isAvailable: true
    }).sort({ score: { $meta: 'textScore' } });
};

// Métodos de instancia
productSchema.methods.isInStock = function() {
    return this.isAvailable && this.stock > 0;
};

productSchema.methods.getFormattedPrice = function() {
    if (this.maxPrice && this.maxPrice > this.minPrice) {
        return `Desde $${this.minPrice.toLocaleString()} hasta $${this.maxPrice.toLocaleString()}`;
    }
    return `$${this.minPrice.toLocaleString()}`;
};

module.exports = mongoose.model('Product', productSchema);
