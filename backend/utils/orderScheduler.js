const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { createNotification, logAudit, logInventoryTransaction } = require('./helpers');

/**
 * cancelUncollectedOrders - scans and cancels pickup orders uncollected after 2 hours
 */
const cancelUncollectedOrders = async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    // Find all pickup orders scheduled in the past by > 2 hours and not completed/cancelled
    const ordersToCancel = await Order.find({
      orderType: 'pickup',
      status: { $in: ['pending', 'confirmed', 'packed', 'ready'] },
      pickupTime: { $lt: twoHoursAgo }
    });

    if (ordersToCancel.length === 0) return;

    console.log(`[Scheduler] Found ${ordersToCancel.length} uncollected pickup orders to cancel.`);

    for (const order of ordersToCancel) {
      order.status = 'cancelled';
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }
      order.statusHistory.push({
        status: 'cancelled',
        note: 'Automatically cancelled by system (non-collection after 2 hours of scheduled pickup time).'
      });
      await order.save();

      // Return items back to stock
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          if (item.variantName) {
            const variant = product.variants.find(v => v.name === item.variantName);
            if (variant) variant.stock += item.quantity;
            product.stock += item.quantity; // reflect on parent total
            product.markModified('variants');
          } else {
            product.stock += item.quantity;
          }
          await product.save();
          
          await logInventoryTransaction(
            product._id,
            order.shopId,
            item.quantity,
            'return',
            order._id,
            'System auto-cancellation restock'
          );
        }
      }

      // Log audit
      await logAudit(
        'ORDER_CANCELLED',
        order.buyerId,
        'system',
        `Order ${order._id} automatically cancelled by system (uncollected after 2h)`
      );

      // Notify Buyer
      await createNotification(
        order.buyerId,
        'Order Cancelled Automatically ❌',
        `Your order has been automatically cancelled because it was not picked up within 2 hours of the scheduled pickup time.`,
        'error',
        '/buyer/tickets'
      );

      // Notify Shopkeeper
      const shop = await Shop.findById(order.shopId);
      if (shop) {
        await createNotification(
          shop.ownerId,
          'Order Cancelled Automatically ❌',
          `Order ${order._id} was automatically cancelled due to non-collection after 2 hours. Items returned to inventory.`,
          'warning',
          '/shopkeeper/orders'
        );
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error scanning uncollected orders:', err);
  }
};

/**
 * startOrderScheduler - initializes periodic cancellation check (every 60s)
 */
const startOrderScheduler = () => {
  // Check every 60 seconds
  setInterval(cancelUncollectedOrders, 60 * 1000);
  console.log('⏰  Order auto-cancellation scheduler started (checks every 60s).');
};

module.exports = {
  startOrderScheduler,
  cancelUncollectedOrders
};
