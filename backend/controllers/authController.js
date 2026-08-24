const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { seedUserData } = require('../config/seed');
const memoryStore = require('../config/memoryStore');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'emailpro_jwt_secret_key_2026_super_secure_987654', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields (Name, Email, Password)' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    // Standalone Memory Fallback if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      console.log(`[Auth] MongoDB offline - registering user via Standalone Memory Engine`);
      const existing = memoryStore.findUserByEmail(cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, message: 'User already exists with this email address.' });
      }

      const newUser = memoryStore.createUser({
        name: name.trim(),
        email: cleanEmail,
        password,
        smtpConfig: {
          senderName: name.trim(),
          senderEmail: cleanEmail,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: cleanEmail,
          smtpPassword: ''
        }
      });

      memoryStore.seedDemoDataIfNeeded(newUser._id);
      const token = generateToken(newUser._id);

      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          smtpConfig: newUser.smtpConfig
        }
      });
    }

    // Standard MongoDB path
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address. Please sign in.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      smtpConfig: {
        senderName: name.trim(),
        senderEmail: cleanEmail,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: cleanEmail,
        smtpPassword: ''
      }
    });

    try {
      await seedUserData(user._id);
    } catch (seedErr) {
      console.warn('[Register] Seed warning:', seedErr.message);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        smtpConfig: user.smtpConfig
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    next(error);
  }
};

// @desc    Login user & return token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Standalone Memory Fallback if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      console.log(`[Auth] MongoDB offline - authenticating user via Standalone Memory Engine`);
      let user = memoryStore.findUserByEmail(cleanEmail);
      if (!user) {
        // Auto-create account for instant demo login convenience
        user = memoryStore.createUser({
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          password,
          smtpConfig: {
            senderName: cleanEmail.split('@')[0],
            senderEmail: cleanEmail,
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUser: cleanEmail,
            smtpPassword: ''
          }
        });
      }

      memoryStore.seedDemoDataIfNeeded(user._id);
      const token = generateToken(user._id);

      return res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          smtpConfig: user.smtpConfig
        }
      });
    }

    // Standard MongoDB path
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    try {
      await seedUserData(user._id);
    } catch (seedErr) {
      console.warn('[Login] Seed warning:', seedErr.message);
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        smtpConfig: user.smtpConfig
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const memUser = memoryStore.findUserById(req.user._id) || req.user;
      return res.json({
        success: true,
        user: {
          _id: memUser._id,
          name: memUser.name,
          email: memUser.email,
          smtpConfig: memUser.smtpConfig || {
            senderName: memUser.name,
            senderEmail: memUser.email,
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUser: memUser.email
          }
        }
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        smtpConfig: {
          senderName: user.smtpConfig?.senderName || user.name,
          senderEmail: user.smtpConfig?.senderEmail || user.email,
          smtpHost: user.smtpConfig?.smtpHost || 'smtp.gmail.com',
          smtpPort: user.smtpConfig?.smtpPort || 587,
          smtpUser: user.smtpConfig?.smtpUser || user.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
