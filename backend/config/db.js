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
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[EmailPro] MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    console.error(`[EmailPro Warning] MongoDB Connection Failed: ${error.message}`);
    console.warn(`[EmailPro] Retrying MongoDB connection in 5 seconds...`);
    isConnecting = false;

    // Retry connection automatically without terminating the Express process
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB;
