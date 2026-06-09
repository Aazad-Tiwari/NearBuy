require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { MONGODB_URI } = require('../config/constants');

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    
    const latestOrder = await Order.findOne().sort({ createdAt: -1 });
    if (!latestOrder) {
      console.log('No order found to update');
      process.exit(0);
    }
    
    console.log('Latest Order ID:', latestOrder._id);
    console.log('Current status:', latestOrder.status);
    console.log('Current pickupTime:', latestOrder.pickupTime);
    
    // Update pickupTime to 3 hours ago
    latestOrder.pickupTime = new Date(Date.now() - 3 * 60 * 60 * 1000);
    await latestOrder.save();
    console.log('Successfully updated pickupTime to 3 hours ago:', latestOrder.pickupTime);
    
    process.exit(0);
  } catch (err) {
    console.error('Error running script:', err);
    process.exit(1);
  }
};

run();
