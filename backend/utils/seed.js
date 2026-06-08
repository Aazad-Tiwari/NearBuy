require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const InventoryTransaction = require('../models/InventoryTransaction');
const { MONGODB_URI } = require('../config/constants');

const seedDB = async () => {
  try {
    console.log('Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Clearing old records...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Shop.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      InventoryTransaction.deleteMany({}),
    ]);
    console.log('Database cleared.');

    // 1. Create Default Categories
    console.log('Seeding categories...');
    const seededCategories = await Category.insertMany([
      { name: 'Grocery', icon: '🥬', isActive: true },
      { name: 'Pharmacy', icon: '💊', isActive: true },
      { name: 'Electronics', icon: '💻', isActive: true },
      { name: 'Sports', icon: '⚽', isActive: true },
      { name: 'Books', icon: '📚', isActive: true },
      { name: 'Clothing', icon: '👗', isActive: true },
    ]);
    console.log('Seeded categories successfully.');

    // 2. Create Users
    console.log('Seeding users...');
    
    // We register standard users. Hashing is automatic via model pre-save middleware.
    const adminUser = new User({
      name: 'Platform Administrator',
      email: 'admin@bopis.com',
      password: 'adminpassword',
      role: 'admin',
      phone: '9999999999',
    });
    await adminUser.save();

    const shopkeeper1 = new User({
      name: 'John Shopkeeper',
      email: 'shopkeeper1@bopis.com',
      password: 'shoppassword',
      role: 'shopkeeper',
      phone: '8888888888',
    });
    await shopkeeper1.save();

    const shopkeeper2 = new User({
      name: 'Alice PharmacyOwner',
      email: 'shopkeeper2@bopis.com',
      password: 'shoppassword',
      role: 'shopkeeper',
      phone: '7777777777',
    });
    await shopkeeper2.save();

    const buyer1 = new User({
      name: 'Bob Buyer (Koramangala)',
      email: 'buyer1@bopis.com',
      password: 'buyerpassword',
      role: 'buyer',
      phone: '6666666666',
    });
    await buyer1.save();

    const buyer2 = new User({
      name: 'Charlie Buyer (Whitefield)',
      email: 'buyer2@bopis.com',
      password: 'buyerpassword',
      role: 'buyer',
      phone: '5555555555',
    });
    await buyer2.save();

    console.log('Seeded users successfully.');

    // 3. Create Shops
    console.log('Seeding shops...');

    // Shop 1: Koramangala Grocery Store
    const shop1 = new Shop({
      name: 'Koramangala Organic Fresh Mart',
      description: 'Your premium local organic grocery partner.',
      category: 'Grocery',
      address: {
        street: '80 Feet Road, 4th Block',
        city: 'Koramangala, Bangalore',
        state: 'Karnataka',
        zipCode: '560034',
      },
      location: {
        type: 'Point',
        coordinates: [77.6245, 12.9348], // [longitude, latitude]
      },
      ownerId: shopkeeper1._id,
      approvalStatus: 'approved',
      phone: '9988998899',
      email: 'kora.fresh@bopis.com',
      openingHours: '8:00 AM - 10:00 PM',
      deliverySettings: {
        isEnabled: true,
        radius: 6, // 6km delivery radius limit
        charge: 35,
        minOrder: 100,
      },
      rating: 4.5,
      reviewCount: 1,
    });
    await shop1.save();

    // Shop 2: Whitefield Pharmacy
    const shop2 = new Shop({
      name: 'Whitefield Health Pharmacy',
      description: 'Medicines and healthcare products delivered in minutes.',
      category: 'Pharmacy',
      address: {
        street: 'ITPL Main Road',
        city: 'Whitefield, Bangalore',
        state: 'Karnataka',
        zipCode: '560066',
      },
      location: {
        type: 'Point',
        coordinates: [77.7499, 12.9698], // [longitude, latitude]
      },
      ownerId: shopkeeper2._id,
      approvalStatus: 'approved',
      phone: '9977997799',
      email: 'wf.health@bopis.com',
      openingHours: '9:00 AM - 9:00 PM',
      deliverySettings: {
        isEnabled: true,
        radius: 5, // 5km delivery radius limit
        charge: 50,
        minOrder: 150,
      },
      rating: 4.8,
      reviewCount: 1,
    });
    await shop2.save();

    // Shop 3: Pending Approval Shop
    const shop3 = new Shop({
      name: 'Indiranagar Electronics World',
      description: 'Laptops, mobile phones and customized PC building.',
      category: 'Electronics',
      address: {
        street: '100 Feet Road',
        city: 'Indiranagar, Bangalore',
        state: 'Karnataka',
        zipCode: '560038',
      },
      location: {
        type: 'Point',
        coordinates: [77.6412, 12.9719], // [longitude, latitude]
      },
      ownerId: shopkeeper1._id,
      approvalStatus: 'pending',
      phone: '9966996699',
      email: 'inagar.electro@bopis.com',
      openingHours: '10:00 AM - 9:00 PM',
      deliverySettings: {
        isEnabled: false,
        radius: 3,
        charge: 40,
        minOrder: 500,
      },
    });
    await shop3.save();

    console.log('Seeded shops successfully.');

    // 4. Create Products
    console.log('Seeding products...');

    // Products for Shop 1 (Koramangala Fresh Mart)
    const prod1 = new Product({
      name: 'Organic Bananas',
      description: 'Sweet organic farm bananas, rich in fiber and potassium.',
      price: 60,
      stock: 120,
      category: 'Grocery',
      subCategory: 'Fruits',
      sku: 'ORG-BAN-100',
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400',
      shopId: shop1._id,
      variants: [
        { name: '1 kg Strip', price: 60, stock: 80, sku: 'ORG-BAN-1KG' },
        { name: '2 kg Bundle', price: 110, stock: 40, sku: 'ORG-BAN-2KG' },
      ],
      isActive: true,
    });
    await prod1.save();

    const prod2 = new Product({
      name: 'Premium Basmati Rice',
      description: 'Super long grain basmati rice, pristine aroma.',
      price: 130,
      stock: 90,
      category: 'Grocery',
      subCategory: 'Rice & Grains',
      sku: 'BAS-RICE-200',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
      shopId: shop1._id,
      variants: [
        { name: '1 kg Bag', price: 130, stock: 60, sku: 'BAS-RICE-1KG' },
        { name: '5 kg Bag', price: 600, stock: 30, sku: 'BAS-RICE-5KG' },
      ],
      isActive: true,
    });
    await prod2.save();

    const prod3 = new Product({
      name: 'Fresh Whole Milk',
      description: 'Farm-fresh organic pasteurized whole milk.',
      price: 65,
      stock: 200,
      category: 'Grocery',
      subCategory: 'Dairy',
      sku: 'MILK-WHOLE',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400',
      shopId: shop1._id,
      variants: [
        { name: '500 ml Pouch', price: 35, stock: 120, sku: 'MILK-500ML' },
        { name: '1 Litre Bottle', price: 65, stock: 80, sku: 'MILK-1L' },
      ],
      isActive: true,
    });
    await prod3.save();

    // Products for Shop 2 (Whitefield Health Pharmacy)
    const prod4 = new Product({
      name: 'Vitamin C 500mg Supplements',
      description: 'Orange flavored chewable Vitamin C tablets for immunity booster.',
      price: 180,
      stock: 150,
      category: 'Pharmacy',
      subCategory: 'Vitamins',
      sku: 'VIT-C-500',
      imageUrl: 'https://images.unsplash.com/photo-1616679911721-ebd6eec18fcd?auto=format&fit=crop&q=80&w=400',
      shopId: shop2._id,
      variants: [
        { name: '30 Tablets Box', price: 180, stock: 100, sku: 'VIT-C-30TAB' },
        { name: '90 Tablets Box', price: 490, stock: 50, sku: 'VIT-C-90TAB' },
      ],
      isActive: true,
    });
    await prod4.save();

    const prod5 = new Product({
      name: 'Dolo 650mg tablets',
      description: 'Common analgesic and antipyretic for fever relief.',
      price: 32,
      stock: 500,
      category: 'Pharmacy',
      subCategory: 'Fever & Pain Relief',
      sku: 'DOLO-650',
      imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400',
      shopId: shop2._id,
      variants: [
        { name: 'Strip of 15', price: 32, stock: 500, sku: 'DOLO-STRIP' },
      ],
      isActive: true,
    });
    await prod5.save();

    console.log('Seeded products successfully.');

    // 5. Create some sample orders, reviews, audit logs, and inventory transaction records
    console.log('Seeding logs and orders...');
    
    // Create an initial completed order for Shop 1
    const order1 = new Order({
      buyerId: buyer1._id,
      shopId: shop1._id,
      items: [
        {
          productId: prod1._id,
          productName: 'Organic Bananas',
          variantName: '1 kg Strip',
          priceAtOrder: 60,
          quantity: 2,
        }
      ],
      totalAmount: 120,
      status: 'completed',
      orderType: 'pickup',
      verificationCode: '1234',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      pickupTime: new Date(Date.now() + 3600000), // 1 hour from now
    });
    await order1.save();

    // Create a review for order1
    const review1 = new Review({
      orderId: order1._id,
      buyerId: buyer1._id,
      shopId: shop1._id,
      rating: 5,
      comment: 'Excellent fresh bananas! The pickup was super fast and clean.',
    });
    await review1.save();

    // Create an initial completed order for Shop 2
    const order2 = new Order({
      buyerId: buyer2._id,
      shopId: shop2._id,
      items: [
        {
          productId: prod4._id,
          productName: 'Vitamin C 500mg Supplements',
          variantName: '30 Tablets Box',
          priceAtOrder: 180,
          quantity: 1,
        }
      ],
      totalAmount: 230, // 180 + 50 delivery
      status: 'completed',
      orderType: 'delivery',
      deliveryAddress: {
        street: 'Prestige Shantiniketan, Tower 5',
        city: 'Whitefield, Bangalore',
        state: 'Karnataka',
        zipCode: '560066',
      },
      deliveryCharge: 50,
      verificationCode: '5678',
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      pickupTime: new Date(Date.now() + 7200000), // 2 hours from now
    });
    await order2.save();

    // Create review for order 2
    const review2 = new Review({
      orderId: order2._id,
      buyerId: buyer2._id,
      shopId: shop2._id,
      rating: 4.8,
      comment: 'Delivered fast. Medicines were packed properly.',
    });
    await review2.save();

    // Inventory transactions
    await InventoryTransaction.create({
      productId: prod1._id,
      shopId: shop1._id,
      quantityChange: 120,
      type: 'restock',
      details: 'Initial inventory seeding.',
    });

    await InventoryTransaction.create({
      productId: prod1._id,
      shopId: shop1._id,
      quantityChange: -2,
      type: 'sale',
      orderId: order1._id,
      details: 'Sold 2 units of 1 kg Strip in Order.',
    });

    // Audit logs
    await AuditLog.create({
      action: 'SYSTEM_SEEDED',
      userId: adminUser._id,
      userRole: 'admin',
      details: 'Initialized platform database with mock seed data.',
    });

    console.log('Seeded logs and orders successfully.');
    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
