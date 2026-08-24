const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Production Static Serving for Single-Service Render Deployments
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Central Error Handler
app.use(errorHandler);

module.exports = app;

