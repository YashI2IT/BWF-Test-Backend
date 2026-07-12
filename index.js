const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const PORT = process.env.PORT || 5000;

const connectDB = require('./utils/configure');

// CORS
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow exact matches from CLIENT_URL list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow all Vercel preview deployments
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true
}));

// DB
connectDB();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Auth Routes
app.use('/api', require('./auth/route'));

// Warden Routes
app.use('/api/warden', require('./warden/routes'));

// Student Routes
app.use("/api/student", require("./student/routes"));

// Teacher Routes
app.use("/api/teacher", require("./teacher/routes"));

app.get('/', (req, res) => res.send('BWF Server running...'));

// Health check endpoint — used by uptime monitors to prevent Render free tier sleep
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  require('fs').appendFileSync('debug.log', new Date().toISOString() + ' - Express Error: ' + (err.stack || err) + '\n');
  res.status(500).json({ error: 'Server error', details: err.message, stack: err.stack });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);

  // Self-ping every 10 minutes to prevent Render free tier sleep
  if (process.env.NODE_ENV === 'production') {
    const https = require('https');
    setInterval(() => {
      https.get(`https://bwf-backend-wg6b.onrender.com/health`, (res) => {
        console.log(`Self-ping status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('Self-ping failed:', err.message);
      });
    }, 10 * 60 * 1000); // every 10 minutes
  }
});