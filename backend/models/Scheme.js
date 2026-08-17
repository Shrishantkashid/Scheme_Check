const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  translations: {
    kn: {
      title: String,
      description: String,
      benefits: String
    }
  },
  state: {
    type: String,
    required: true,
    enum: ['Central', 'Karnataka'],
  },
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  eligibility: {
    ageMin: { type: Number, default: 0 },
    ageMax: { type: Number, default: 200 },
    gender: { 
      type: [String], 
      enum: ['male', 'female', 'other', 'all'], 
      default: ['all'] 
    },
    incomeMax: { type: Number, default: Infinity },
    occupations: { 
      type: [String], 
      enum: ['farmer', 'student', 'daily_wage', 'self_employed', 'unemployed', 'artisan', 'all'],
      default: ['all']
    },
    castes: { 
      type: [String], 
      enum: ['general', 'obc', 'sc', 'st', 'all'],
      default: ['all']
    },
    isBPLRequired: { type: Boolean, default: false },
    isDisabilityRequired: { type: Boolean, default: false },
    minority: { type: String, enum: ['yes', 'no', 'all'], default: 'all' },
    maritalStatus: { 
      type: [String], 
      enum: ['single', 'married', 'divorced', 'widowed', 'all'], 
      default: ['all'] 
    },
    landSizeMax: { type: Number, default: Infinity }, // for farmers
    residence: { type: String, enum: ['rural', 'urban', 'all'], default: 'all' },
  },
  benefits: {
    type: String,
    required: true,
  },
  documents: {
    type: [String],
    default: [],
  },
  applyLink: {
    type: String,
    required: true,
  },
  procedure: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  aiSummary: {
    type: String,
    default: null,
  },
  youtubeQuery: {
    type: String,
    default: null,
  },
  tutorials: {
    type: [{
      videoId: String,
      title: String,
      thumbnail: String,
      channelTitle: String
    }],
    default: []
  },
  enrichmentStatus: {
    type: String,
    enum: ['pending', 'done', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  sourceSlug: {
    type: String,
    unique: true,
    sparse: true // Allows null/missing for old seeded data
  },
  sourceUrl: {
    type: String,
    default: '',
  },
  lastScrapedAt: {
    type: Date,
    default: null,
  }
});

module.exports = mongoose.model('Scheme', SchemeSchema);
