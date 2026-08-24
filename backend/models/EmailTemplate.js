const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Template subject is required'],
      trim: true
    },
    htmlContent: {
      type: String,
      required: [true, 'HTML content is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);
