const mongoose = require('mongoose');

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emailpro';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000
    });
    console.log(`[EmailPro] MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    console.error(`[EmailPro Warning] MongoDB Connection Error: ${error.message}`);
    console.warn(`[EmailPro] Please set MONGODB_URI on Render or start local MongoDB on port 27017.`);
    isConnecting = false;

    // Retry connection in background every 10 seconds without crashing Express
    setTimeout(() => {
      connectDB();
    }, 10000);
  }
};

module.exports = connectDB;
