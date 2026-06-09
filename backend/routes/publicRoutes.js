const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const User = require('../models/User');
const Order = require('../models/Order');

/**
 * GET /api/public/stats
 * Returns live counters for landing page display
 */
router.get('/stats', async (req, res) => {
  try {
    const [shopsCount, buyersCount, completedOrdersCount] = await Promise.all([
      Shop.countDocuments({ approvalStatus: 'approved' }),
      User.countDocuments({ role: 'buyer' }),
      Order.countDocuments({ status: 'completed' }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Public stats retrieved successfully.',
      data: {
        shops: shopsCount,
        buyers: buyersCount,
        pickups: completedOrdersCount
      }
    });
  } catch (err) {
    console.error('[public.stats] Error fetching stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching statistics.'
    });
  }
});

module.exports = router;
