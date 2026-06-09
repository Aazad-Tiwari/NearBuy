const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const shopkeeperRoutes = require('./shopkeeperRoutes');
const buyerRoutes = require('./buyerRoutes');
const uploadRoutes = require('./uploadRoutes');
const notificationRoutes = require('./notificationRoutes');
const publicRoutes = require('./publicRoutes');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/shopkeeper', shopkeeperRoutes);
router.use('/buyer', buyerRoutes);
router.use('/uploads', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/public', publicRoutes);

module.exports = router;
