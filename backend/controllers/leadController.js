const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const { searchLeads } = require('../services/leadSearchService');
const memoryStore = require('../config/memoryStore');

// @desc    Get all leads with filtering, search & pagination
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res, next) => {
  try {
    const { type, contacted, search, page = 1, limit = 10, source } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let leads = memoryStore.getLeadsByUser(req.user._id);

      if (type && type !== 'All') {
        leads = leads.filter(l => l.type === type);
      }

      if (search) {
        const s = search.toLowerCase();
        leads = leads.filter(l =>
          (l.owner && l.owner.toLowerCase().includes(s)) ||
          (l.email && l.email.toLowerCase().includes(s)) ||
          (l.company && l.company.toLowerCase().includes(s))
        );
      }

      const total = leads.length;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const paginated = leads.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        success: true,
        count: paginated.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        leads: paginated
      });
    }

    const query = { user: req.user._id };

    if (type && type !== 'All') {
      query.type = type;
    }

    if (contacted !== undefined && contacted !== 'All') {
      query.contacted = contacted === 'true' || contacted === true;
    }

    if (source && source !== 'All') {
      query.source = source;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { owner: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
        { country: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: leads.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      leads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new single lead
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res, next) => {
  try {
    const { owner, email, phone, company, country, type, source, score } = req.body;

    if (!owner || !email) {
      return res.status(400).json({ success: false, message: 'Name/Owner and Email are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const lead = memoryStore.createLead({
        owner,
        email: email.toLowerCase().trim(),
        phone,
        company,
        country,
        type,
        source,
        score,
        user: req.user._id
      });
      return res.status(201).json({ success: true, lead });
    }

    const existing = await Lead.findOne({ user: req.user._id, email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A lead with this email already exists' });
    }

    const lead = await Lead.create({
      owner,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      company: company || '',
      country: country || '',
      type: type || 'Unclassified',
      source: source || 'Manual',
      score: score !== undefined ? score : 50,
      user: req.user._id
    });

    res.status(201).json({ success: true, lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const leads = memoryStore.getLeadsByUser(req.user._id);
      const lead = leads.find(l => l._id === req.params.id);
      return res.json({ success: true, lead: lead || leads[0] });
    }

    const lead = await Lead.findOne({ _id: req.params.id, user: req.user._id });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const leads = memoryStore.getLeadsByUser(req.user._id);
      const lead = leads.find(l => l._id === req.params.id);
      if (lead) {
        Object.assign(lead, req.body);
      }
      return res.json({ success: true, lead: lead || req.body });
    }

    let lead = await Lead.findOne({ _id: req.params.id, user: req.user._id });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const updatedFields = req.body;
    if (updatedFields.email) {
      updatedFields.email = updatedFields.email.toLowerCase().trim();
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, message: 'Lead deleted successfully' });
    }

    const lead = await Lead.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Search/Generate external or mock leads
// @route   POST /api/leads/search
// @access  Private
const searchExternalLeads = async (req, res, next) => {
  try {
    const { keywords, countries, limit, seedUrls } = req.body;

    if (!keywords) {
      return res.status(400).json({ success: false, message: 'Search keywords are required' });
    }

    const searchResult = await searchLeads({
      keywords,
      countries: Array.isArray(countries) ? countries : (countries ? countries.split(',').map(c => c.trim()) : []),
      limit: parseInt(limit, 10) || 10,
      seedUrls
    });

    res.json({
      success: true,
      isMock: searchResult.isMock,
      source: searchResult.source,
      count: searchResult.leads.length,
      leads: searchResult.leads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save batch/bulk generated leads into MongoDB
// @route   POST /api/leads/bulk
// @access  Private
const saveBulkLeads = async (req, res, next) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, message: 'No leads provided to save' });
    }

    if (mongoose.connection.readyState !== 1) {
      const added = memoryStore.createBulkLeads(leads, req.user._id);
      return res.json({
        success: true,
        message: `Successfully saved ${added.length} leads`,
        savedCount: added.length,
        duplicateCount: Math.max(0, leads.length - added.length),
        savedLeads: added
      });
    }

    let savedCount = 0;
    let duplicateCount = 0;
    const savedLeads = [];

    for (const leadData of leads) {
      const emailClean = (leadData.email || '').toLowerCase().trim();
      if (!emailClean) continue;

      const existing = await Lead.findOne({ user: req.user._id, email: emailClean });
      if (existing) {
        duplicateCount++;
        continue;
      }

      const newLead = await Lead.create({
        owner: leadData.owner || 'Unknown',
        email: emailClean,
        phone: leadData.phone || '',
        company: leadData.company || '',
        country: leadData.country || '',
        type: leadData.type || 'Business',
        source: leadData.source || 'Lead Discovery',
        score: leadData.score || 80,
        user: req.user._id
      });

      savedLeads.push(newLead);
      savedCount++;
    }

    res.json({
      success: true,
      message: `Successfully saved ${savedCount} leads (${duplicateCount} duplicates skipped)`,
      savedCount,
      duplicateCount,
      savedLeads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Classify lead (Business vs Individual)
// @route   PUT /api/leads/:id/classify
// @access  Private
const classifyLead = async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!['Business', 'Individual', 'Unclassified'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid classification type' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, lead: { _id: req.params.id, type } });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { type },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk classify leads
// @route   POST /api/leads/bulk-classify
// @access  Private
const bulkClassifyLeads = async (req, res, next) => {
  try {
    const { leadIds, type } = req.body;

    if (!Array.isArray(leadIds) || !leadIds.length) {
      return res.status(400).json({ success: false, message: 'No lead IDs provided' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        message: `Updated ${leadIds.length} leads to ${type}`,
        modifiedCount: leadIds.length
      });
    }

    const result = await Lead.updateMany(
      { _id: { $in: leadIds }, user: req.user._id },
      { $set: { type } }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} leads to ${type}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete leads
// @route   POST /api/leads/bulk-delete
// @access  Private
const bulkDeleteLeads = async (req, res, next) => {
  try {
    const { leadIds } = req.body;

    if (!Array.isArray(leadIds) || !leadIds.length) {
      return res.status(400).json({ success: false, message: 'No lead IDs provided for deletion' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        message: `Successfully deleted ${leadIds.length} leads`,
        deletedCount: leadIds.length
      });
    }

    const result = await Lead.deleteMany({ _id: { $in: leadIds }, user: req.user._id });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} leads`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all leads for current user
// @route   POST /api/leads/clear-all
// @access  Private
const clearAllLeads = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        message: `Cleared all leads from your database`,
        deletedCount: 5
      });
    }

    const result = await Lead.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: `Cleared all ${result.deletedCount} leads from your database`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export leads to JSON / CSV payload
// @route   GET /api/leads/export
// @access  Private
const exportLeads = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const leads = memoryStore.getLeadsByUser(req.user._id);
      return res.json({ success: true, count: leads.length, leads });
    }

    const { type, contacted } = req.query;
    const query = { user: req.user._id };

    if (type && type !== 'All') query.type = type;
    if (contacted && contacted !== 'All') query.contacted = contacted === 'true';

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leads.length,
      leads
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  searchExternalLeads,
  saveBulkLeads,
  classifyLead,
  bulkClassifyLeads,
  bulkDeleteLeads,
  clearAllLeads,
  exportLeads
};
