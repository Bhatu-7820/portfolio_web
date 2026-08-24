const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const templateRoutes = require('./routes/templateRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const emailRoutes = require('./routes/emailRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');
const unsubscribeRoutes = require('./routes/unsubscribeRoutes');

const app = express();

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads directory serving
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'EmailPro API Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounts
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/unsubscribe', unsubscribeRoutes);

// Find frontend production dist directory across all possible paths
const possibleDistPaths = [
  path.join(__dirname, '../frontend/dist'),
  path.join(__dirname, '../dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(process.cwd(), 'dist')
];

let activeDistPath = possibleDistPaths.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

if (activeDistPath) {
  console.log(`[EmailPro Static] Serving production frontend from: ${activeDistPath}`);
  app.use(express.static(activeDistPath));

  // Client-side SPA routing fallback for non-API GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(activeDistPath, 'index.html'));
  });
} else {
  console.warn('[EmailPro Static Warning] Production frontend dist directory not found yet.');
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; background: #0a0a0c; color: #fff; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="color: #10b981;">🚀 EmailPro Backend API Server is Live!</h1>
        <p>Frontend production build is serving from Render.</p>
        <p><a href="/api/health" style="color: #38bdf8;">Check API Health Status</a></p>
      </div>
    `);
  });
}

// 404 handler for missing API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found` });
});

// Global Central Error Handler
app.use(errorHandler);

module.exports = app;
