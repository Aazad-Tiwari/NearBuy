const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const InventoryTransaction = require('../models/InventoryTransaction');
const User = require('../models/User');
const { ORDER_STATUSES } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/response');
const { createNotification, logAudit, logInventoryTransaction } = require('../utils/helpers');

const shopkeeperController = {
  /**
   * POST /api/shopkeeper/shops
   * Body: { name, description, category, address, phone?, email?, openingHours?, coordinates?, deliverySettings? }
   */
  registerShop: async (req, res) => {
    try {
      const { name, description, category, address, phone, email, openingHours, coordinates, deliverySettings } = req.body;

      if (!name || !category || !address?.street || !address?.city || !address?.state || !address?.zipCode) {
        return sendError(res, 400, 'Shop name, category, and full address (street, city, state, zipCode) are required.');
      }

      const existingShop = await Shop.findOne({ ownerId: req.user._id });
      if (existingShop) {
        return sendError(res, 409, 'You already have a shop registration. Only one shop per shopkeeper is allowed.');
      }

      const shop = await Shop.create({
        name: name.trim(),
        description,
        category,
        address,
        phone,
        email,
        openingHours,
        ownerId: req.user._id,
        location: { type: 'Point', coordinates: coordinates || [0, 0] },
        deliverySettings: deliverySettings || { isEnabled: false, radius: 5, charge: 0, minOrder: 0 }
      });

      await logAudit('SHOP_REGISTERED', req.user._id, req.user.role, `Registered shop "${name}"`);

      return sendSuccess(res, 201, 'Shop registration submitted. Awaiting admin approval.', { shop });
    } catch (err) {
      console.error('[shopkeeper.registerShop]', err);
      return sendError(res, 500, 'Server error registering shop.');
    }
  },

  /**
   * PATCH /api/shopkeeper/shops/me
   * Allows shop owner to edit store profile, including resubmitting modify requests
   */
  updateMyShop: async (req, res) => {
    try {
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'No shop found.');

      const allowedUpdates = ['name', 'description', 'category', 'address', 'phone', 'email', 'openingHours', 'coordinates', 'deliverySettings', 'isOpen'];
      
      allowedUpdates.forEach(key => {
        if (req.body[key] !== undefined) {
          if (key === 'coordinates' && Array.isArray(req.body[key])) {
            shop.location = { type: 'Point', coordinates: req.body[key] };
          } else if (key === 'address' || key === 'deliverySettings') {
            const existing = shop[key] && typeof shop[key].toObject === 'function' ? shop[key].toObject() : (shop[key] || {});
            shop[key] = { ...existing, ...req.body[key] };
          } else {
            shop[key] = req.body[key];
          }
        }
      });

      // If store status was modification needed, reset it to pending review
      if (shop.approvalStatus === 'modify') {
        shop.approvalStatus = 'pending';
        shop.rejectionReason = '';
        shop.modificationFeedback = '';
      }

      await shop.save();
      await logAudit('SHOP_UPDATED', req.user._id, req.user.role, `Updated shop details for "${shop.name}"`);

      return sendSuccess(res, 200, 'Shop details updated successfully.', { shop });
    } catch (err) {
      console.error('[shopkeeper.updateMyShop]', err);
      return sendError(res, 500, 'Server error updating shop.');
    }
  },

  /**
   * GET /api/shopkeeper/shops/me
   */
  getMyShop: async (req, res) => {
    try {
      const shop = await Shop.findOne({ ownerId: req.user._id }).lean();
      if (!shop) return sendError(res, 404, 'No shop found. Please register your shop first.');
      return sendSuccess(res, 200, 'Shop retrieved.', { shop });
    } catch (err) {
      console.error('[shopkeeper.getMyShop]', err);
      return sendError(res, 500, 'Server error fetching shop.');
    }
  },

  /**
   * POST /api/shopkeeper/products
   * Body: { name, description, price, stock, category, subCategory?, sku?, imageUrl?, variants? }
   */
  addProduct: async (req, res) => {
    try {
      const { name, description, price, stock, category, subCategory, sku, imageUrl, variants } = req.body;

      if (!name || price === undefined || stock === undefined || !category) {
        return sendError(res, 400, 'Name, price, stock, and category are required.');
      }

      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'No shop found. Register your shop first.');
      if (shop.approvalStatus !== 'approved') {
        return sendError(res, 403, `Cannot add products — shop status is "${shop.approvalStatus}". Await admin approval.`);
      }

      const product = await Product.create({
        name: name.trim(),
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        subCategory,
        sku: sku?.toUpperCase(),
        imageUrl: imageUrl?.trim(),
        shopId: shop._id,
        variants: variants || []
      });

      // Log restock transaction
      await logInventoryTransaction(product._id, shop._id, parseInt(stock), 'restock', null, 'Initial catalog load');

      await logAudit('PRODUCT_ADDED', req.user._id, req.user.role, `Added product "${product.name}" to inventory`);

      return sendSuccess(res, 201, 'Product added to catalogue.', { product });
    } catch (err) {
      console.error('[shopkeeper.addProduct]', err);
      return sendError(res, 500, 'Server error adding product.');
    }
  },

  /**
   * GET /api/shopkeeper/products
   * Query: page?, limit?
   */
  getMyProducts: async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'No shop found.');

      const skip = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
      // Return ALL products (active + inactive) so deactivated products persist in inventory
      const [products, total] = await Promise.all([
        Product.find({ shopId: shop._id }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
        Product.countDocuments({ shopId: shop._id }),
      ]);

      return sendSuccess(res, 200, 'Products retrieved.', { products, total });
    } catch (err) {
      console.error('[shopkeeper.getMyProducts]', err);
      return sendError(res, 500, 'Server error fetching products.');
    }
  },

  /**
   * PATCH /api/shopkeeper/products/:id
   * Body: { name?, description?, price?, stock?, category?, subCategory?, sku?, imageUrl?, variants?, isActive? }
   */
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const allowedUpdates = ['name', 'description', 'price', 'stock', 'category', 'subCategory', 'sku', 'imageUrl', 'variants', 'isActive'];
      const updates = {};
      allowedUpdates.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'No shop found.');

      // Query without isActive:true so inactive products can be found and re-activated
      const oldProduct = await Product.findOne({ _id: id, shopId: shop._id });
      if (!oldProduct) return sendError(res, 404, 'Product not found.');

      const product = await Product.findOneAndUpdate(
        { _id: id, shopId: shop._id },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      // Auditing stock adjustments
      if (updates.stock !== undefined && updates.stock !== oldProduct.stock) {
        const change = updates.stock - oldProduct.stock;
        await logInventoryTransaction(product._id, shop._id, change, 'adjustment', null, 'Manual stock level update');
      }

      await logAudit('PRODUCT_UPDATED', req.user._id, req.user.role, `Updated product details for "${product.name}"`);

      return sendSuccess(res, 200, 'Product updated.', { product });
    } catch (err) {
      console.error('[shopkeeper.updateProduct]', err);
      return sendError(res, 500, 'Server error updating product.');
    }
  },

  /**
   * DELETE /api/shopkeeper/products/:id
   */
  deleteProduct: async (req, res) => {
    try {
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'No shop found.');

      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, shopId: shop._id, isActive: true },
        { isActive: false },
        { new: true }
      );
      if (!product) return sendError(res, 404, 'Product not found.');

      await logAudit('PRODUCT_DELETED', req.user._id, req.user.role, `Soft deleted product "${product.name}"`);

      return sendSuccess(res, 200, 'Product removed from catalogue.', { product });
    } catch (err) {
      console.error('[shopkeeper.deleteProduct]', err);
      return sendError(res, 500, 'Server error deleting product.');
    }
  },

  /**
   * GET /api/shopkeeper/orders
   * Query: status?, page?, limit?
   */
  getIncomingOrders: async (req, res) => {
    try {
      const { status, page = 1, limit = 30 } = req.query;
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'No shop found.');

      const filter = { shopId: shop._id };
      if (status && ORDER_STATUSES.includes(status)) filter.status = status;

      const skip = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('buyerId', 'name email phone')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(filter),
      ]);

      return sendSuccess(res, 200, 'Orders retrieved.', { orders, total });
    } catch (err) {
      console.error('[shopkeeper.getIncomingOrders]', err);
      return sendError(res, 500, 'Server error fetching orders.');
    }
  },

  /**
   * PATCH /api/shopkeeper/orders/:id/status
   * Body: { status, verificationCode?, note? }
   */
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationCode, note } = req.body;

      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['packed', 'cancelled'],
        packed: ['ready', 'out_for_delivery', 'cancelled'],
        ready: ['completed', 'cancelled'],
        out_for_delivery: ['completed', 'cancelled']
      };

      if (!status || !ORDER_STATUSES.includes(status)) {
        return sendError(res, 400, `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}.`);
      }

      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'No shop found.');

      const order = await Order.findOne({ _id: id, shopId: shop._id });
      if (!order) return sendError(res, 404, 'Order not found.');

      const allowed = validTransitions[order.status] || [];
      if (!allowed.includes(status)) {
        return sendError(res, 400, `Cannot transition from "${order.status}" to "${status}".`);
      }

      if (status === 'completed') {
        if (!verificationCode) return sendError(res, 400, 'Verification code is required to complete an order.');
        if (order.verificationCode !== verificationCode) return sendError(res, 400, 'Incorrect verification code. Ask the buyer.');
        order.paymentStatus = 'paid';
      }

      // Restock elements if order cancelled by shopkeeper
      if (status === 'cancelled') {
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            if (item.variantName) {
              const variant = product.variants.find(v => v.name === item.variantName);
              if (variant) variant.stock += item.quantity;
              product.stock += item.quantity;
              product.markModified('variants');
            } else {
              product.stock += item.quantity;
            }
            await product.save();
            await logInventoryTransaction(product._id, shop._id, item.quantity, 'return', order._id, 'Merchant cancellation restock');
          }
        }
        if (order.paymentStatus === 'paid') {
          order.paymentStatus = 'refunded';
        }
      }

      order.status = status;
      order.statusHistory.push({ status, changedBy: req.user._id, note: note || `Updated by merchant` });
      await order.save();

      // Audit logs & Notifications
      await logAudit('ORDER_STATUS_CHANGED', req.user._id, req.user.role, `Updated order ${order._id} status to ${status}`);
      
      let notificationMsg = `Your order status was updated to "${status}".`;
      if (status === 'ready') notificationMsg = `Your items are packed and ready for pickup! 🎁`;
      if (status === 'out_for_delivery') notificationMsg = `Your order has left the store and is out for delivery! 🚀`;

      await createNotification(
        order.buyerId,
        `Order Update: ${status.toUpperCase()} 🚨`,
        notificationMsg,
        status === 'cancelled' ? 'error' : 'success',
        '/buyer/tickets'
      );

      return sendSuccess(res, 200, `Order status updated to "${status}".`, { order });
    } catch (err) {
      console.error('[shopkeeper.updateOrderStatus]', err);
      return sendError(res, 500, 'Server error updating order status.');
    }
  },

  /**
   * GET /api/shopkeeper/analytics
   */
  getAnalytics: async (req, res) => {
    try {
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'Shop not found.');

      const completedOrders = await Order.find({ shopId: shop._id, status: 'completed' }).lean();
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      // Graph trends: past 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      const ordersInPeriod = await Order.find({
        shopId: shop._id,
        createdAt: { $gte: fourteenDaysAgo }
      }).lean();

      const dateMap = {};
      const labels = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(label);
        dateMap[key] = { index: 13 - i, revenue: 0, count: 0 };
      }

      ordersInPeriod.forEach(o => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dateMap[key]) {
          dateMap[key].count += 1;
          if (o.status === 'completed') {
            dateMap[key].revenue += o.totalAmount;
          }
        }
      });

      const revenueTrend = labels.map((_, idx) => {
        const keys = Object.keys(dateMap);
        const matchKey = keys.find(k => dateMap[k].index === idx);
        return matchKey ? dateMap[matchKey].revenue : 0;
      });

      const countTrend = labels.map((_, idx) => {
        const keys = Object.keys(dateMap);
        const matchKey = keys.find(k => dateMap[k].index === idx);
        return matchKey ? dateMap[matchKey].count : 0;
      });

      // Product sales frequencies
      const topProductsCount = {};
      completedOrders.forEach(o => {
        o.items.forEach(item => {
          const identifier = item.productName + (item.variantName ? ` (${item.variantName})` : '');
          topProductsCount[identifier] = (topProductsCount[identifier] || 0) + item.quantity;
        });
      });

      const topProducts = Object.keys(topProductsCount)
        .map(p => ({ label: p, value: topProductsCount[p] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return sendSuccess(res, 200, 'Analytics retrieved.', {
        totalRevenue,
        totalOrders: completedOrders.length,
        revenueTrend,
        countTrend,
        labels,
        topProducts
      });
    } catch (err) {
      console.error('[shopkeeper.getAnalytics]', err);
      return sendError(res, 500, 'Server error fetching reports.');
    }
  },

  /**
   * GET /api/shopkeeper/inventory/history
   */
  getInventoryHistory: async (req, res) => {
    try {
      const shop = await Shop.findOne({ ownerId: req.user._id });
      if (!shop) return sendError(res, 404, 'Shop not found.');

      const transactions = await InventoryTransaction.find({ shopId: shop._id })
        .populate('productId', 'name sku category')
        .sort({ timestamp: -1 })
        .limit(40)
        .lean();

      return sendSuccess(res, 200, 'Inventory logs retrieved.', { transactions });
    } catch (err) {
      console.error('[shopkeeper.getInventoryHistory]', err);
      return sendError(res, 500, 'Server error fetching inventory history.');
    }
  }
};

module.exports = shopkeeperController;
