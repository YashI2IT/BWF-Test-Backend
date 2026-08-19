const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 5000;

const connectDB = require('./utils/configure');

// ==================== CORS ====================

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Exact allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Allow localhost development
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true
}));

// ==================== DATABASE ====================

connectDB();

// ==================== MIDDLEWARE ====================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true
}));

// Request Logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);

  const originalSend = res.send;

  res.send = function (body) {
    if (res.statusCode === 404) {
      console.log(`[404] ${req.method} ${req.url}`);
    }

    return originalSend.call(this, body);
  };

  next();
});

app.use(cookieParser());

// Uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ==================== ROUTES ====================

// Authentication
app.use('/api', require('./auth/route'));

// Community
app.use(
  '/api/community',
  require('./student/community/routes')
);

// Warden
app.use(
  '/api/warden',
  require('./warden/routes')
);

// Student
app.use(
  '/api/student',
  require('./student/routes')
);

// Teacher
app.use(
  '/api/teacher',
  require('./teacher/routes')
);

// Admin
app.use(
  '/api/admin',
  require('./admin/routes')
);

// ==================== BASIC ROUTES ====================

app.get('/', (req, res) => {
  res.send('BWF Server running...');
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ==================== GLOBAL ERROR HANDLER ====================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  try {
    require('fs').appendFileSync(
      'debug.log',
      new Date().toISOString() +
      ' - Express Error: ' +
      (err.stack || err) +
      '\n'
    );
  } catch (e) {
    console.error('Could not write debug log:', e);
  }

  res.status(500).json({
    message: 'Server error (Global): ' + err.message
  });
});

// ==================== SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BWF Server listening on port ${PORT}`);
});
