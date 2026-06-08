const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const User = require('../models/User');
const { sendError } = require('../utils/response');

/**
 * authenticate — verifies JWT from Authorization header and attaches req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return sendError(res, 401, 'Invalid token — user not found or deactivated.');
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 401, 'Session expired. Please log in again.');
    return sendError(res, 401, 'Invalid token.');
  }
};

/**
 * authorize — restricts access to specific roles
 * Usage: authorize('admin') or authorize('shopkeeper', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return sendError(res, 403, `Forbidden. This action requires role: ${roles.join(' or ')}.`);
  }
  next();
};

module.exports = {
  authenticate,
  authorize
};
