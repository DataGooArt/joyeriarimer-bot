const mongoose = require('mongoose');

/**
 * Esquema de atributos dinámicos para productos
 */
const attributeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Metal", "Talla", "Gema"
  value: { type: String, required: true }
}, { _id: false });

/**
 * Esquema del producto
 * Representa los productos de joyería disponibles
 */
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, index: true, lowercase: true },
  material: String,
  gem: String,
  description: String,
  imageUrl: String,
  sku: { type: String, unique: true, sparse: true, index: true },
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0, index: true },
  tags: [{ type: String, lowercase: true, index: true }],
  isAvailable: { type: Boolean, default: true, index: true },
  isArtisanal: { type: Boolean, default: true },
  size: String,
  attributes: [attributeSchema], // atributos dinámicos
  parentProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed }, // info adicional (peso, certificado, origen)
}, { timestamps: true });

productSchema.index({
  category: 1, isAvailable: 1, stock: 1
}, { name: 'ProductCategoryIndex' });

productSchema.index({
  minPrice: 1, maxPrice: 1
}, { name: 'ProductPriceIndex' });

productSchema.index({
  name: 'text', description: 'text', category: 'text', material: 'text', gem: 'text', tags: 'text'
}, { name: 'ProductTextIndex', default_language: 'spanish' });

module.exports = mongoose.model('Product', productSchema);