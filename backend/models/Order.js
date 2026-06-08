const mongoose = require('mongoose');
const { ORDER_STATUSES } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  variantName: { type: String }, // e.g. "500g", "1kg"
  quantity: { type: Number, required: true, min: 1 },
  priceAtOrder: { type: Number, required: true },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: ORDER_STATUSES },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: [(v) => v.length > 0, 'At least one item is required'] },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    verificationCode: { type: String, required: true, length: 4 },
    orderType: { type: String, enum: ['pickup', 'delivery'], default: 'pickup', index: true },
    deliveryAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String }
    },
    deliveryCharge: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
    paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
    pickupTime: { type: Date, required: [true, 'Pickup/Delivery estimation time is required'] },
    pickupNote: { type: String, maxlength: 300 },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
