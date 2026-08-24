const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const memoryStore = require('../config/memoryStore');

// @desc    Get all email templates
// @route   GET /api/templates
// @access  Private
const getTemplates = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      const userTemplates = store.templates.filter(t => t.user === req.user._id || !t.user);
      return res.json({ success: true, count: userTemplates.length, templates: userTemplates });
    }

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

    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      const newTpl = {
        _id: 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name,
        subject,
        htmlContent,
        user: req.user._id,
        createdAt: new Date().toISOString()
      };
      store.templates.unshift(newTpl);
      memoryStore.saveStore();
      return res.status(201).json({ success: true, template: newTpl });
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
    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      const tpl = store.templates.find(t => t._id === req.params.id) || store.templates[0];
      return res.json({ success: true, template: tpl });
    }

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
    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      const tpl = store.templates.find(t => t._id === req.params.id);
      if (tpl) Object.assign(tpl, req.body);
      memoryStore.saveStore();
      return res.json({ success: true, template: tpl || req.body });
    }

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
    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      store.templates = store.templates.filter(t => t._id !== req.params.id);
      memoryStore.saveStore();
      return res.json({ success: true, message: 'Template removed' });
    }

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
    if (mongoose.connection.readyState !== 1) {
      const store = memoryStore.getStore();
      const original = store.templates.find(t => t._id === req.params.id) || store.templates[0];
      const copy = {
        _id: 'tpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: `${original?.name || 'Template'} (Copy)`,
        subject: original?.subject || 'Subject',
        htmlContent: original?.htmlContent || '<p>Content</p>',
        user: req.user._id,
        createdAt: new Date().toISOString()
      };
      store.templates.unshift(copy);
      memoryStore.saveStore();
      return res.status(201).json({ success: true, template: copy });
    }

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
