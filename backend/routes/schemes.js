const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const { getRecommendations } = require('../services/recommendationService');
const { getTranslatedScheme } = require('../services/translationService');

/**
 * @route   GET /api/schemes/recommend
 * @desc    Get AI-powered personalized scheme recommendations
 * @access  Private
 */
router.get('/recommend', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.profile || Object.keys(user.profile).length === 0) {
      return res.status(400).json({ 
        message: 'User profile is empty. Please complete onboarding first.',
        isOnboarded: false
      });
    }

    const { lang = 'en' } = req.query;
    const recommendations = await getRecommendations(user.profile, lang);
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
});

/**
 * @route   GET /api/schemes/:id
 * @desc    Get specific scheme details
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    let scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }

    const { lang = 'en' } = req.query;
    if (lang !== 'en') {
      scheme = await getTranslatedScheme(scheme, lang);
    }

    res.json(scheme);
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/schemes
 * @desc    Get all schemes (with optional filtering)
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { state, category, search, limit = 50, skip = 0, lang = 'en' } = req.query;
    const filter = {};
    
    if (state) filter.state = state;
    if (category) filter.category = { $regex: category, $options: 'i' };
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let schemes = await Scheme.find(filter)
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ title: 1 });
      
    const total = await Scheme.countDocuments(filter);

    if (lang !== 'en') {
      schemes = await Promise.all(
        schemes.map(s => getTranslatedScheme(s, lang))
      );
    }

    res.json({
      schemes,
      total,
      limit: Number(limit),
      skip: Number(skip)
    });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
