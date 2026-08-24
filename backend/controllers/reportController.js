const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const EmailLog = require('../models/EmailLog');
const memoryStore = require('../config/memoryStore');

// @desc    Get dashboard metrics & aggregated system reports
// @route   GET /api/reports
// @access  Private
const getDashboardReports = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (mongoose.connection.readyState !== 1) {
      const userLeads = memoryStore.getLeadsByUser(userId);
      const totalLeads = userLeads.length;
      const businessLeads = userLeads.filter(l => l.type === 'Business').length;
      const individualLeads = userLeads.filter(l => l.type === 'Individual').length;
      const unclassifiedLeads = userLeads.filter(l => l.type === 'Unclassified').length;
      const contactedLeads = userLeads.filter(l => l.contacted).length;
      const availableEmails = userLeads.filter(l => !l.unsubscribed).length;

      return res.json({
        success: true,
        metrics: {
          totalLeads,
          businessLeads,
          individualLeads,
          unclassifiedLeads,
          contactedLeads,
          availableEmails,
          totalCampaigns: 1,
          emailsSent: 5,
          emailsFailed: 0,
          emailsPending: 0,
          totalEmailsProcessed: 5,
          successRate: 100
        },
        recentLeads: userLeads.slice(0, 5),
        recentCampaigns: [
          {
            _id: 'cmp_demo_1',
            name: 'Q3 B2B Wholesale Outreach Campaign',
            targetAudience: 'Business',
            recipientCount: 4,
            sentCount: 4,
            failedCount: 0,
            status: 'Completed',
            createdAt: new Date().toISOString()
          }
        ]
      });
    }

    const [
      totalLeads,
      businessLeads,
      individualLeads,
      unclassifiedLeads,
      contactedLeads,
      availableEmails,
      totalCampaigns,
      sentEmails,
      failedEmails,
      pendingEmails,
      recentLeads,
      recentCampaigns
    ] = await Promise.all([
      Lead.countDocuments({ user: userId }),
      Lead.countDocuments({ user: userId, type: 'Business' }),
      Lead.countDocuments({ user: userId, type: 'Individual' }),
      Lead.countDocuments({ user: userId, type: 'Unclassified' }),
      Lead.countDocuments({ user: userId, contacted: true }),
      Lead.countDocuments({ user: userId, unsubscribed: false }),
      Campaign.countDocuments({ user: userId }),
      EmailLog.countDocuments({ user: userId, status: 'sent' }),
      EmailLog.countDocuments({ user: userId, status: 'failed' }),
      EmailLog.countDocuments({ user: userId, status: 'pending' }),
      Lead.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
      Campaign.find({ user: userId }).sort({ createdAt: -1 }).limit(5).populate('template', 'name')
    ]);

    const totalEmailAttempts = sentEmails + failedEmails;
    const successRate = totalEmailAttempts > 0 ? ((sentEmails / totalEmailAttempts) * 100).toFixed(1) : '100.0';

    res.json({
      success: true,
      metrics: {
        totalLeads,
        businessLeads,
        individualLeads,
        unclassifiedLeads,
        contactedLeads,
        availableEmails,
        totalCampaigns,
        emailsSent: sentEmails,
        emailsFailed: failedEmails,
        emailsPending: pendingEmails,
        totalEmailsProcessed: totalEmailAttempts + pendingEmails,
        successRate: Number(successRate)
      },
      recentLeads,
      recentCampaigns
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report details & recipient logs for specific campaign
// @route   GET /api/reports/campaign/:id
// @access  Private
const getCampaignReportDetail = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        campaign: { name: 'Q3 B2B Wholesale Outreach Campaign' },
        summary: { totalRecipients: 4, sent: 4, failed: 0, pending: 0, successRate: 100 },
        logs: []
      });
    }

    const campaign = await Campaign.findOne({ _id: req.params.id, user: req.user._id })
      .populate('template')
      .populate('attachment');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const logs = await EmailLog.find({ campaign: campaign._id, user: req.user._id })
      .populate('lead', 'owner company country type')
      .sort({ createdAt: -1 });

    const totalLogs = logs.length;
    const sentCount = logs.filter(l => l.status === 'sent').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;
    const pendingCount = logs.filter(l => l.status === 'pending').length;

    res.json({
      success: true,
      campaign,
      summary: {
        totalRecipients: campaign.recipientCount || totalLogs,
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
        successRate: totalLogs > 0 ? ((sentCount / (sentCount + failedCount || 1)) * 100).toFixed(1) : '0'
      },
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardReports,
  getCampaignReportDetail
};
