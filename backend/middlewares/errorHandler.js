const { sendError } = require('../utils/response');

const notFoundHandler = (_req, res) => {
  sendError(res, 404, 'Route not found.');
};

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, _req, res, _next) => {
  console.error('[Global Error]', err);
  sendError(res, err.status || 500, err.message || 'An unexpected server error occurred.');
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
