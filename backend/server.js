try {
  require('dotenv').config();
} catch (e) {
  // In production environments (Render, Heroku, etc.), environment variables are injected directly by the platform
}

const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 [EmailPro Backend Server Running]`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Listening on: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
