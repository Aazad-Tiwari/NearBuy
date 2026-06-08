const mongoose = require('mongoose');
const { SHOP_CATEGORIES } = require('../config/constants');

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Shop name is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    category: { type: String, required: [true, 'Category is required'], enum: SHOP_CATEGORIES },
    address: {
      street: { type: String, required: [true, 'Street address is required'] },
      city: { type: String, required: [true, 'City is required'] },
      state: { type: String, required: [true, 'State is required'] },
      zipCode: { type: String, required: [true, 'ZIP code is required'] },
      country: { type: String, default: 'India' },
    },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'modify'], default: 'pending', index: true },
    rejectionReason: { type: String },
    modificationFeedback: { type: String },
    phone: { type: String },
    email: { type: String },
    openingHours: { type: String, default: '9:00 AM - 7:00 PM' },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    deliverySettings: {
      isEnabled: { type: Boolean, default: false },
      radius: { type: Number, default: 5 }, // in km
      charge: { type: Number, default: 0 },  // in ₹
      minOrder: { type: Number, default: 0 } // in ₹
    },
    isOpen: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

shopSchema.index({ location: '2dsphere' });

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
