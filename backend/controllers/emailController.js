const { sendIndividualEmail, sendBulkCampaignEmail } = require('../services/emailService');
const UploadedFile = require('../models/UploadedFile');
const EmailLog = require('../models/EmailLog');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');

// @desc    Send individual email to a single lead or custom address
// @route   POST /api/emails/send
// @access  Private
const sendSingleEmail = async (req, res, next) => {
  try {
    const { leadId, customEmail, customName, subject, htmlContent, attachmentId } = req.body;

    if ((!leadId && !customEmail) || !subject || !htmlContent) {
      return res.status(400).json({ success: false, message: 'Recipient Lead or Email, Subject, and HTML Content are required' });
    }

    let attachmentFile = null;
    if (attachmentId) {
      attachmentFile = await UploadedFile.findOne({ _id: attachmentId, uploadedBy: req.user._id });
    }

    const result = await sendIndividualEmail({
      userId: req.user._id,
      user: req.user,
      leadId,
      customEmail,
      customName,
      subject,
      htmlContent,
      attachmentFile
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
      result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send bulk email to multiple leads or a campaign
// @route   POST /api/emails/send-bulk
// @access  Private
const sendBulkEmail = async (req, res, next) => {
  try {
    const { campaignId, leadIds, targetAudience, subject, htmlContent, attachmentId } = req.body;

    let targetLeadIds = [];

    if (Array.isArray(leadIds) && leadIds.length > 0) {
      targetLeadIds = leadIds;
    } else if (campaignId) {
      const campaign = await Campaign.findOne({ _id: campaignId, user: req.user._id });
      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Campaign not found' });
      }

      let query = { user: req.user._id, unsubscribed: false };
      if (campaign.targetAudience === 'Business') query.type = 'Business';
      else if (campaign.targetAudience === 'Individual') query.type = 'Individual';
      else if (campaign.targetAudience === 'Selected' && campaign.selectedLeadIds.length > 0) {
        query._id = { $in: campaign.selectedLeadIds };
      }

      const leads = await Lead.find(query).select('_id');
      targetLeadIds = leads.map(l => l._id);
    } else if (targetAudience) {
      let query = { user: req.user._id, unsubscribed: false };
      if (targetAudience === 'Business') query.type = 'Business';
      else if (targetAudience === 'Individual') query.type = 'Individual';

      const leads = await Lead.find(query).select('_id');
      targetLeadIds = leads.map(l => l._id);
    }

    if (!targetLeadIds.length) {
      return res.status(400).json({ success: false, message: 'No valid lead recipients found for email sending' });
    }

    let attachmentFile = null;
    if (attachmentId) {
      attachmentFile = await UploadedFile.findOne({ _id: attachmentId, uploadedBy: req.user._id });
    }

    const summary = await sendBulkCampaignEmail({
      userId: req.user._id,
      user: req.user,
      campaignId,
      leadIds: targetLeadIds,
      subject,
      htmlContent,
      attachmentFile
    });

    res.json({
      success: true,
      message: `Bulk email processing complete. Sent: ${summary.sentCount}, Failed: ${summary.failedCount}`,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get email logs with pagination & filters
// @route   GET /api/emails/logs
// @access  Private
const getEmailLogs = async (req, res, next) => {
  try {
    const { status, campaignId, search, page = 1, limit = 15 } = req.query;

    const query = { user: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (campaignId) {
      query.campaign = campaignId;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ recipientEmail: searchRegex }, { subject: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await EmailLog.countDocuments(query);
    const logs = await EmailLog.find(query)
      .populate('campaign', 'name')
      .populate('lead', 'owner company country type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a test email to logged-in user to verify SMTP setup
// @route   POST /api/emails/test-send
// @access  Private
const sendTestEmail = async (req, res, next) => {
  try {
    const { targetEmail } = req.body;
    const recipient = targetEmail || req.user.email;

    const result = await sendIndividualEmail({
      userId: req.user._id,
      user: req.user,
      customEmail: recipient,
      customName: req.user.name,
      subject: `EmailPro SMTP Test Dispatch — ${new Date().toLocaleTimeString()}`,
      htmlContent: `<p>Hello ${req.user.name},</p><p>Your EmailPro SMTP gateway is connected and operational!</p><p>Sent at: ${new Date().toLocaleString()}</p>`
    });

    res.json({
      success: true,
      message: `Test email dispatched to ${recipient}`,
      result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendSingleEmail,
  sendBulkEmail,
  getEmailLogs,
  sendTestEmail
};

