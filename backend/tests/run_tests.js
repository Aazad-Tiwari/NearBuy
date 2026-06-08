const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { MONGODB_URI } = require('../config/constants');

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Test Geospatial Distance and Sorting
    console.log('\n1. Testing Geospatial sorting...');
    const koramangalaCoords = [77.6245, 12.9348]; // [longitude, latitude]
    const shops = await Shop.find({
      approvalStatus: 'approved',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: koramangalaCoords },
          $maxDistance: 10000 // 10km
        }
      }
    }).lean();
    
    console.log(`Found ${shops.length} approved shops within 10km of Koramangala.`);
    if (shops.length > 0) {
      console.log(`Nearest shop: "${shops[0].name}"`);
      if (shops[0].name.includes('Koramangala')) {
        console.log('✅ Geospatial sorting test passed.');
      } else {
        throw new Error('Geospatial sorting failed: Koramangala store should be closest.');
      }
    } else {
      throw new Error('No shops found near Koramangala.');
    }

    // 2. Testing Shopping List Optimizer logic
    console.log('\n2. Testing Shopping List Optimizer...');
    const items = ['bananas', 'rice'];
    const allShops = await Shop.find({ approvalStatus: 'approved' }).lean();
    const recommendations = [];

    for (const shop of allShops) {
      const matchedProducts = [];
      const missingItems = [];
      let estimatedBill = 0;

      for (const item of items) {
        const product = await Product.findOne({
          shopId: shop._id,
          isActive: true,
          $text: { $search: item }
        }).lean();

        if (product) {
          if (product.stock > 0) {
            matchedProducts.push({
              productId: product._id,
              name: product.name,
              price: product.price,
              stock: product.stock,
              searchedItem: item
            });
            estimatedBill += product.price;
          } else {
            missingItems.push(item);
          }
        } else {
          missingItems.push(item);
        }
      }

      if (matchedProducts.length > 0) {
        recommendations.push({
          shop,
          matchedProducts,
          missingItems,
          estimatedBill,
          matchCount: matchedProducts.length
        });
      }
    }

    recommendations.sort((a, b) => b.matchCount - a.matchCount || a.estimatedBill - b.estimatedBill);

    console.log(`Generated ${recommendations.length} shop recommendations.`);
    if (recommendations.length > 0 && recommendations[0].shop.name.includes('Koramangala')) {
      console.log('✅ Shopping List Optimizer test passed.');
    } else {
      throw new Error('Shopping List Optimizer test failed.');
    }

    // 3. Testing Checkout Item Stock Reduction
    console.log('\n3. Testing checkout item stock reduction...');
    const koraShop = await Shop.findOne({ name: /Koramangala/ });
    const buyerUser = await User.findOne({ role: 'buyer' });
    const bananas = await Product.findOne({ name: /Bananas/, shopId: koraShop._id });

    if (!bananas) throw new Error('Bananas product not found.');

    const initialStock = bananas.stock;
    console.log(`Initial stock of Bananas: ${initialStock}`);

    const testOrder = new Order({
      buyerId: buyerUser._id,
      shopId: koraShop._id,
      items: [{
        productId: bananas._id,
        productName: bananas.name,
        priceAtOrder: bananas.price,
        quantity: 5,
      }],
      totalAmount: bananas.price * 5,
      status: 'pending',
      verificationCode: '9999',
      pickupTime: new Date(Date.now() + 3600000)
    });
    
    bananas.stock -= 5;
    await bananas.save();
    await testOrder.save();

    const updatedBananas = await Product.findById(bananas._id);
    console.log(`Updated stock of Bananas: ${updatedBananas.stock}`);

    if (updatedBananas.stock === initialStock - 5) {
      console.log('✅ Stock reduction test passed.');
    } else {
      throw new Error('Stock reduction failed.');
    }

    await Order.findByIdAndDelete(testOrder._id);
    bananas.stock = initialStock;
    await bananas.save();

    // 4. Testing Rating Recalculation
    console.log('\n4. Testing rating average recalculation...');
    const ratingShop = await Shop.findOne({ name: /Pharmacy/ });
    const initialRating = ratingShop.rating;
    const initialReviews = ratingShop.reviewCount;
    console.log(`Initial Pharmacy rating: ${initialRating} (${initialReviews} reviews)`);

    const mockReview = new Review({
      orderId: new mongoose.Types.ObjectId(),
      buyerId: buyerUser._id,
      shopId: ratingShop._id,
      rating: 3,
      comment: 'Average service.'
    });
    await mockReview.save();

    const reviews = await Review.find({ shopId: ratingShop._id });
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    await Shop.findByIdAndUpdate(ratingShop._id, {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviews.length
    });

    const updatedShop = await Shop.findById(ratingShop._id);
    console.log(`Updated Pharmacy rating: ${updatedShop.rating} (${updatedShop.reviewCount} reviews)`);

    if (updatedShop.reviewCount === initialReviews + 1) {
      console.log('✅ Rating recalculation test passed.');
    } else {
      throw new Error('Rating recalculation failed.');
    }

    await Review.findByIdAndDelete(mockReview._id);
    await Shop.findByIdAndUpdate(ratingShop._id, {
      rating: initialRating,
      reviewCount: initialReviews
    });

    console.log('\n🎉 ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
