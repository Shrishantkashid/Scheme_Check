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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Scheme', SchemeSchema);
