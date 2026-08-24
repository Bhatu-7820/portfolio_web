const EmailTemplate = require('../models/EmailTemplate');

// @desc    Get all email templates
// @route   GET /api/templates
// @access  Private
const getTemplates = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: templates.length, templates });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new email template
// @route   POST /api/templates
// @access  Private
const createTemplate = async (req, res, next) => {
  try {
    const { name, subject, htmlContent } = req.body;

    if (!name || !subject || !htmlContent) {
      return res.status(400).json({ success: false, message: 'Please provide name, subject, and htmlContent' });
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      htmlContent,
      user: req.user._id
    });

    res.status(201).json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Private
const getTemplateById = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findOne({ _id: req.params.id, user: req.user._id });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
const updateTemplate = async (req, res, next) => {
  try {
    let template = await EmailTemplate.findOne({ _id: req.params.id, user: req.user._id });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, template });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findOne({ _id: req.params.id, user: req.user._id });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await template.deleteOne();
    res.json({ success: true, message: 'Template removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate template
// @route   POST /api/templates/:id/duplicate
// @access  Private
const duplicateTemplate = async (req, res, next) => {
  try {
    const original = await EmailTemplate.findOne({ _id: req.params.id, user: req.user._id });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const copy = await EmailTemplate.create({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      htmlContent: original.htmlContent,
      user: req.user._id
    });

    res.status(201).json({ success: true, template: copy });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate
};
