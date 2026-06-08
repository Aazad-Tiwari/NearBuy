const Shop = require('../models/Shop');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/response');
const { createNotification } = require('../utils/helpers');


const adminController = {

  getAllShops: async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        filter.approvalStatus = status;
      }

      const skip = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
      const [shops, total] = await Promise.all([
        Shop.find(filter)
          .populate('ownerId', 'name email phone createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Shop.countDocuments(filter),
      ]);

      return sendSuccess(res, 200, 'Shops retrieved.', {
        shops,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      });
    } catch (err) {
      console.error('[admin.getAllShops]', err);
      return sendError(res, 500, 'Server error fetching shops.');
    }
  },

  getDashboardStats: async (req, res) => {
    try {
      const [
        pendingShops,
        approvedShops,
        rejectedShops,
        totalUsers,
        totalOrders,
        totalProducts,
        recentOrders,
        revenueResult,
        completedOrdersCount,
        recentShops,
        recentUsers
      ] = await Promise.all([
        Shop.countDocuments({ approvalStatus: 'pending' }),
        Shop.countDocuments({ approvalStatus: 'approved' }),
        Shop.countDocuments({ approvalStatus: 'rejected' }),
        User.countDocuments(),
        Order.countDocuments(),
        Product.countDocuments(),
        Order.find().sort({ createdAt: -1 }).limit(5).populate('buyerId', 'name').populate('shopId', 'name').lean(),
        Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Order.countDocuments({ status: 'completed' }),
        Shop.find().sort({ createdAt: -1 }).limit(5).populate('ownerId', 'name').lean(),
        User.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      const estimatedRevenue = revenueResult[0]?.total || 0;

      // Build dynamic activity feed
      const activities = [];

      recentOrders.forEach(o => {
        activities.push({
          timestamp: o.createdAt,
          icon: '🎟️',
          text: `Order of ₹${o.totalAmount} placed by ${o.buyerId?.name || 'Buyer'} at ${o.shopId?.name || 'Shop'}`,
          color: 'text-cyan-400'
        });
      });

      recentShops.forEach(s => {
        if (s.approvalStatus === 'pending') {
          activities.push({
            timestamp: s.createdAt,
            icon: '📋',
            text: `Shop "${s.name}" submitted registration by ${s.ownerId?.name || 'Shopkeeper'}`,
            color: 'text-amber-400'
          });
        } else if (s.approvalStatus === 'approved') {
          activities.push({
            timestamp: s.updatedAt || s.createdAt,
            icon: '✅',
            text: `Shop "${s.name}" approved by Admin`,
            color: 'text-emerald-400'
          });
        } else {
          activities.push({
            timestamp: s.updatedAt || s.createdAt,
            icon: '❌',
            text: `Shop "${s.name}" rejected: ${s.rejectionReason || 'Incomplete details'}`,
            color: 'text-rose-400'
          });
        }
      });

      recentUsers.forEach(u => {
        activities.push({
          timestamp: u.createdAt,
          icon: '👥',
          text: `New ${u.role} "${u.name}" registered`,
          color: u.role === 'buyer' ? 'text-cyan-400' : u.role === 'shopkeeper' ? 'text-violet-400' : 'text-amber-400'
        });
      });

      // Sort activities by timestamp descending
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentActivities = activities.slice(0, 8);

      return sendSuccess(res, 200, 'Dashboard stats retrieved.', {
        stats: {
          pendingShops,
          approvedShops,
          rejectedShops,
          totalShops: pendingShops + approvedShops + rejectedShops,
          totalUsers,
          totalOrders,
          totalProducts,
          estimatedRevenue,
          completedOrdersCount,
        },
        recentOrders,
        recentActivities,
        recentShops,
      });
    } catch (err) {
      console.error('[admin.getDashboardStats]', err);
      return sendError(res, 500, 'Server error fetching stats.');
    }
  },

  /**
   * PATCH /api/admin/shops/:id/status
   * Body: { status: 'approved' | 'rejected', rejectionReason? }
   */
  updateShopStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      if (!['approved', 'rejected', 'modify'].includes(status)) {
        return sendError(res, 400, 'Status must be "approved", "rejected", or "modify".');
      }

      const shop = await Shop.findById(id);
      if (!shop) return sendError(res, 404, 'Shop not found.');

      shop.approvalStatus = status;
      if (status === 'rejected' && rejectionReason) {
        shop.rejectionReason = rejectionReason;
      } else if (status === 'modify' && rejectionReason) {
        shop.modificationFeedback = rejectionReason;
      }
      await shop.save();

      // Notify the shopkeeper of the status change
      try {
        const notificationMap = {
          approved: {
            title: '🎉 Store Approved!',
            message: `Your store "${shop.name}" has been approved and is now live on NearBuy. Start adding products!`,
            type: 'success',
          },
          rejected: {
            title: '❌ Store Application Rejected',
            message: `Your store "${shop.name}" was rejected. Reason: ${rejectionReason || 'Please contact support.'}`,
            type: 'error',
          },
          modify: {
            title: '📋 Modifications Requested for Your Store',
            message: `Admin has requested changes to "${shop.name}": ${rejectionReason || 'Please update your store details.'}`,
            type: 'warning',
          },
        };
        const notif = notificationMap[status];
        if (notif && shop.ownerId) {
          await createNotification(shop.ownerId, notif.title, notif.message, notif.type, '/shopkeeper/store');
        }
      } catch (notifErr) {
        // Non-fatal: log but don't fail the request
        console.warn('[admin.updateShopStatus] Failed to send notification:', notifErr.message);
      }

      return sendSuccess(res, 200, `Shop has been marked as ${status}.`, { shop });
    } catch (err) {
      console.error('[admin.updateShopStatus]', err);
      return sendError(res, 500, 'Server error updating shop status.');
    }
  },

  /**
   * GET /api/admin/users
   */
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
      return sendSuccess(res, 200, 'Users retrieved.', { users });
    } catch (err) {
      console.error('[admin.getAllUsers]', err);
      return sendError(res, 500, 'Server error fetching users.');
    }
  },

  /**
   * PATCH /api/admin/users/:id/toggle-active
   */
  toggleUserActive: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) return sendError(res, 404, 'User not found.');

      if (user.role === 'admin') {
        return sendError(res, 400, 'Admin accounts are protected and status cannot be toggled.');
      }

      user.isActive = !user.isActive;
      await user.save();

      return sendSuccess(res, 200, `User is now ${user.isActive ? 'active' : 'inactive'}.`, {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt,
        }
      });
    } catch (err) {
      console.error('[admin.toggleUserActive]', err);
      return sendError(res, 500, 'Server error toggling user status.');
    }
  },

  /**
   * GET /api/admin/analytics
   */
  getAnalytics: async (req, res) => {
    try {
      // Calculate date range for the last 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      const [orders, shopsCreated, statusCounts, categoryCounts] = await Promise.all([
        Order.find({ createdAt: { $gte: fourteenDaysAgo } }, 'createdAt').lean(),
        Shop.find({ createdAt: { $gte: fourteenDaysAgo } }, 'createdAt').lean(),
        Order.aggregate([
          {
            $group: {
              _id: '$status',
              value: { $sum: 1 }
            }
          }
        ]),
        Order.aggregate([
          {
            $lookup: {
              from: 'shops',
              localField: 'shopId',
              foreignField: '_id',
              as: 'shop'
            }
          },
          { $unwind: '$shop' },
          {
            $group: {
              _id: '$shop.category',
              value: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 0,
              label: '$_id',
              value: 1
            }
          },
          { $sort: { value: -1 } }
        ])
      ]);

      // Generate dateMap and labels for last 14 days
      const dateMap = {};
      const weekLabels = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const localDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        weekLabels.push(label);
        dateMap[localDateKey] = { index: 13 - i };
      }

      const ordersOverTime = new Array(14).fill(0);
      const registrationTrend = new Array(14).fill(0);

      orders.forEach(order => {
        const d = new Date(order.createdAt);
        const localDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dateMap[localDateKey] !== undefined) {
          ordersOverTime[dateMap[localDateKey].index]++;
        }
      });

      shopsCreated.forEach(shop => {
        const d = new Date(shop.createdAt);
        const localDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dateMap[localDateKey] !== undefined) {
          registrationTrend[dateMap[localDateKey].index]++;
        }
      });

      const colors = {
        completed: '#10b981',
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        packed: '#06b6d4',
        ready: '#8b5cf6',
        out_for_delivery: '#f97316',
        cancelled: '#ef4444'
      };

      const ordersByStatus = ['completed', 'pending', 'confirmed', 'packed', 'ready', 'out_for_delivery', 'cancelled'].map(status => {
        const found = statusCounts.find(s => s._id === status);
        const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return {
          label,
          value: found ? found.value : 0,
          color: colors[status] || '#64748b'
        };
      });

      // Ensure categoryBreakdown is populated with at least a fallback if empty
      let categoryBreakdown = categoryCounts;
      if (!categoryBreakdown || categoryBreakdown.length === 0) {
        categoryBreakdown = [
          { label: 'Electronics', value: 0 },
          { label: 'Sports',      value: 0 },
          { label: 'Pharmacy',    value: 0 },
          { label: 'Grocery',     value: 0 },
          { label: 'Others',      value: 0 },
        ];
      }

      return sendSuccess(res, 200, 'Analytics retrieved.', {
        ordersOverTime,
        registrationTrend,
        weekLabels,
        ordersByStatus,
        categoryBreakdown
      });
    } catch (err) {
      console.error('[admin.getAnalytics]', err);
      return sendError(res, 500, 'Server error fetching analytics.');
    }
  },

  /**
   * GET /api/admin/categories
   */
  getCategories: async (req, res) => {
    try {
      const Category = require('../models/Category');
      const categories = await Category.find().sort({ name: 1 }).lean();
      return sendSuccess(res, 200, 'Categories retrieved.', { categories });
    } catch (err) {
      return sendError(res, 500, 'Server error fetching categories.');
    }
  },

  /**
   * POST /api/admin/categories
   */
  createCategory: async (req, res) => {
    try {
      const Category = require('../models/Category');
      const { name, icon } = req.body;
      if (!name) return sendError(res, 400, 'Category name is required.');
      
      const category = await Category.create({ name: name.trim(), icon });
      const { logAudit } = require('../utils/helpers');
      await logAudit('CATEGORY_CREATED', req.user._id, req.user.role, `Created category "${name}"`);
      
      return sendSuccess(res, 201, 'Category created.', { category });
    } catch (err) {
      if (err.code === 11000) return sendError(res, 409, 'Category already exists.');
      return sendError(res, 500, 'Server error creating category.');
    }
  },

  /**
   * PATCH /api/admin/categories/:id
   */
  updateCategory: async (req, res) => {
    try {
      const Category = require('../models/Category');
      const { id } = req.params;
      const { name, icon, isActive } = req.body;
      
      const category = await Category.findByIdAndUpdate(id, { name, icon, isActive }, { new: true });
      if (!category) return sendError(res, 404, 'Category not found.');
      
      const { logAudit } = require('../utils/helpers');
      await logAudit('CATEGORY_UPDATED', req.user._id, req.user.role, `Updated category to "${name}"`);
      
      return sendSuccess(res, 200, 'Category updated.', { category });
    } catch (err) {
      return sendError(res, 500, 'Server error updating category.');
    }
  },

  /**
   * DELETE /api/admin/categories/:id
   */
  deleteCategory: async (req, res) => {
    try {
      const Category = require('../models/Category');
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) return sendError(res, 404, 'Category not found.');
      
      const { logAudit } = require('../utils/helpers');
      await logAudit('CATEGORY_DELETED', req.user._id, req.user.role, `Deleted category "${category.name}"`);
      
      return sendSuccess(res, 200, 'Category deleted.');
    } catch (err) {
      return sendError(res, 500, 'Server error deleting category.');
    }
  },

  /**
   * GET /api/admin/reviews
   */
  getAllReviews: async (req, res) => {
    try {
      const Review = require('../models/Review');
      const reviews = await Review.find()
        .populate('buyerId', 'name email')
        .populate('shopId', 'name category')
        .sort({ createdAt: -1 })
        .lean();
      return sendSuccess(res, 200, 'Reviews retrieved.', { reviews });
    } catch (err) {
      return sendError(res, 500, 'Server error fetching reviews.');
    }
  },

  /**
   * DELETE /api/admin/reviews/:id
   */
  deleteReview: async (req, res) => {
    try {
      const Review = require('../models/Review');
      const review = await Review.findByIdAndDelete(req.params.id);
      if (!review) return sendError(res, 404, 'Review not found.');
      
      // Re-calculate average shop rating
      const reviews = await Review.find({ shopId: review.shopId });
      const avgRating = reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length) : 0;
      await Shop.findByIdAndUpdate(review.shopId, {
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: reviews.length
      });

      const { logAudit } = require('../utils/helpers');
      await logAudit('REVIEW_DELETED', req.user._id, req.user.role, `Deleted review ID ${review._id}`);
      
      return sendSuccess(res, 200, 'Review deleted.');
    } catch (err) {
      return sendError(res, 500, 'Server error deleting review.');
    }
  },

  /**
   * GET /api/admin/fraud
   * Detect potential fraud: high cancellation rates for users (e.g. >3 cancellations and cancellation rate > 50%)
   */
  getFraudAlerts: async (req, res) => {
    try {
      const buyers = await User.find({ role: 'buyer' }).lean();
      const alerts = [];

      for (const buyer of buyers) {
        const totalOrders = await Order.countDocuments({ buyerId: buyer._id });
        if (totalOrders < 3) continue;

        const cancelledOrders = await Order.countDocuments({ buyerId: buyer._id, status: 'cancelled' });
        const cancellationRate = (cancelledOrders / totalOrders) * 100;

        if (cancelledOrders >= 3 && cancellationRate >= 40) {
          alerts.push({
            buyer: { _id: buyer._id, name: buyer.name, email: buyer.email, phone: buyer.phone },
            totalOrders,
            cancelledOrders,
            cancellationRate: parseFloat(cancellationRate.toFixed(1)),
            reason: `High cancellation rate of ${cancellationRate.toFixed(1)}% (${cancelledOrders} of ${totalOrders} orders)`
          });
        }
      }

      return sendSuccess(res, 200, 'Fraud alerts retrieved.', { alerts });
    } catch (err) {
      return sendError(res, 500, 'Server error fetching fraud alerts.');
    }
  },

  /**
   * GET /api/admin/audit-logs
   */
  getAuditLogs: async (req, res) => {
    try {
      const AuditLog = require('../models/AuditLog');
      const logs = await AuditLog.find()
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();
      return sendSuccess(res, 200, 'Audit logs retrieved.', { logs });
    } catch (err) {
      return sendError(res, 500, 'Server error fetching audit logs.');
    }
  }
};

module.exports = adminController;
