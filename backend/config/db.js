const mongoose = require('mongoose');

// Disable command buffering so Mongoose never hangs for 10s when disconnected
mongoose.set('bufferCommands', false);

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/emailpro';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 3000
    });
    console.log(`[EmailPro] MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    console.error(`[EmailPro Warning] MongoDB Connection Error: ${error.message}`);
    console.warn(`[EmailPro] Operating in Standalone Memory Mode.`);
    isConnecting = false;

    // Retry connection silently in background every 15 seconds
    setTimeout(() => {
      connectDB();
    }, 15000);
  }
};

module.exports = connectDB;
