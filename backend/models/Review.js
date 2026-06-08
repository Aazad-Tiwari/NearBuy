const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true }, // Optional: if rating a specific product
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
    reply: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

// Index for getting reviews for a shop quickly
reviewSchema.index({ shopId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
