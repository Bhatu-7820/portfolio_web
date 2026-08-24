const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: [true, 'Owner or contact name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['Business', 'Individual', 'Unclassified'],
      default: 'Unclassified'
    },
    source: {
      type: String,
      default: 'Manual'
    },
    score: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    contacted: {
      type: Boolean,
      default: false
    },
    unsubscribed: {
      type: Boolean,
      default: false
    },
    unsubscribeToken: {
      type: String,
      default: null,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate emails per user
LeadSchema.index({ user: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Lead', LeadSchema);
