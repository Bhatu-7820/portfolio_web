const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const EmailTemplate = require('../models/EmailTemplate');

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ user: req.user._id })
      .populate('template', 'name subject')
      .populate('attachment', 'originalName filename size mimeType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private
const createCampaign = async (req, res, next) => {
  try {
    const { name, subject, templateId, targetAudience, selectedLeadIds, attachmentId } = req.body;

    if (!name || !templateId) {
      return res.status(400).json({ success: false, message: 'Campaign name and template are required' });
    }

    const template = await EmailTemplate.findOne({ _id: templateId, user: req.user._id });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Selected template not found' });
    }

    // Determine target recipient count
    let query = { user: req.user._id, unsubscribed: false };
    if (targetAudience === 'Business') query.type = 'Business';
    else if (targetAudience === 'Individual') query.type = 'Individual';
    else if (targetAudience === 'Selected' && Array.isArray(selectedLeadIds) && selectedLeadIds.length > 0) {
      query._id = { $in: selectedLeadIds };
    }

    const recipientCount = await Lead.countDocuments(query);

    const campaign = await Campaign.create({
      name,
      subject: subject || template.subject,
      template: templateId,
      targetAudience: targetAudience || 'All',
      selectedLeadIds: targetAudience === 'Selected' ? selectedLeadIds : [],
      attachment: attachmentId || null,
      recipientCount,
      user: req.user._id
    });

    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate('template', 'name subject htmlContent')
      .populate('attachment', 'originalName filename size mimeType');

    res.status(201).json({ success: true, campaign: populatedCampaign });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private
const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.user._id })
      .populate('template')
      .populate('attachment')
      .populate('selectedLeadIds', 'owner email company country type');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampaigns,
  createCampaign,
  getCampaignById,
  deleteCampaign
};
