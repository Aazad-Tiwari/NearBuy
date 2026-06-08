const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    stock: { type: Number, required: [true, 'Stock is required'], min: [0, 'Stock cannot be negative'], default: 0 },
    category: { type: String, required: [true, 'Category is required'] },
    subCategory: { type: String, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    imageUrl: { type: String, trim: true },
    variants: [
      {
        name: { type: String, required: true }, // e.g. "500g", "1kg", "Red / M"
        price: { type: Number, required: true, min: 0 },
        stock: { type: Number, required: true, min: 0, default: 0 },
        sku: { type: String, trim: true, uppercase: true }
      }
    ],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ shopId: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
