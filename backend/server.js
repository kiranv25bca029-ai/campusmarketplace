const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  fallthrough: false,
  maxAge: '7d',
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
}));

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.get('/check', (req, res) => {
    res.send('Server Check Working!');
});
console.log("PRODUCT API ROUTE REGISTERED");
// Test route
app.get('/', (req, res) => {
    res.send('Campus Marketplace Backend is Running!');
});

// Connect first so the API does not accept requests while MongoDB is unavailable.
const PORT = process.env.PORT || 5001;

async function startServer() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error('MONGO_URI and JWT_SECRET must be configured');
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected Successfully!');

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Backend startup failed:', error.message);
  process.exit(1);
});

app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

app.use((error, _req, res, _next) => {
  if (error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  console.error('Unhandled API error:', error.message);
  res.status(error.status || 500).json({
    message: error.status ? error.message : 'Internal server error'
  });
});