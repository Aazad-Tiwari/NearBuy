const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { ORDER_STATUSES } = require('../config/constants');
const { generateVerificationCode, sendSuccess, sendError } = require('../utils/response');
const { createNotification, logAudit, logInventoryTransaction } = require('../utils/helpers');
const { enhanceSearchQuery, getRecommendations } = require('../utils/geminiService');

/**
 * getDistanceInKm — Pure Haversine formula (no external API required)
 * Returns null if either coordinate is [0,0] (unset) to avoid false 0km distances.
 */
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  // Return null if coordinates are not set (default [0, 0] or missing)
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  // Store has no GPS set (default [0,0])
  if (lat2 === 0 && lon2 === 0) return null;
  if (lat1 === 0 && lon1 === 0) return null;

  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}


const buyerController = {
  /**
   * GET /api/buyer/search
   * Query: q (search term), type ('products' | 'stores'), page?, limit?, lng?, lat?, maxDistance?, sortBy?, minPrice?, maxPrice?, category?, deliverySupport?, availability?
   */
  search: async (req, res) => {
    try {
      const {
        q = '',
        type = 'products',
        page = 1,
        limit = 24,
        lng,
        lat,
        maxDistance, // in km
        sortBy = 'distance',
        minPrice,
        maxPrice,
        category,
        deliverySupport, // 'true' or 'false'
        availability, // 'true' or 'false'
      } = req.query;

      let regex = null;
      if (q.trim()) {
        try {
          const enhancedTerms = await enhanceSearchQuery(q.trim());
          const joinedTerms = enhancedTerms
            .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .filter(Boolean)
            .join('|');
          regex = joinedTerms ? new RegExp(joinedTerms, 'i') : null;
        } catch (err) {
          console.warn('[search] Failed to enhance search query:', err.message);
          regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }
      }
      const skip = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);

      // Track user search history (capped at 100 entries)
      if (q.trim() && req.user) {
        await User.findByIdAndUpdate(req.user._id, {
          $push: { searchHistory: { $each: [q.trim()], $slice: -100 } }
        });
      }

      if (type === 'stores') {
        const filter = {
          approvalStatus: 'approved',
          isActive: true,
        };

        if (regex) {
          filter.$or = [{ name: regex }, { description: regex }, { category: regex }, { 'address.city': regex }, { 'address.state': regex }];
        }

        if (category) {
          filter.category = category;
        }

        if (deliverySupport === 'true') {
          filter['deliverySettings.isEnabled'] = true;
        }

        let shops = await Shop.find(filter).lean();

        // Calculate distance if coordinates provided
        if (lat && lng) {
          const userLat = parseFloat(lat);
          const userLng = parseFloat(lng);
          shops = shops.map(s => {
            let distance = null;
            if (s.location && s.location.coordinates && s.location.coordinates.length === 2) {
              const [shopLng, shopLat] = s.location.coordinates;
              distance = getDistanceInKm(userLat, userLng, shopLat, shopLng); // sync, may return null
            }
            return { ...s, distance };
          });

          // Distance filter: skip shops with null distance (no GPS set)
          if (maxDistance) {
            const distLimit = parseFloat(maxDistance);
            shops = shops.filter(s => s.distance !== null && s.distance <= distLimit);
          }

          // Sorting: push shops with null distance to end
          if (sortBy === 'distance') {
            shops.sort((a, b) => {
              if (a.distance === null && b.distance === null) return 0;
              if (a.distance === null) return 1;
              if (b.distance === null) return -1;
              return a.distance - b.distance;
            });
          } else if (sortBy === 'rating') {
            shops.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          } else if (sortBy === 'popularity') {
            shops.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
          } else {
            shops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }
        } else {
          // Fallback sorting
          if (sortBy === 'rating') {
            shops.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          } else if (sortBy === 'popularity') {
            shops.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
          } else {
            shops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }
        }

        const total = shops.length;
        const paginatedShops = shops.slice(skip, skip + parseInt(limit));

        return sendSuccess(res, 200, `Found ${total} store(s).`, { results: paginatedShops, total, type: 'stores', page: parseInt(page) });
      }

      // Products search — only from approved shops
      const approvedShopsQuery = { approvalStatus: 'approved', isActive: true };
      if (category) approvedShopsQuery.category = category;
      if (deliverySupport === 'true') approvedShopsQuery['deliverySettings.isEnabled'] = true;

      const approvedShops = await Shop.find(approvedShopsQuery).lean();
      const approvedShopIds = approvedShops.map((s) => s._id);

      const filter = {
        isActive: true,
        shopId: { $in: approvedShopIds },
      };

      if (regex) {
        filter.$or = [{ name: regex }, { description: regex }, { category: regex }];
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }

      if (availability === 'true') {
        filter.stock = { $gt: 0 };
      }

      let products = await Product.find(filter).populate('shopId', 'name address category openingHours phone rating reviewCount location deliverySettings isOpen').lean();

      // Calculate distance for product shops
      if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        products = products.map(p => {
          let distance = null;
          const s = p.shopId;
          if (s && s.location && s.location.coordinates && s.location.coordinates.length === 2) {
            const [shopLng, shopLat] = s.location.coordinates;
            distance = getDistanceInKm(userLat, userLng, shopLat, shopLng); // sync, may return null
          }
          return { ...p, distance };
        });

        if (maxDistance) {
          const distLimit = parseFloat(maxDistance);
          products = products.filter(p => p.distance !== null && p.distance <= distLimit);
        }

        // Sorting
        if (sortBy === 'distance') {
          products.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        } else if (sortBy === 'price') {
          products.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'rating') {
          products.sort((a, b) => ((b.shopId?.rating || 0) - (a.shopId?.rating || 0)));
        } else if (sortBy === 'popularity') {
          products.sort((a, b) => ((b.shopId?.reviewCount || 0) - (a.shopId?.reviewCount || 0)));
        } else {
          products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      } else {
        if (sortBy === 'price') {
          products.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'rating') {
          products.sort((a, b) => ((b.shopId?.rating || 0) - (a.shopId?.rating || 0)));
        } else {
          products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      }

      const total = products.length;
      const paginatedProducts = products.slice(skip, skip + parseInt(limit));

      return sendSuccess(res, 200, `Found ${total} product(s).`, { results: paginatedProducts, total, type: 'products', page: parseInt(page) });
    } catch (err) {
      console.error('[buyer.search]', err);
      return sendError(res, 500, 'Server error during search.');
    }
  },

  /**
   * GET /api/buyer/products/:id/compare
   * Retrieves alternative stores offering a matching product (same name/SKU)
   */
  comparePrices: async (req, res) => {
    try {
      const { id } = req.params;
      const { lng, lat } = req.query;

      const product = await Product.findById(id).populate('shopId');
      if (!product) return sendError(res, 404, 'Product not found.');

      // Search matching products in other approved shops
      const nameRegex = new RegExp('^' + product.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
      const approvedShops = await Shop.find({ approvalStatus: 'approved', isActive: true }).select('_id name address location rating reviewCount').lean();
      const approvedShopIds = approvedShops.map(s => s._id);

      const query = {
        _id: { $ne: product._id },
        shopId: { $in: approvedShopIds },
        isActive: true,
        $or: [
          { name: nameRegex }
        ]
      };
      if (product.sku) query.$or.push({ sku: product.sku });

      const matches = await Product.find(query).populate('shopId', 'name address location rating reviewCount').lean();

      const results = matches.map(m => {
        let distance = null;
        if (lng && lat && m.shopId?.location?.coordinates?.length === 2) {
          const [sLng, sLat] = m.shopId.location.coordinates;
          distance = getDistanceInKm(parseFloat(lat), parseFloat(lng), sLat, sLng);
        }
        return {
          _id: m._id,
          name: m.name,
          price: m.price,
          stock: m.stock,
          variants: m.variants,
          shop: {
            _id: m.shopId._id,
            name: m.shopId.name,
            rating: m.shopId.rating,
            reviewCount: m.shopId.reviewCount,
            address: m.shopId.address
          },
          distance: distance != null ? distance : 0
        };
      });

      // Include self
      let selfDistance = null;
      if (lng && lat && product.shopId?.location?.coordinates?.length === 2) {
        const [sLng, sLat] = product.shopId.location.coordinates;
        selfDistance = getDistanceInKm(parseFloat(lat), parseFloat(lng), sLat, sLng);
      }

      const selfResult = {
        _id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        variants: product.variants,
        shop: {
          _id: product.shopId._id,
          name: product.shopId.name,
          rating: product.shopId.rating,
          reviewCount: product.shopId.reviewCount,
          address: product.shopId.address
        },
        distance: selfDistance != null ? selfDistance : 0
      };

      const finalResults = [selfResult, ...results];
      finalResults.sort((a, b) => a.price - b.price);

      return sendSuccess(res, 200, 'Price comparisons retrieved.', { results: finalResults });
    } catch (err) {
      console.error('[buyer.comparePrices]', err);
      return sendError(res, 500, 'Server error fetching price comparisons.');
    }
  },

  /**
   * POST /api/buyer/shopping-list/optimize
   * Body: { items: [String], lng?, lat? }
   */
  optimizeShoppingList: async (req, res) => {
    try {
      const { items = [], lng, lat } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return sendError(res, 400, 'Shopping list items are required.');
      }

      const approvedShops = await Shop.find({ approvalStatus: 'approved', isActive: true }).lean();
      const shopRecommendations = [];

      for (const shop of approvedShops) {
        let matchCount = 0;
        let estimatedBill = 0;
        const matchedProducts = [];
        const missingItems = [];

        // Search catalog of this shop for each list item
        for (const itemText of items) {
          if (!itemText.trim()) continue;
          
          const cleanItem = itemText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(cleanItem, 'i');

          // Find cheapest matching in stock product in this shop
          const match = await Product.findOne({
            shopId: shop._id,
            isActive: true,
            stock: { $gt: 0 },
            $or: [{ name: regex }, { category: regex }]
          }).sort({ price: 1 }).lean();

          if (match) {
            matchCount++;
            estimatedBill += match.price;
            matchedProducts.push({
              searchedItem: itemText,
              productId: match._id,
              name: match.name,
              price: match.price,
              stock: match.stock,
              imageUrl: match.imageUrl
            });
          } else {
            missingItems.push(itemText);
          }
        }

        if (matchCount > 0) {
          let distance = null;
          if (lat && lng && shop.location?.coordinates?.length === 2) {
            const [sLng, sLat] = shop.location.coordinates;
            distance = getDistanceInKm(parseFloat(lat), parseFloat(lng), sLat, sLng);
          }

          shopRecommendations.push({
            shop: {
              _id: shop._id,
              name: shop.name,
              category: shop.category,
              address: shop.address,
              rating: shop.rating,
              reviewCount: shop.reviewCount,
              deliverySettings: shop.deliverySettings
            },
            matchCount,
            totalItems: items.length,
            matchPercentage: Math.round((matchCount / items.length) * 100),
            estimatedBill,
            distance: distance != null ? distance : 0,
            matchedProducts,
            missingItems
          });
        }
      }

      // Sort recommendations: Highest match rate, then lowest bill, then closest distance
      shopRecommendations.sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        if (a.estimatedBill !== b.estimatedBill) return a.estimatedBill - b.estimatedBill;
        return a.distance - b.distance;
      });

      return sendSuccess(res, 200, 'Shopping list optimization results computed.', { recommendations: shopRecommendations });
    } catch (err) {
      console.error('[buyer.optimizeShoppingList]', err);
      return sendError(res, 500, 'Server error optimizing shopping list.');
    }
  },

  /**
   * POST /api/buyer/orders
   * Body: { shopId, items: [{ productId, quantity, variantName? }], pickupTime, pickupNote?, orderType, deliveryAddress?, paymentMethod }
   */
  placeOrder: async (req, res) => {
    try {
      const { shopId, items, pickupTime, pickupNote, orderType = 'pickup', deliveryAddress, paymentMethod = 'online', couponCode } = req.body;

      if (!shopId || !Array.isArray(items) || items.length === 0 || !pickupTime) {
        return sendError(res, 400, 'shopId, items, and estimated time are required.');
      }

      if (orderType === 'pickup' && paymentMethod === 'cod') {
        return sendError(res, 400, 'Upfront online payment is required for pickup orders.');
      }

      const estimatedTime = new Date(pickupTime);
      if (isNaN(estimatedTime.getTime()) || estimatedTime <= new Date()) {
        return sendError(res, 400, 'Pickup/Delivery time must be a valid future date-time.');
      }

      const shop = await Shop.findById(shopId);
      if (!shop || shop.approvalStatus !== 'approved') return sendError(res, 404, 'Shop not found or not approved.');
      if (shop.isOpen === false || shop.isActive === false) {
        return sendError(res, 400, 'This shop is currently closed. Orders cannot be placed.');
      }

      // Geolocation check for delivery
      let deliveryCharge = 0;
      if (orderType === 'delivery') {
        if (!shop.deliverySettings?.isEnabled) {
          return sendError(res, 400, 'This shop does not support home delivery.');
        }

        if (!deliveryAddress?.street || !deliveryAddress?.city || !deliveryAddress?.zipCode) {
          return sendError(res, 400, 'Complete delivery address is required.');
        }

        // Check distance if shop location and delivery coordinates can be matched
        // Note: For simulation, we assume user coordinates are mapped from city/state or default current user location
        // We will calculate default distance for delivery charges
        let distance = 0;
        if (shop.location?.coordinates?.length === 2 && req.body.coordinates) {
          const [sLng, sLat] = shop.location.coordinates;
          const [uLng, uLat] = req.body.coordinates;
          distance = getDistanceInKm(uLat, uLng, sLat, sLng) || 0;
          if (distance > shop.deliverySettings.radius) {
            return sendError(res, 400, `Your location is outside the shop's delivery radius of ${shop.deliverySettings.radius}km.`);
          }
        }
        deliveryCharge = shop.deliverySettings.charge || 0;
      }

      const orderItems = [];
      let totalAmount = 0;

      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          return sendError(res, 400, 'Each item must have a valid productId and quantity >= 1.');
        }
        const product = await Product.findOne({ _id: item.productId, shopId, isActive: true });
        if (!product) return sendError(res, 404, `Product "${item.productId}" not found in this shop.`);

        let itemPrice = product.price;
        let itemStock = product.stock;

        // Variant stock verification
        if (item.variantName) {
          const variant = product.variants.find(v => v.name === item.variantName);
          if (!variant) return sendError(res, 404, `Variant "${item.variantName}" not found on product "${product.name}".`);
          itemPrice = variant.price;
          itemStock = variant.stock;

          if (itemStock < item.quantity) {
            return sendError(res, 400, `Insufficient stock for variant "${item.variantName}" of "${product.name}". Available: ${itemStock}, requested: ${item.quantity}.`);
          }

          // Deduct variant stock
          variant.stock -= item.quantity;
          product.stock -= item.quantity; // reflect on parent total
          product.markModified('variants');
        } else {
          if (itemStock < item.quantity) {
            return sendError(res, 400, `Insufficient stock for "${product.name}". Available: ${itemStock}, requested: ${item.quantity}.`);
          }
          product.stock -= item.quantity;
        }

        await product.save();

        orderItems.push({
          productId: product._id,
          productName: product.name,
          variantName: item.variantName || '',
          quantity: item.quantity,
          priceAtOrder: itemPrice
        });
        totalAmount += itemPrice * item.quantity;

        // Inventory movements logs
        await logInventoryTransaction(product._id, shopId, -item.quantity, 'sale', null, `Sold via order ${orderType}`);

        // Low stock notification
        const currentStock = item.variantName ? product.variants.find(v => v.name === item.variantName).stock : product.stock;
        if (currentStock < 5) {
          await createNotification(
            shop.ownerId,
            'Low Stock Alert! ⚠️',
            `Product "${product.name}" ${item.variantName ? `(${item.variantName})` : ''} is low in stock. Current: ${currentStock}`,
            'warning',
            '/shopkeeper/inventory'
          );
        }
      }

      // Apply coupon discount if applicable
      let discount = 0;
      if (couponCode && couponCode.toUpperCase() === 'WELCOME10') {
        discount = totalAmount * 0.1;
      }
      totalAmount = Math.max(0, totalAmount - discount);
      totalAmount += deliveryCharge;

      // Simulated Payment Process
      let paymentStatus = 'pending';
      if (paymentMethod === 'online') {
        // Assume successful simulation payment
        paymentStatus = 'paid';
      }

      const verificationCode = generateVerificationCode();
      const order = await Order.create({
        buyerId: req.user._id,
        shopId,
        items: orderItems,
        totalAmount,
        status: 'pending',
        verificationCode,
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        deliveryCharge,
        paymentStatus,
        paymentMethod,
        pickupTime: estimatedTime,
        pickupNote,
        statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Order placed' }],
      });

      // Audit logs
      await logAudit('ORDER_PLACED', req.user._id, req.user.role, `Order of ₹${totalAmount} placed at shop ${shop.name}`);

      // Notifications
      await createNotification(
        req.user._id,
        'Booking Confirmed! 🎉',
        `Your order has been placed. Verification PIN: ${verificationCode}`,
        'success',
        '/buyer/tickets'
      );

      await createNotification(
        shop.ownerId,
        'New Order Received! 🎟️',
        `You have a new ${orderType} order for ₹${totalAmount}`,
        'info',
        '/shopkeeper/orders'
      );

      return sendSuccess(res, 201, 'Order placed! Check notifications for updates.', { order });
    } catch (err) {
      console.error('[buyer.placeOrder]', err);
      return sendError(res, 500, 'Server error placing order.');
    }
  },

  /**
   * GET /api/buyer/orders
   * Query: status?, page?, limit?
   */
  getMyOrders: async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filter = { buyerId: req.user._id };
      if (status && ORDER_STATUSES.includes(status)) filter.status = status;

      const skip = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('shopId', 'name address phone openingHours rating coordinates location')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(filter),
      ]);

      return sendSuccess(res, 200, 'Orders retrieved.', { orders, total });
    } catch (err) {
      console.error('[buyer.getMyOrders]', err);
      return sendError(res, 500, 'Server error fetching orders.');
    }
  },

  /**
   * POST /api/buyer/orders/:id/cancel
   */
  cancelOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findOne({ _id: id, buyerId: req.user._id });
      if (!order) return sendError(res, 404, 'Order not found.');

      if (!['pending', 'confirmed'].includes(order.status)) {
        return sendError(res, 400, 'Cannot cancel order at this stage.');
      }

      const previousStatus = order.status;
      order.status = 'cancelled';
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }
      order.statusHistory.push({ status: 'cancelled', changedBy: req.user._id, note: 'Cancelled by customer' });
      await order.save();

      // Return items back to stock
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
          await logInventoryTransaction(product._id, order.shopId, item.quantity, 'return', order._id, 'Customer cancellation restock');
        }
      }

      const shop = await Shop.findById(order.shopId);

      // Logs & Notifications
      await logAudit('ORDER_CANCELLED', req.user._id, req.user.role, `Order ${order._id} cancelled by buyer`);
      if (shop) {
        await createNotification(
          shop.ownerId,
          'Order Cancelled ❌',
          `Order ${order._id} was cancelled by the customer. Items returned to inventory.`,
          'warning',
          '/shopkeeper/orders'
        );
      }

      return sendSuccess(res, 200, 'Order cancelled successfully. Refund processed where applicable.', { order });
    } catch (err) {
      console.error('[buyer.cancelOrder]', err);
      return sendError(res, 500, 'Server error cancelling order.');
    }
  },

  /**
   * POST /api/buyer/orders/:id/review
   * Body: { rating, comment }
   */
  submitReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment, productId } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return sendError(res, 400, 'Rating is required (1-5).');
      }

      const order = await Order.findOne({ _id: id, buyerId: req.user._id });
      if (!order) return sendError(res, 404, 'Order not found.');

      if (order.status !== 'completed') {
        return sendError(res, 400, 'Only completed orders can be reviewed.');
      }

      if (productId) {
        // Product Review
        const hasProduct = order.items.some(item => item.productId.toString() === productId);
        if (!hasProduct) {
          return sendError(res, 400, 'Product is not part of this order.');
        }

        const existing = await Review.findOne({ orderId: order._id, productId });
        if (existing) return sendError(res, 409, 'You have already reviewed this product.');

        const review = await Review.create({
          orderId: order._id,
          buyerId: req.user._id,
          shopId: order.shopId,
          productId,
          rating: parseInt(rating),
          comment
        });

        // Re-calculate average product rating
        const productReviews = await Review.find({ productId });
        const avgProductRating = productReviews.reduce((acc, curr) => acc + curr.rating, 0) / productReviews.length;

        await Product.findByIdAndUpdate(productId, {
          rating: parseFloat(avgProductRating.toFixed(1)),
          reviewCount: productReviews.length
        });

        return sendSuccess(res, 201, 'Product review submitted successfully!', { review });
      } else {
        // Shop Review
        const existing = await Review.findOne({ orderId: order._id, productId: null });
        if (existing) return sendError(res, 409, 'You have already reviewed this store.');

        const review = await Review.create({
          orderId: order._id,
          buyerId: req.user._id,
          shopId: order.shopId,
          rating: parseInt(rating),
          comment
        });

        // Re-calculate average shop rating
        const shopReviews = await Review.find({ shopId: order.shopId, productId: null });
        const avgRating = shopReviews.reduce((acc, curr) => acc + curr.rating, 0) / shopReviews.length;

        await Shop.findByIdAndUpdate(order.shopId, {
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: shopReviews.length
        });

        const shop = await Shop.findById(order.shopId);

        await logAudit('REVIEW_SUBMITTED', req.user._id, req.user.role, `Submitted ${rating}-star review for shop ${shop?.name}`);
        if (shop) {
          await createNotification(
            shop.ownerId,
            'New Shop Review! ⭐',
            `A buyer gave your shop a ${rating}-star rating: "${comment || ''}"`,
            'info',
            '/shopkeeper/analytics'
          );
        }

        return sendSuccess(res, 201, 'Review submitted successfully!', { review });
      }
    } catch (err) {
      console.error('[buyer.submitReview]', err);
      return sendError(res, 500, 'Server error submitting review.');
    }
  },

  /**
   * GET /api/buyer/orders/:id/reviews
   */
  getOrderReview: async (req, res) => {
    try {
      const { id } = req.params;
      const review = await Review.findOne({ orderId: id, buyerId: req.user._id }).lean();
      return sendSuccess(res, 200, 'Review retrieved.', { review });
    } catch (err) {
      return sendError(res, 500, 'Server error fetching review.');
    }
  },

  /**
   * POST /api/buyer/favorites/toggle
   * Body: { shopId }
   */
  toggleFavorite: async (req, res) => {
    try {
      const { shopId } = req.body;
      const user = await User.findById(req.user._id);
      if (!user) return sendError(res, 404, 'User not found');

      const idx = user.favorites.indexOf(shopId);
      let isFavorite = false;
      if (idx > -1) {
        user.favorites.splice(idx, 1);
      } else {
        user.favorites.push(shopId);
        isFavorite = true;
      }
      await user.save();

      return sendSuccess(res, 200, isFavorite ? 'Added to favorites.' : 'Removed from favorites.', { isFavorite });
    } catch (err) {
      return sendError(res, 500, 'Server error toggling favorite.');
    }
  },

  /**
   * GET /api/buyer/favorites
   */
  getFavorites: async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate('favorites');
      if (!user) return sendError(res, 404, 'User not found');
      return sendSuccess(res, 200, 'Favorite stores retrieved.', { favorites: user.favorites });
    } catch (err) {
      return sendError(res, 500, 'Server error fetching favorites.');
    }
  },

  /**
   * GET /api/buyer/notifications
   */
  getNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
      return sendSuccess(res, 200, 'Notifications retrieved.', { notifications });
    } catch (err) {
      return sendError(res, 500, 'Server error fetching notifications.');
    }
  },

  /**
   * PATCH /api/buyer/notifications/:id/read
   */
  markNotificationRead: async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isRead: true },
        { new: true }
      );
      if (!notification) return sendError(res, 404, 'Notification not found.');
      return sendSuccess(res, 200, 'Notification marked as read.', { notification });
    } catch (err) {
      return sendError(res, 500, 'Server error marking notification.');
    }
  },

  /**
   * POST /api/buyer/orders/:id/reorder
   */
  reorderOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const oldOrder = await Order.findOne({ _id: id, buyerId: req.user._id });
      if (!oldOrder) return sendError(res, 404, 'Order not found');

      // Verify that all items are still available at the shop
      const shopId = oldOrder.shopId;
      const newItems = [];

      for (const item of oldOrder.items) {
        const product = await Product.findOne({ _id: item.productId, shopId, isActive: true });
        if (!product) {
          return sendError(res, 400, `Product "${item.productName}" is no longer available in this shop.`);
        }
        
        let stock = product.stock;
        if (item.variantName) {
          const v = product.variants.find(va => va.name === item.variantName);
          if (!v) return sendError(res, 400, `Variant "${item.variantName}" of "${item.productName}" is no longer available.`);
          stock = v.stock;
        }

        if (stock < item.quantity) {
          return sendError(res, 400, `Insufficient stock to reorder "${item.productName}". Available: ${stock}.`);
        }

        newItems.push({
          productId: item.productId,
          quantity: item.quantity,
          variantName: item.variantName
        });
      }

      return sendSuccess(res, 200, 'Reorder validation passed. Items can be checked out.', {
        shopId,
        items: newItems,
        orderType: oldOrder.orderType,
        deliveryAddress: oldOrder.deliveryAddress
      });
    } catch (err) {
      console.error('[buyer.reorder]', err);
      return sendError(res, 500, 'Server error validating reorder.');
    }
  },

  /**
   * GET /api/buyer/shops/:id
   */
  getShopDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const shop = await Shop.findById(id).lean();
      if (!shop || shop.approvalStatus !== 'approved' || !shop.isActive) {
        return sendError(res, 404, 'Shop not found or is inactive.');
      }
      const products = await Product.find({ shopId: id, isActive: true }).lean();
      return sendSuccess(res, 200, 'Shop details retrieved.', { shop, products });
    } catch (err) {
      console.error('[buyer.getShopDetails]', err);
      return sendError(res, 500, 'Server error fetching shop details.');
    }
  },

  /**
   * GET /api/buyer/recommendations
   */
  getRecommendations: async (req, res) => {
    try {
      const { lat, lng } = req.query;

      // 1. Get user's past orders
      const orders = await Order.find({ buyerId: req.user._id })
        .populate('items.productId')
        .lean();

      const pastOrders = [];
      orders.forEach(o => {
        if (o.items) {
          o.items.forEach(item => {
            if (item.productId) {
              pastOrders.push({
                name: item.productId.name,
                category: item.productId.category,
                description: item.productId.description || ''
              });
            }
          });
        }
      });

      // 2. Fetch approved shops
      const approvedShops = await Shop.find({ approvalStatus: 'approved', isActive: true }).lean();
      const approvedShopIds = approvedShops.map(s => s._id);

      // 3. Fetch all active products from approved shops
      const availableProducts = await Product.find({ shopId: { $in: approvedShopIds }, isActive: true }).lean();

      // 4. Filter by location if user coords are passed (e.g. recommend items within 25km)
      let productsWithDistance = availableProducts;
      if (lat && lng) {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        productsWithDistance = availableProducts.map(p => {
          let distance = null;
          const s = approvedShops.find(shop => shop._id.toString() === p.shopId.toString());
          if (s && s.location && s.location.coordinates && s.location.coordinates.length === 2) {
            const [shopLng, shopLat] = s.location.coordinates;
            distance = getDistanceInKm(userLat, userLng, shopLat, shopLng);
          }
          return { ...p, distance };
        }).filter(p => p.distance === null || p.distance <= 25);
      }

      // 5. Query Gemini
      const recommendedIds = await getRecommendations(pastOrders, productsWithDistance);

      // 6. Fetch full recommended product details
      let recommendedProducts = [];
      if (recommendedIds && recommendedIds.length > 0) {
        const productMap = {};
        const productsFetched = await Product.find({ _id: { $in: recommendedIds } })
          .populate('shopId', 'name address category openingHours phone rating reviewCount location deliverySettings isOpen')
          .lean();
        
        productsFetched.forEach(p => {
          productMap[p._id.toString()] = p;
        });

        recommendedIds.forEach(id => {
          if (productMap[id]) {
            recommendedProducts.push(productMap[id]);
          }
        });
      }

      // 7. Fallback if Gemini failed or didn't return enough products
      if (recommendedProducts.length < 3) {
        const remainingLimit = 6 - recommendedProducts.length;
        const currentIds = recommendedProducts.map(p => p._id.toString());
        const fallbacks = await Product.find({
          shopId: { $in: approvedShopIds },
          isActive: true,
          _id: { $nin: currentIds }
        })
          .populate('shopId', 'name address category openingHours phone rating reviewCount location deliverySettings isOpen')
          .limit(remainingLimit)
          .lean();
        recommendedProducts = [...recommendedProducts, ...fallbacks];
      }

      return sendSuccess(res, 200, 'Recommendations retrieved.', { products: recommendedProducts });
    } catch (err) {
      console.error('[buyer.getRecommendations]', err);
      // Clean fallback so UI doesn't break
      try {
        const approvedShops = await Shop.find({ approvalStatus: 'approved', isActive: true }).lean();
        const approvedShopIds = approvedShops.map(s => s._id);
        const fallbackProducts = await Product.find({ shopId: { $in: approvedShopIds }, isActive: true })
          .populate('shopId', 'name address category openingHours phone rating reviewCount location deliverySettings isOpen')
          .limit(6)
          .lean();
        return sendSuccess(res, 200, 'Recommendations retrieved (fallback).', { products: fallbackProducts });
      } catch (fallbackErr) {
        return sendError(res, 500, 'Server error getting recommendations.');
      }
    }
  }
};

module.exports = buyerController;
