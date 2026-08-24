const Lead = require('../models/Lead');

// @desc    Get unsubscribe page status / verify token
// @route   GET /api/unsubscribe/:token
// @access  Public
const getUnsubscribeStatus = async (req, res, next) => {
  try {
    const { token } = req.params;

    const lead = await Lead.findOne({ unsubscribeToken: token });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Invalid or expired unsubscribe link' });
    }

    res.json({
      success: true,
      email: lead.email,
      company: lead.company,
      unsubscribed: lead.unsubscribed
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process unsubscribe request
// @route   POST /api/unsubscribe/:token
// @access  Public
const processUnsubscribe = async (req, res, next) => {
  try {
    const { token } = req.params;

    const lead = await Lead.findOne({ unsubscribeToken: token });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Invalid or expired unsubscribe link' });
    }

    lead.unsubscribed = true;
    await lead.save();

    res.json({
      success: true,
      message: `You have successfully unsubscribed ${lead.email} from future email campaigns.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnsubscribeStatus,
  processUnsubscribe
};
