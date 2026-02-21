require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const locationRoutes = require('./routes/location');
const requestRoutes = require('./routes/requests');
const profileRoutes = require('./routes/profiles');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:8080',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Logging
app.use(morgan('combined'));

// Stripe webhook needs raw body BEFORE json parsing
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/profile', profileRoutes);
// /api/washers provides washer-specific profile lookups as an alias
app.use('/api/washers', require('./routes/profiles'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve static frontend for non-API routes only
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath, { index: false }));
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use(errorHandler);

// Database init + server start
const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    if (process.env.DATABASE_URL) {
      const pool = require('./config/database');
      await pool.query('SELECT 1');
      console.log('Database connected');

      // Run migrations
      const fs = require('fs');
      const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', 'init.sql'), 'utf8');
      await pool.query(migrationSQL);
      console.log('Migrations complete');
    } else {
      console.warn('No DATABASE_URL set, skipping database connection');
    }
  } catch (err) {
    console.error('Database setup error:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`Laundry Bubbles API running on port ${PORT}`);
  });
}

startServer();
