const express = require('express');
const router = express.Router();
const shopkeeperController = require('../controllers/shopkeeperController');
const { authenticate, authorize } = require('../middlewares/auth');

// Require authentication and 'shopkeeper' role for all shopkeeper routes
router.use(authenticate, authorize('shopkeeper'));

router.post('/shops', shopkeeperController.registerShop);
router.get('/shops/me', shopkeeperController.getMyShop);
router.patch('/shops/me', shopkeeperController.updateMyShop);
router.get('/products', shopkeeperController.getMyProducts);
router.post('/products', shopkeeperController.addProduct);
router.patch('/products/:id', shopkeeperController.updateProduct);
router.delete('/products/:id', shopkeeperController.deleteProduct);
router.get('/orders', shopkeeperController.getIncomingOrders);
router.patch('/orders/:id/status', shopkeeperController.updateOrderStatus);
router.get('/analytics', shopkeeperController.getAnalytics);
router.get('/inventory/history', shopkeeperController.getInventoryHistory);

module.exports = router;
