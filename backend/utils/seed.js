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

// Helper to generate dates relative to current time
const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
};

const hoursAgo = (h) => {
  const date = new Date();
  date.setHours(date.getHours() - h);
  return date;
};

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
      { name: 'Books', icon: '📚', isActive: true },
      { name: 'Clothing', icon: '👗', isActive: true },
      { name: 'Sports', icon: '⚽', isActive: true },
      { name: 'Beauty', icon: '💄', isActive: true },
      { name: 'Home & Garden', icon: '🏡', isActive: true },
      { name: 'Toys', icon: '🧸', isActive: true },
      { name: 'Food & Beverages', icon: '🥤', isActive: true },
    ]);
    console.log(`Seeded ${seededCategories.length} categories successfully.`);

    // 2. Create Users
    console.log('Seeding users...');
    
    // We register standard users. Hashing is automatic via model pre-save middleware.
    const adminUser = new User({
      name: 'Platform Administrator',
      email: 'admin@bopis.com',
      password: 'demo1234',
      role: 'admin',
      phone: '9999999999',
    });
    await adminUser.save();

    const shopkeeper1 = new User({
      name: 'John Shopkeeper',
      email: 'shopkeeper1@bopis.com',
      password: 'demo1234',
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
      password: 'demo1234',
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

    // High cancellation-rate user for fraud testing
    const fraudBuyer = new User({
      name: 'Frank Fraudster',
      email: 'fraud_buyer@bopis.com',
      password: 'buyerpassword',
      role: 'buyer',
      phone: '4444444444',
    });
    await fraudBuyer.save();

    console.log('Seeded users successfully.');

    // 3. Create Shops
    console.log('Seeding shops...');

    // Shop 1: Koramangala Grocery Store (Approved)
    const shop1 = new Shop({
      name: 'Koramangala Organic Fresh Mart',
      description: 'Your premium local organic grocery partner.',
      category: 'Grocery',
      address: {
        street: '80 Feet Road, 4th Block',
        city: 'Koramangala, Bangalore',
        state: 'Karnataka',
        zipCode: '560034',
        country: 'India',
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
      reviewCount: 2,
    });
    await shop1.save();

    // Shop 2: Whitefield Pharmacy (Approved)
    const shop2 = new Shop({
      name: 'Whitefield Health Pharmacy',
      description: 'Medicines and healthcare products delivered in minutes.',
      category: 'Pharmacy',
      address: {
        street: 'ITPL Main Road',
        city: 'Whitefield, Bangalore',
        state: 'Karnataka',
        zipCode: '560066',
        country: 'India',
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

    // Shop 3: Electronics Store (Pending Approval)
    const shop3 = new Shop({
      name: 'Indiranagar Electronics World',
      description: 'Laptops, mobile phones and customized PC building.',
      category: 'Electronics',
      address: {
        street: '100 Feet Road',
        city: 'Indiranagar, Bangalore',
        state: 'Karnataka',
        zipCode: '560038',
        country: 'India',
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

    // Shop 4: Clothing Store (Rejected Approval)
    const shop4 = new Shop({
      name: 'Koramangala Fashion Hub',
      description: 'Trendy apparel, footwear, and accessories.',
      category: 'Clothing',
      address: {
        street: '1st Block, Koramangala',
        city: 'Koramangala, Bangalore',
        state: 'Karnataka',
        zipCode: '560034',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.6310, 12.9290],
      },
      ownerId: shopkeeper1._id,
      approvalStatus: 'rejected',
      rejectionReason: 'Invalid business identification document. The upload was blurred and illegible.',
      phone: '9955995599',
      email: 'kora.fashion@bopis.com',
      openingHours: '10:00 AM - 8:30 PM',
      deliverySettings: {
        isEnabled: true,
        radius: 4,
        charge: 30,
        minOrder: 200,
      },
    });
    await shop4.save();

    // Shop 5: Book Shop (Modify Approval Request)
    const shop5 = new Shop({
      name: 'HSR Layout Book Haven',
      description: 'Your neighborhood escape into the world of literature and magazines.',
      category: 'Books',
      address: {
        street: '19th Main Road, HSR Sector 2',
        city: 'HSR Layout, Bangalore',
        state: 'Karnataka',
        zipCode: '560102',
        country: 'India',
      },
      location: {
        type: 'Point',
        coordinates: [77.6480, 12.9100],
      },
      ownerId: shopkeeper2._id,
      approvalStatus: 'modify',
      modificationFeedback: 'Please upload a higher resolution profile photo and verify the store owner\'s primary phone number.',
      phone: '9944994499',
      email: 'hsr.books@bopis.com',
      openingHours: '9:00 AM - 8:00 PM',
      deliverySettings: {
        isEnabled: true,
        radius: 5,
        charge: 20,
        minOrder: 100,
      },
    });
    await shop5.save();

    console.log('Seeded shops successfully.');

    // 4. Create Products
    console.log('Seeding products...');

    // Products for Shop 1 (Koramangala Fresh Mart)
    const p1 = await Product.create({
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

    const p2 = await Product.create({
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

    const p3 = await Product.create({
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

    const p4 = await Product.create({
      name: 'Fresh Red Apples',
      description: 'Crisp, sweet, and locally harvested Shimla red apples.',
      price: 180,
      stock: 100,
      category: 'Grocery',
      subCategory: 'Fruits',
      sku: 'ORG-APL-100',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400',
      shopId: shop1._id,
      variants: [
        { name: '1 kg Pack', price: 180, stock: 100, sku: 'ORG-APL-1KG' }
      ],
      isActive: true,
    });

    const p5 = await Product.create({
      name: 'Farm Organic Eggs',
      description: 'Free-range organic brown chicken eggs, rich in protein.',
      price: 90,
      stock: 150,
      category: 'Grocery',
      subCategory: 'Dairy & Eggs',
      sku: 'EGG-ORG-12',
      imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=400',
      shopId: shop1._id,
      variants: [
        { name: 'Dozen Box', price: 90, stock: 150, sku: 'EGG-ORG-12' }
      ],
      isActive: true,
    });

    const p6 = await Product.create({
      name: 'Whole Wheat Bread',
      description: 'Freshly baked local bakery bread made of 100% whole wheat.',
      price: 45,
      stock: 80,
      category: 'Grocery',
      subCategory: 'Bakery',
      sku: 'BRD-WHT-100',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
      shopId: shop1._id,
      variants: [
        { name: 'Standard Loaf', price: 45, stock: 80, sku: 'BRD-WHT-LOAF' }
      ],
      isActive: true,
    });

    // Products for Shop 2 (Whitefield Health Pharmacy)
    const p7 = await Product.create({
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

    const p8 = await Product.create({
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

    const p9 = await Product.create({
      name: 'Hand Sanitizer',
      description: '70% alcohol-based instant hand rub for advanced germ protection.',
      price: 75,
      stock: 120,
      category: 'Pharmacy',
      subCategory: 'Hygiene',
      sku: 'SAN-HND-100',
      imageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&q=80&w=400',
      shopId: shop2._id,
      variants: [
        { name: '100 ml Pump Bottle', price: 75, stock: 120, sku: 'SAN-HND-100ML' }
      ],
      isActive: true,
    });

    const p10 = await Product.create({
      name: 'N95 Face Mask',
      description: 'High filtration efficacy particulate respirator for anti-pollution and virus protection.',
      price: 120,
      stock: 300,
      category: 'Pharmacy',
      subCategory: 'Hygiene',
      sku: 'MSK-N95-01',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
      shopId: shop2._id,
      variants: [
        { name: 'Pack of 5', price: 120, stock: 300, sku: 'MSK-N95-P5' }
      ],
      isActive: true,
    });

    console.log('Seeded products successfully.');

    // 4.1 Programmatic Seeding of 150 Unique Shops & Variety of Products
    console.log('Seeding 150 additional unique shops and products...');

    // A. Generate additional shopkeeper users
    const generatedShopkeepers = [];
    for (let i = 1; i <= 30; i++) {
      const sk = new User({
        name: `Shopkeeper Partner ${i}`,
        email: `partner.shopkeeper${i}@bopis-demo.com`,
        password: 'demo1234',
        role: 'shopkeeper',
        phone: `9000000${String(i).padStart(3, '0')}`,
      });
      await sk.save();
      generatedShopkeepers.push(sk);
    }

    // Predefined product templates per category
    const productTemplates = {
      Grocery: [
        { name: 'Fresh Avocado', desc: 'Creamy Hass avocados, perfect for salads and toast.', price: 150, sub: 'Fruits', sku: 'AVC', img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400' },
        { name: 'Whole Wheat Pasta', desc: 'High-fiber organic semolina whole wheat pasta.', price: 95, sub: 'Grains', sku: 'PST', img: 'https://images.unsplash.com/photo-1563865436874-9aef32095ffd?auto=format&fit=crop&q=80&w=400' },
        { name: 'Oat Milk Unsweetened', desc: 'Dairy-free, creamy unsweetened oat drink.', price: 190, sub: 'Dairy Alternate', sku: 'OAT', img: 'https://images.unsplash.com/photo-1596450514735-111a2fe02935?auto=format&fit=crop&q=80&w=400' },
        { name: 'Organic Honey', desc: 'Pure raw unprocessed mountain honey.', price: 320, sub: 'Sweeteners', sku: 'HNY', img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400' }
      ],
      Pharmacy: [
        { name: 'Multivitamin Gummies', desc: 'Daily chewable multivitamin gummies for adults.', price: 450, sub: 'Vitamins', sku: 'MVT', img: 'https://images.unsplash.com/photo-1626847037657-fd3622613ce3?auto=format&fit=crop&q=80&w=400' },
        { name: 'Electric Heating Pad', desc: 'Fast heating orthopedic pad for back and joint pain relief.', price: 850, sub: 'Medical Equipment', sku: 'HTP', img: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400' },
        { name: 'Herbal Cough Syrup', desc: 'Non-drowsy ayurvedic cough formula with honey and tulsi.', price: 110, sub: 'Cough & Cold', sku: 'CGH', img: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=400' }
      ],
      Electronics: [
        { name: 'Wireless Noise-Canceling Earbuds', desc: 'True wireless earbuds with active noise cancellation and 30hr battery.', price: 3499, sub: 'Audio', sku: 'ERB', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400' },
        { name: 'Multi-port USB-C Hub', desc: '6-in-1 space gray aluminum adapter with HDMI, USB 3.0, and PD.', price: 1899, sub: 'Accessories', sku: 'HUB', img: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&q=80&w=400' },
        { name: 'Mechanical Gaming Keyboard', desc: 'RGB backlit mechanical keyboard with clicky blue switches.', price: 2999, sub: 'Computers', sku: 'KBD', img: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=400' }
      ],
      Books: [
        { name: 'Atomic Habits by James Clear', desc: 'An easy & proven way to build good habits & break bad ones.', price: 450, sub: 'Self-Help', sku: 'ATH', img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
        { name: 'Sapiens by Yuval Noah Harari', desc: 'A brief history of humankind, exploring our development through ages.', price: 499, sub: 'History', sku: 'SAP', img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400' },
        { name: 'Premium Hardcover Sketchbook', desc: 'A5 size, 160 GSM thick acid-free paper sketchbook for drawing.', price: 350, sub: 'Stationery', sku: 'SKB', img: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=400' }
      ],
      Clothing: [
        { name: 'Unisex Oversized Hoodie', desc: 'Super soft fleece lined hoodie, relaxed streetwear fit.', price: 1299, sub: 'Sweaters', sku: 'HDD', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400' },
        { name: 'Slim Fit Denim Jeans', desc: 'Classic stretchable blue wash denim jeans for daily wear.', price: 1799, sub: 'Pants', sku: 'JNS', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=400' },
        { name: 'Polarized Wayfarer Sunglasses', desc: 'UV400 protection lightweight travel sunglasses.', price: 899, sub: 'Accessories', sku: 'SGL', img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=400' }
      ],
      Sports: [
        { name: 'High-Density Yoga Mat', desc: '6mm non-slip cushioning yoga mat with carrying strap.', price: 799, sub: 'Fitness', sku: 'MAT', img: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&q=80&w=400' },
        { name: 'Stainless Steel Gym Shaker', desc: 'Insulated leakproof bottle with wire whisk ball.', price: 650, sub: 'Accessories', sku: 'SHK', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400' },
        { name: 'Adjustable Dumbbell Set', desc: 'Pair of 5kg vinyl coated adjustable hand weights.', price: 1499, sub: 'Weightlifting', sku: 'DBL', img: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&q=80&w=400' }
      ],
      Beauty: [
        { name: 'Organic Aloe Vera Gel', desc: '99% pure cold-pressed soothing moisturizer for face and hair.', price: 220, sub: 'Skincare', sku: 'ALV', img: 'https://images.unsplash.com/photo-1560963689-a2959c894c2f?auto=format&fit=crop&q=80&w=400' },
        { name: 'Matte Liquid Lipstick', desc: 'Long-lasting smudge-proof matte lipstick with high pigment.', price: 450, sub: 'Makeup', sku: 'LPS', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=400' },
        { name: 'Sunscreen SPF 50 PA+++', desc: 'Ultra-light gel sunscreen, non-greasy matte finish.', price: 395, sub: 'Skincare', sku: 'SUN', img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=400' }
      ],
      'Home & Garden': [
        { name: 'Minimalist Ceramic Flower Pot', desc: 'Modern white round clay planter with drainage hole.', price: 420, sub: 'Garden', sku: 'POT', img: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=400' },
        { name: 'Warm LED Table Lamp', desc: 'Dimmable wood base nightstand reading lamp.', price: 1250, sub: 'Lighting', sku: 'LMP', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=400' },
        { name: 'Scented Lavender Candle', desc: 'Natural soy wax aromatherapy candle, 40hr burn time.', price: 349, sub: 'Decor', sku: 'CND', img: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=400' }
      ],
      Toys: [
        { name: 'Magnetic Building Blocks', desc: '3D building tiles educational STEM set of 60pcs.', price: 1599, sub: 'Educational', sku: 'MAG', img: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=400' },
        { name: 'Classic Board Game', desc: 'Traditional strategic multiplayer family board game.', price: 550, sub: 'Family', sku: 'BRD', img: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=400' },
        { name: 'Soft Plush Teddy Bear', desc: 'Super huggable brown teddy bear made with organic cotton.', price: 699, sub: 'Plush', sku: 'TED', img: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?auto=format&fit=crop&q=80&w=400' }
      ],
      'Food & Beverages': [
        { name: 'Artisanal Medium Roast Coffee', desc: 'Freshly roasted whole arabica beans sourced from Coorg.', price: 450, sub: 'Beverages', sku: 'COF', img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=400' },
        { name: 'Organic Matcha Green Tea', desc: 'Premium grade stone-ground Japanese matcha powder.', price: 890, sub: 'Beverages', sku: 'MTC', img: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400' },
        { name: 'Roasted Salted Almonds', desc: 'Crunchy premium California almonds roasted with Himalayan pink salt.', price: 299, sub: 'Snacks', sku: 'ALM', img: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d96?auto=format&fit=crop&q=80&w=400' }
      ]
    };

    // Arrays of naming components for shops
    const areas = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'JP Nagar', 'Malleshwaram', 'BTM Layout', 'Sadashivanagar', 'Hebbal', 'Rajajinagar', 'Banashankari', 'Electronic City', 'Marathahalli', 'Domlur', 'Bellandur', 'Ulsoor', 'Basavanagudi'];
    const prefixes = ['Royal', 'Green', 'Elite', 'Super', 'Choice', 'Metro', 'Smart', 'Central', 'Mega', 'Daily', 'Pure', 'Quick', 'Local', 'Value', 'Star', 'First', 'Prime', 'Nature'];
    const suffixes = ['Mart', 'Store', 'Hub', 'Plaza', 'Corner', 'Point', 'World', 'Haven', 'Zone', 'Bazaar', 'Shop', 'Market', 'Emporium', 'Station'];

    const categoriesList = ['Grocery', 'Pharmacy', 'Electronics', 'Books', 'Clothing', 'Sports', 'Beauty', 'Home & Garden', 'Toys', 'Food & Beverages'];

    const newShops = [];
    const newProducts = [];

    for (let i = 1; i <= 150; i++) {
      const area = areas[i % areas.length];
      const prefix = prefixes[(i * 3) % prefixes.length];
      const suffix = suffixes[(i * 7) % suffixes.length];
      const category = categoriesList[i % categoriesList.length];
      const name = `${area} ${prefix} ${category} ${suffix}`;

      // Distribute coordinates in a radius around Bangalore center (77.6, 12.95)
      const latOffset = (Math.sin(i) * 0.08) + (Math.cos(i * 2) * 0.01);
      const lngOffset = (Math.cos(i) * 0.08) + (Math.sin(i * 2) * 0.01);
      const latitude = 12.95 + latOffset;
      const longitude = 77.6 + lngOffset;

      const owner = generatedShopkeepers[i % generatedShopkeepers.length];

      const shop = new Shop({
        name,
        description: `Your local source for premium, high-quality ${category.toLowerCase()} products. Quick pickup available.`,
        category,
        address: {
          street: `${Math.floor((i * 17) % 150) + 1} Main Road, Block ${Math.floor((i * 5) % 5) + 1}`,
          city: `${area}, Bangalore`,
          state: 'Karnataka',
          zipCode: `5600${String(Math.floor((i * 13) % 90) + 10).padStart(2, '0')}`,
          country: 'India',
        },
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        ownerId: owner._id,
        approvalStatus: 'approved',
        phone: `9${String(i).padStart(3, '0')}000${String(150 - i).padStart(3, '0')}`,
        email: `${prefix.toLowerCase()}.${suffix.toLowerCase()}${i}@bopis-demo.com`,
        openingHours: '9:00 AM - 9:30 PM',
        deliverySettings: {
          isEnabled: Math.random() > 0.3,
          radius: Math.floor(Math.random() * 5) + 3,
          charge: Math.floor(Math.random() * 30) + 20,
          minOrder: Math.floor(Math.random() * 100) + 50,
        },
        rating: parseFloat((4.0 + (Math.sin(i) * 0.5) + (Math.random() * 0.5)).toFixed(1)),
        reviewCount: Math.floor((i * 11) % 40) + 5,
      });

      newShops.push(shop);

      // Create products for this shop
      const templates = productTemplates[category] || [];
      const numProducts = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 products
      
      for (let j = 0; j < numProducts; j++) {
        const template = templates[j % templates.length];
        const priceModifier = Math.floor((i * 7 + j * 13) % 15) - 7;
        const finalPrice = Math.max(template.price + priceModifier, 10);
        const finalStock = Math.floor((i * 23 + j * 31) % 120) + 20;

        const product = new Product({
          name: `${prefix} ${template.name}`,
          description: `${template.desc} Handpicked and supplied by ${name}.`,
          price: finalPrice,
          stock: finalStock,
          category: template.category || category,
          subCategory: template.sub,
          sku: `${template.sku}-${prefix.substring(0,3).toUpperCase()}-${i}`,
          imageUrl: template.img,
          shopId: shop._id,
          variants: [
            { name: 'Standard Pack', price: finalPrice, stock: finalStock, sku: `${template.sku}-${prefix.substring(0,3).toUpperCase()}-${i}-STD` }
          ],
          isActive: true,
        });

        newProducts.push(product);
      }
    }

    const seededShops = await Shop.insertMany(newShops);
    const seededProducts = await Product.insertMany(newProducts);
    console.log(`Seeded an additional ${seededShops.length} approved shops and ${seededProducts.length} products successfully programmatically!`);

    // 5. Create Orders (Spanning 14 days to populate analytics)
    console.log('Seeding orders...');

    const ordersData = [
      // 1. Completed Pickup Order (12 Days Ago)
      {
        buyerId: buyer1._id,
        shopId: shop1._id,
        items: [{ productId: p1._id, productName: p1.name, variantName: '1 kg Strip', quantity: 2, priceAtOrder: p1.price }],
        totalAmount: 120,
        status: 'completed',
        orderType: 'pickup',
        verificationCode: '1111',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        pickupTime: daysAgo(12),
        createdAt: daysAgo(12),
      },
      // 2. Completed Delivery Order (10 Days Ago)
      {
        buyerId: buyer2._id,
        shopId: shop2._id,
        items: [{ productId: p7._id, productName: p7.name, variantName: '30 Tablets Box', quantity: 1, priceAtOrder: p7.price }],
        totalAmount: 230, // 180 + 50 delivery
        status: 'completed',
        orderType: 'delivery',
        deliveryAddress: { street: 'Prestige Shantiniketan', city: 'Whitefield, Bangalore', state: 'Karnataka', zipCode: '560066' },
        deliveryCharge: 50,
        verificationCode: '2222',
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        pickupTime: daysAgo(10),
        createdAt: daysAgo(10),
      },
      // 3. Completed Pickup Order (8 Days Ago)
      {
        buyerId: buyer1._id,
        shopId: shop1._id,
        items: [{ productId: p2._id, productName: p2.name, variantName: '1 kg Bag', quantity: 2, priceAtOrder: p2.price }],
        totalAmount: 260,
        status: 'completed',
        orderType: 'pickup',
        verificationCode: '3333',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        pickupTime: daysAgo(8),
        createdAt: daysAgo(8),
      },
      // 4. Confirmed Order (6 Days Ago)
      {
        buyerId: buyer2._id,
        shopId: shop1._id,
        items: [{ productId: p3._id, productName: p3.name, variantName: '1 Litre Bottle', quantity: 1, priceAtOrder: p3.price }],
        totalAmount: 65,
        status: 'confirmed',
        orderType: 'pickup',
        verificationCode: '4444',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        pickupTime: daysAgo(6),
        createdAt: daysAgo(6),
      },
      // 5. Packed Order (4 Days Ago)
      {
        buyerId: buyer1._id,
        shopId: shop1._id,
        items: [{ productId: p4._id, productName: p4.name, variantName: '1 kg Pack', quantity: 1, priceAtOrder: p4.price }],
        totalAmount: 180,
        status: 'packed',
        orderType: 'pickup',
        verificationCode: '5555',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        pickupTime: daysAgo(4),
        createdAt: daysAgo(4),
      },
      // 6. Ready Order (2 Days Ago)
      {
        buyerId: buyer1._id,
        shopId: shop1._id,
        items: [{ productId: p6._id, productName: p6.name, variantName: 'Standard Loaf', quantity: 2, priceAtOrder: p6.price }],
        totalAmount: 90,
        status: 'ready',
        orderType: 'pickup',
        verificationCode: '6666',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        pickupTime: daysAgo(2),
        createdAt: daysAgo(2),
      },
      // 7. Out For Delivery Order (1 Day Ago)
      {
        buyerId: buyer2._id,
        shopId: shop2._id,
        items: [{ productId: p9._id, productName: p9.name, variantName: '100 ml Pump Bottle', quantity: 2, priceAtOrder: p9.price }],
        totalAmount: 200, // 150 + 50 delivery
        status: 'out_for_delivery',
        orderType: 'delivery',
        deliveryAddress: { street: 'Brookefield Main Rd', city: 'Whitefield, Bangalore', state: 'Karnataka', zipCode: '560037' },
        deliveryCharge: 50,
        verificationCode: '7777',
        paymentMethod: 'online',
        paymentStatus: 'paid',
        pickupTime: daysAgo(1),
        createdAt: daysAgo(1),
      },
      // 8. Pending Order (12 Hours Ago)
      {
        buyerId: buyer1._id,
        shopId: shop1._id,
        items: [{ productId: p5._id, productName: p5.name, variantName: 'Dozen Box', quantity: 1, priceAtOrder: p5.price }],
        totalAmount: 90,
        status: 'pending',
        orderType: 'pickup',
        verificationCode: '8888',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        pickupTime: hoursAgo(6),
        createdAt: hoursAgo(12),
      },
      // 9. Cancelled Order (7 Days Ago)
      {
        buyerId: buyer2._id,
        shopId: shop2._id,
        items: [{ productId: p8._id, productName: p8.name, variantName: 'Strip of 15', quantity: 3, priceAtOrder: p8.price }],
        totalAmount: 146, // 96 + 50 delivery
        status: 'cancelled',
        orderType: 'delivery',
        deliveryAddress: { street: 'ITPL Main Road', city: 'Whitefield, Bangalore', state: 'Karnataka', zipCode: '560066' },
        deliveryCharge: 50,
        verificationCode: '9999',
        paymentMethod: 'online',
        paymentStatus: 'refunded',
        pickupTime: daysAgo(7),
        createdAt: daysAgo(7),
      },
      // 10. Cancelled Order (5 Days Ago)
      {
        buyerId: buyer2._id,
        shopId: shop1._id,
        items: [{ productId: p1._id, productName: p1.name, variantName: '1 kg Strip', quantity: 1, priceAtOrder: p1.price }],
        totalAmount: 60,
        status: 'cancelled',
        orderType: 'pickup',
        verificationCode: '0000',
        paymentMethod: 'online',
        paymentStatus: 'failed',
        pickupTime: daysAgo(5),
        createdAt: daysAgo(5),
      },

      // --- FRAUD BUYER SET ---
      // 11. Fraud Buyer Cancelled Order 1
      {
        buyerId: fraudBuyer._id,
        shopId: shop1._id,
        items: [{ productId: p1._id, productName: p1.name, variantName: '1 kg Strip', quantity: 2, priceAtOrder: p1.price }],
        totalAmount: 120,
        status: 'cancelled',
        orderType: 'pickup',
        verificationCode: '1212',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        pickupTime: daysAgo(4),
        createdAt: daysAgo(4),
      },
      // 12. Fraud Buyer Cancelled Order 2
      {
        buyerId: fraudBuyer._id,
        shopId: shop1._id,
        items: [{ productId: p2._id, productName: p2.name, variantName: '1 kg Bag', quantity: 1, priceAtOrder: p2.price }],
        totalAmount: 130,
        status: 'cancelled',
        orderType: 'pickup',
        verificationCode: '1313',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        pickupTime: daysAgo(3),
        createdAt: daysAgo(3),
      },
      // 13. Fraud Buyer Cancelled Order 3
      {
        buyerId: fraudBuyer._id,
        shopId: shop1._id,
        items: [{ productId: p3._id, productName: p3.name, variantName: '500 ml Pouch', quantity: 4, priceAtOrder: p3.price }],
        totalAmount: 140,
        status: 'cancelled',
        orderType: 'pickup',
        verificationCode: '1414',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        pickupTime: daysAgo(2),
        createdAt: daysAgo(2),
      },
      // 14. Fraud Buyer Pending Order 4
      {
        buyerId: fraudBuyer._id,
        shopId: shop1._id,
        items: [{ productId: p6._id, productName: p6.name, variantName: 'Standard Loaf', quantity: 1, priceAtOrder: p6.price }],
        totalAmount: 45,
        status: 'pending',
        orderType: 'pickup',
        verificationCode: '1515',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        pickupTime: hoursAgo(1),
        createdAt: hoursAgo(2),
      },
    ];

    const seededOrders = await Order.insertMany(ordersData);
    console.log(`Seeded ${seededOrders.length} orders successfully.`);

    // 6. Create Reviews for Completed Orders
    console.log('Seeding reviews...');
    
    // Review 1: Bob reviewing Shop 1 (Fresh Mart)
    const rev1 = new Review({
      orderId: seededOrders[0]._id,
      buyerId: buyer1._id,
      shopId: shop1._id,
      rating: 5,
      comment: 'Excellent fresh organic bananas! The pickup at Koramangala was super fast and the shopkeeper was polite.',
      reply: 'Thank you for shopping with us, Bob! Glad you loved the freshness.',
    });
    await rev1.save();

    // Review 2: Charlie reviewing Shop 2 (Whitefield Health Pharmacy)
    const rev2 = new Review({
      orderId: seededOrders[1]._id,
      buyerId: buyer2._id,
      shopId: shop2._id,
      rating: 4.8,
      comment: 'Extremely quick medicine delivery. Dolo and vitamins were packaged well with clear instructions.',
      reply: 'Thanks Charlie! We strive to deliver health as fast as possible.',
    });
    await rev2.save();

    // Review 3: Bob reviewing Shop 1 (Fresh Mart) for basmati rice
    const rev3 = new Review({
      orderId: seededOrders[2]._id,
      buyerId: buyer1._id,
      shopId: shop1._id,
      rating: 4,
      comment: 'The Premium Basmati Rice smells great and has long grains. Packaging could have been a bit sturdier.',
    });
    await rev3.save();

    console.log('Seeded reviews and replies successfully.');

    // 7. Seed Notifications
    console.log('Seeding notifications...');
    const notificationsData = [
      // Bob (Buyer 1)
      { userId: buyer1._id, title: 'Welcome to NearBuy! 🎉', message: 'Discover shops near your current location and order online for pick up or quick delivery.', type: 'info', isRead: true },
      { userId: buyer1._id, title: 'Order Ready for Pick Up! 🛍️', message: 'Your order #6666 at Koramangala Organic Fresh Mart is packed and ready. Show verification code: 6666.', type: 'success', isRead: false },
      
      // Charlie (Buyer 2)
      { userId: buyer2._id, title: 'Order Shipped! 🚚', message: 'Your healthcare items from Whitefield Health Pharmacy are out for delivery.', type: 'info', isRead: false },
      
      // John Shopkeeper (Shopkeeper 1)
      { userId: shopkeeper1._id, title: 'Store Approved! 📈', message: 'Congratulations! Your shop "Koramangala Organic Fresh Mart" has been approved by the admin.', type: 'success', isRead: true },
      { userId: shopkeeper1._id, title: 'Store Rejected ❌', message: 'Your store application for "Koramangala Fashion Hub" was rejected. Reason: Blur image upload.', type: 'error', isRead: false },
      { userId: shopkeeper1._id, title: 'New Order Received! 🔔', message: 'You have received a new pending order from Bob Buyer.', type: 'info', isRead: false },
      
      // Alice PharmacyOwner (Shopkeeper 2)
      { userId: shopkeeper2._id, title: 'Modifications Requested 📋', message: 'Admin requested details modification for "HSR Layout Book Haven". Please update profiles and images.', type: 'warning', isRead: false },
    ];
    await Notification.insertMany(notificationsData);
    console.log('Seeded notifications successfully.');

    // 8. Seed Inventory Transactions
    console.log('Seeding inventory transactions...');
    const transactions = [
      { productId: p1._id, shopId: shop1._id, quantityChange: 122, type: 'restock', details: 'Initial inventory seeding.' },
      { productId: p1._id, shopId: shop1._id, quantityChange: -2, type: 'sale', orderId: seededOrders[0]._id, details: 'Sold 2 units of 1 kg Strip in Order.' },
      { productId: p2._id, shopId: shop1._id, quantityChange: 92, type: 'restock', details: 'Initial stock addition.' },
      { productId: p2._id, shopId: shop1._id, quantityChange: -2, type: 'sale', orderId: seededOrders[2]._id, details: 'Sold 2 units of 1 kg Bag in Order.' },
      { productId: p7._id, shopId: shop2._id, quantityChange: 151, type: 'restock', details: 'Seeded supplements.' },
      { productId: p7._id, shopId: shop2._id, quantityChange: -1, type: 'sale', orderId: seededOrders[1]._id, details: 'Sold 1 unit of 30 Tablets Box in Order.' },
    ];
    await InventoryTransaction.insertMany(transactions);
    console.log('Seeded inventory transactions successfully.');

    // 9. Seed Audit Logs
    console.log('Seeding audit logs...');
    const auditLogs = [
      { action: 'SYSTEM_SEEDED', userId: adminUser._id, userRole: 'admin', details: 'Platform database successfully seeded with full simulated production dataset.' },
      { action: 'SHOP_APPROVED', userId: adminUser._id, userRole: 'admin', details: 'Approved store "Koramangala Organic Fresh Mart" (ID: ' + shop1._id + ').' },
      { action: 'SHOP_APPROVED', userId: adminUser._id, userRole: 'admin', details: 'Approved store "Whitefield Health Pharmacy" (ID: ' + shop2._id + ').' },
      { action: 'SHOP_REJECTED', userId: adminUser._id, userRole: 'admin', details: 'Rejected store "Koramangala Fashion Hub" (ID: ' + shop4._id + ') due to blur documents.' },
      { action: 'CATEGORY_CREATED', userId: adminUser._id, userRole: 'admin', details: 'Created category "Beauty".' },
      { action: 'CATEGORY_CREATED', userId: adminUser._id, userRole: 'admin', details: 'Created category "Home & Garden".' },
    ];
    await AuditLog.insertMany(auditLogs);
    console.log('Seeded audit logs successfully.');

    console.log('\n🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
