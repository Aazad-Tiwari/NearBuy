const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants');

const generateToken = (userId, role) => jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const generateVerificationCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const sendSuccess = (res, statusCode, message, data = {}) =>
  res.status(statusCode).json({ success: true, message, ...data });

const sendError = (res, statusCode, message, errors = null) =>
  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });

module.exports = {
  generateToken,
  generateVerificationCode,
  sendSuccess,
  sendError
};
