const express = require('express');
const User = require('../models/User');
const Scheme = require('../models/Scheme');
const auth = require('../middleware/auth');
const { getTranslatedScheme } = require('../services/translationService');
const router = express.Router();

// Get current user profile and onboarding status
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile data incrementally
router.put('/profile', auth, async (req, res) => {
  try {
    const { profile, lastQuestionId, isOnboarded, reset } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle Reset Logic
    if (reset) {
      console.log(`[BACKEND] Full reset triggered for user: ${user.email}`);
      user.profile = {};
      user.lastQuestionId = null;
      user.isOnboarded = false;
    } else {
      // Normal incremental update
      if (profile) {
        user.profile = { ...user.profile, ...profile };
      }
      
      if (lastQuestionId !== undefined) {
        user.lastQuestionId = lastQuestionId;
      }
      
      if (isOnboarded !== undefined) {
        user.isOnboarded = isOnboarded;
      }
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user: { 
      isOnboarded: user.isOnboarded, 
      profile: user.profile,
      lastQuestionId: user.lastQuestionId 
    }});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deprecated: Moving to PUT /profile?reset=true for better stability
router.post('/reset-onboarding', auth, async (req, res) => {
  res.status(410).json({ message: 'Please use PUT /profile with reset: true' });
});

// Update basic user info
router.put('/update-info', auth, async (req, res) => {
  try {
    const { fullName, email, phoneNumber } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();
    res.json({ message: 'User info updated successfully', user: {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber
    }});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a scheme
router.post('/save-scheme/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.savedSchemes.includes(req.params.id)) {
      user.savedSchemes.push(req.params.id);
      await user.save();
    }
    res.json({ message: 'Scheme saved successfully', savedSchemes: user.savedSchemes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unsave a scheme
router.delete('/save-scheme/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.savedSchemes = user.savedSchemes.filter(id => id.toString() !== req.params.id);
    await user.save();
    res.json({ message: 'Scheme removed successfully', savedSchemes: user.savedSchemes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all saved schemes with full details
router.get('/saved-schemes', auth, async (req, res) => {
  try {
    const { lang = 'en' } = req.query;
    const user = await User.findById(req.user.userId).populate('savedSchemes');
    
    let schemes = user.savedSchemes;
    if (lang !== 'en') {
      schemes = await Promise.all(
        schemes.map(s => getTranslatedScheme(s, lang))
      );
    }
    
    res.json(schemes);
  } catch (error) {
    console.error('Error fetching saved schemes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
