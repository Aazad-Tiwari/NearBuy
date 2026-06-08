const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

// Require authentication and 'admin' role for all admin routes
router.use(authenticate, authorize('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/shops', adminController.getAllShops);
router.patch('/shops/:id/status', adminController.updateShopStatus);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/toggle-active', adminController.toggleUserActive);
router.get('/analytics', adminController.getAnalytics);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Reviews
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:id', adminController.deleteReview);

// Fraud logs
router.get('/fraud', adminController.getFraudAlerts);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
