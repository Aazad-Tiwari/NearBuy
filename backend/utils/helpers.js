const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const InventoryTransaction = require('../models/InventoryTransaction');

/**
 * createNotification - saves a notification alert for a user
 */
const createNotification = async (userId, title, message, type = 'info', link = '') => {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};

/**
 * logAudit - registers system-wide audit transactions
 */
const logAudit = async (action, userId, userRole, details) => {
  try {
    await AuditLog.create({ action, userId, userRole, details });
  } catch (err) {
    console.error('Error logging audit action:', err.message);
  }
};

/**
 * logInventoryTransaction - registers inventory stock movement transactions
 */
const logInventoryTransaction = async (productId, shopId, quantityChange, type, orderId = null, details = '') => {
  try {
    await InventoryTransaction.create({ productId, shopId, quantityChange, type, orderId, details });
  } catch (err) {
    console.error('Error logging inventory transaction:', err.message);
  }
};

module.exports = {
  createNotification,
  logAudit,
  logInventoryTransaction
};
