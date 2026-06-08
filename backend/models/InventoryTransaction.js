const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    quantityChange: { type: Number, required: true }, // positive or negative
    type: { type: String, enum: ['sale', 'restock', 'adjustment', 'return'], required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    details: { type: String }
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
