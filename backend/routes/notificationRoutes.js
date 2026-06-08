const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middlewares/auth');
const { sendSuccess, sendError } = require('../utils/response');

// All notification routes require authentication (any role)
router.use(authenticate);

/**
 * GET /api/notifications
 * Returns notifications for the currently logged-in user (any role)
 */
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return sendSuccess(res, 200, 'Notifications retrieved.', { notifications });
  } catch (err) {
    return sendError(res, 500, 'Server error fetching notifications.');
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a notification as read for the current user
 */
router.patch('/:id/read', async (req, res) => {
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
});

module.exports = router;
