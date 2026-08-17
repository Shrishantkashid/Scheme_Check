const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const { getRecommendations, getCategoryNews } = require('../services/recommendationService');
const { getTranslatedScheme } = require('../services/translationService');
const { runDiscoveryPipeline } = require('../scheduler');
const { fetchTutorials } = require('../services/youtubeService');

/**
 * @route   POST /api/schemes/internal/run-crawl
 * @desc    Manually trigger the discovery crawler (protected)
 * @access  Private (Admin only)
 */
router.post('/internal/run-crawl', auth, async (req, res) => {
  // In a real app, verify req.user.role === 'admin'
  try {
    runDiscoveryPipeline();
    res.json({ message: 'Discovery pipeline triggered successfully' });
  } catch (error) {
    console.error('Error triggering pipeline:', error);
    res.status(500).json({ message: 'Failed to trigger pipeline' });
  }
});

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
 * @route   GET /api/schemes/updates
 * @desc    Get dynamic news updates based on user profile
 * @access  Private
 */
router.get('/updates', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.profile || Object.keys(user.profile).length === 0) {
      return res.status(400).json({ message: 'User profile is empty.' });
    }

    const news = await getCategoryNews(user.profile);
    res.json(news);
  } catch (error) {
    console.error('Error fetching news updates:', error);
    res.status(500).json({ message: 'Error generating news', error: error.message });
  }
});

/**
 * @route   GET /api/schemes/:id
 * @desc    Get specific scheme details (and enrich tutorials if pending)
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    let scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }

    // Lazy enrich AI summary and YouTube tutorials if they are pending
    if (scheme.enrichmentStatus === 'pending') {
      console.log(`[SchemesRoute] On-demand AI enrichment for scheme: ${scheme.title}`);
      try {
        const { enrichSchemeWithAI } = require('../services/extractionService');
        const enriched = await enrichSchemeWithAI(scheme);
        scheme.aiSummary = enriched.aiSummary;
        scheme.youtubeQuery = enriched.youtubeQuery;
        
        if (enriched.structuredEligibility) {
          Object.assign(scheme.eligibility, enriched.structuredEligibility);
        }
        
        console.log(`[SchemesRoute] Fetching YouTube tutorials for scheme: ${scheme.title}`);
        const tutorials = await fetchTutorials(scheme);
        scheme.tutorials = tutorials;
        
        scheme.enrichmentStatus = 'done';
        await scheme.save();
      } catch (err) {
        console.error(`[SchemesRoute] Failed on-demand enrichment for ${scheme.title}:`, err.message);
        // We won't mark as failed immediately so it can retry later, 
        // or we could mark as failed. Let's just catch and proceed so we don't block the request.
      }
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
