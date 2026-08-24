const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      required: true
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Business', 'Individual', 'Selected'],
      default: 'All'
    },
    selectedLeadIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
      }
    ],
    attachment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedFile',
      default: null
    },
    status: {
      type: String,
      enum: ['Draft', 'Sending', 'Completed', 'Failed'],
      default: 'Draft'
    },
    recipientCount: {
      type: Number,
      default: 0
    },
    sentCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', CampaignSchema);
