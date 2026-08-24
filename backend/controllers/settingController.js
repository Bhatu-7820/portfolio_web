const User = require('../models/User');
const nodemailer = require('nodemailer');

// @desc    Get user SMTP & sender settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      settings: {
        senderName: user.smtpConfig?.senderName || process.env.SENDER_NAME || '',
        senderEmail: user.smtpConfig?.senderEmail || process.env.SENDER_EMAIL || '',
        smtpHost: user.smtpConfig?.smtpHost || process.env.SMTP_HOST || '',
        smtpPort: user.smtpConfig?.smtpPort || process.env.SMTP_PORT || 587,
        smtpUser: user.smtpConfig?.smtpUser || process.env.SMTP_USER || '',
        isPasswordSet: Boolean(user.smtpConfig?.smtpPassword || process.env.SMTP_PASSWORD)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user SMTP & sender settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const { senderName, senderEmail, smtpHost, smtpPort, smtpUser, smtpPassword } = req.body;

    const user = await User.findById(req.user._id);

    user.smtpConfig = {
      senderName: senderName || user.smtpConfig?.senderName || 'EmailPro Sender',
      senderEmail: senderEmail || user.smtpConfig?.senderEmail || '',
      smtpHost: smtpHost || '',
      smtpPort: smtpPort ? Number(smtpPort) : 587,
      smtpUser: smtpUser || '',
      smtpPassword: smtpPassword ? smtpPassword : user.smtpConfig?.smtpPassword || ''
    };

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        senderName: user.smtpConfig.senderName,
        senderEmail: user.smtpConfig.senderEmail,
        smtpHost: user.smtpConfig.smtpHost,
        smtpPort: user.smtpConfig.smtpPort,
        smtpUser: user.smtpConfig.smtpUser,
        isPasswordSet: Boolean(user.smtpConfig.smtpPassword)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test SMTP Connection
// @route   POST /api/settings/test-smtp
// @access  Private
const testSmtpConnection = async (req, res, next) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword } = req.body;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      return res.status(400).json({ success: false, message: 'SMTP Host, User, and Password are required to test connection' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPassword },
      tls: { rejectUnauthorized: false }
    });

    await transporter.verify();

    res.json({
      success: true,
      message: 'SMTP connection verified successfully! Connection established.'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: `SMTP Verification Failed: ${error.message}`
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  testSmtpConnection
};
