const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const memoryStore = require('../config/memoryStore');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'emailpro_jwt_secret_key_2026_super_secure_987654');
      
      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        req.user = memoryStore.findUserById(decoded.id) || {
          _id: decoded.id,
          name: 'Demo Manager',
          email: 'demo@emailpro.com',
          smtpConfig: { senderName: 'Demo Manager', senderEmail: 'demo@emailpro.com' }
        };
      }
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      return next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
