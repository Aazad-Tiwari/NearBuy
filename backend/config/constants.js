const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bopis';
const JWT_SECRET = process.env.JWT_SECRET || 'bopis_dev_secret_change_in_prod';
const JWT_EXPIRES_IN = '7d';

// Warn if using default JWT secret in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️  CRITICAL: JWT_SECRET env variable is not set! Using insecure default. Set a strong secret in production.');
}
const SALT_ROUNDS = 12;

const SHOP_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Grocery',
  'Pharmacy',
  'Books',
  'Sports',
  'Home & Garden',
  'Toys',
  'Food & Beverages',
  'Beauty',
  'Other'
];

const ORDER_STATUSES = ['pending', 'confirmed', 'packed', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

module.exports = {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SALT_ROUNDS,
  SHOP_CATEGORIES,
  ORDER_STATUSES
};
