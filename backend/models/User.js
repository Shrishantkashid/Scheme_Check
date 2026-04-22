const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  savedSchemes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scheme'
  }],
  isOnboarded: {
    type: Boolean,
    default: false,
  },
  profile: {
    type: Object,
    default: {},
  },
  lastQuestionId: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  linkedAccounts: {
    google: { type: String, default: null },
    apple: { type: String, default: null },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
