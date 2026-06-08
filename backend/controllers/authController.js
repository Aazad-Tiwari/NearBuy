const User = require('../models/User');
const { generateToken, sendSuccess, sendError } = require('../utils/response');

const authController = {
  /**
   * POST /api/auth/register
   * Body: { name, email, password, role?, phone? }
   */
  register: async (req, res) => {
    try {
      const { name, email, password, role, phone } = req.body;
      if (!name?.trim() || !email?.trim() || !password) {
        return sendError(res, 400, 'Name, email, and password are required.');
      }
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return sendError(res, 409, 'An account with this email already exists.');

      const allowedRoles = ['shopkeeper', 'buyer'];
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: allowedRoles.includes(role) ? role : 'buyer',
        phone,
      });

      const token = generateToken(user._id, user.role);
      return sendSuccess(res, 201, 'Account created successfully.', { token, user: user.toSafeObject() });
    } catch (err) {
      console.error('[register]', err);
      return sendError(res, 500, 'Server error during registration.');
    }
  },

  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return sendError(res, 400, 'Email and password are required.');

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) return sendError(res, 401, 'Invalid email or password.');

      const isValid = await user.comparePassword(password);
      if (!isValid) return sendError(res, 401, 'Invalid email or password.');

      if (!user.isActive) return sendError(res, 403, 'Account is deactivated. Contact support.');

      const token = generateToken(user._id, user.role);
      return sendSuccess(res, 200, 'Login successful.', { token, user: user.toSafeObject() });
    } catch (err) {
      console.error('[login]', err);
      return sendError(res, 500, 'Server error during login.');
    }
  },

  /**
   * GET /api/auth/me
   */
  getProfile: async (req, res) => {
    return sendSuccess(res, 200, 'Profile retrieved.', { user: req.user.toSafeObject() });
  },
};

module.exports = authController;
