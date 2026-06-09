require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const path = require('path');

const { PORT } = require('./config/constants');
const connectDB = require('./config/db');
const apiRouter = require('./routes/index');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');
const { startOrderScheduler } = require('./utils/orderScheduler');

const app = express();

const CORS_ORIGIN = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL || 'http://localhost:5173')
  : '*';
app.use(cors({ origin: CORS_ORIGIN, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

connectDB();
startOrderScheduler();

app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'BOPIS API', timestamp: new Date().toISOString(), node: process.version })
);

app.use(notFoundHandler);
app.use(globalErrorHandler);
const server = app.listen(PORT, () => {
  console.log(`\n🚀  BOPIS server running at http://localhost:${PORT}`);
  console.log(`📡  Health check   → http://localhost:${PORT}/health`);
  console.log(`🔑  Environment    → ${process.env.NODE_ENV || 'development'}\n`);
});

// Handle port-in-use gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.`);
    console.error(`   Run: lsof -ti :${PORT} | xargs kill -9`);
    console.error(`   Then restart the server.\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Closing server...`);
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
