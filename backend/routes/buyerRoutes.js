const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const { authenticate, authorize } = require('../middlewares/auth');

// Require authentication and 'buyer' role for all buyer routes
router.use(authenticate, authorize('buyer'));

router.get('/search', buyerController.search);
router.get('/recommendations', buyerController.getRecommendations);
router.get('/shops/:id', buyerController.getShopDetails);
router.get('/products/:id/compare', buyerController.comparePrices);
router.post('/shopping-list/optimize', buyerController.optimizeShoppingList);
router.post('/orders', buyerController.placeOrder);
router.get('/orders', buyerController.getMyOrders);
router.post('/orders/:id/cancel', buyerController.cancelOrder);
router.post('/orders/:id/review', buyerController.submitReview);
router.get('/orders/:id/reviews', buyerController.getOrderReview);
router.post('/favorites/toggle', buyerController.toggleFavorite);
router.get('/favorites', buyerController.getFavorites);
router.get('/notifications', buyerController.getNotifications);
router.patch('/notifications/:id/read', buyerController.markNotificationRead);
router.post('/orders/:id/reorder', buyerController.reorderOrder);

module.exports = router;
