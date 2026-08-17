const { Groq } = require('groq-sdk');
const Scheme = require('../models/Scheme');
const { getTranslatedScheme } = require('./translationService');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const { applyHardFilters, scoreSchemes } = require('./recommendationEngine');

// In-memory cache for LLM explanations: Map<cacheKey, matchReason>
// cacheKey = `${schemeId}_${userProfileHash}`
const explanationCache = new Map();

// Helper to generate a simple hash of the user profile for caching
function hashProfile(profile) {
  return JSON.stringify({
    age: profile.age,
    gender: profile.gender,
    occupation: profile.occupation,
    income: profile.income,
    category: profile.category
  });
}

/**
 * Recommendation Engine
 * Stage 1: Deterministic Filtering (Hard limits)
 * Stage 2: Weighted Scoring
 * Stage 3: LLM Explanations (Cached)
 */
const getRecommendations = async (userProfile, targetLang = 'en') => {
  try {
    // 1. Fetch the entire candidate pool (or a broad subset if DB gets huge)
    const allSchemes = await Scheme.find({});
    
    // 2. Stage 1: Hard Filters
    const eligibleSchemes = applyHardFilters(userProfile, allSchemes);
    
    if (eligibleSchemes.length === 0) {
      return {
        recommendations: [],
        aiConclusion: "No direct matches found based on your parameters. Try updating your profile for better results."
      };
    }

    // 3. Stage 2: Weighted Scoring
    const topSchemes = scoreSchemes(userProfile, eligibleSchemes, 15);
    const profileHash = hashProfile(userProfile);

    // 4. Stage 3: LLM Explanation Generation (Concurrent)
    const promises = topSchemes.map(async (scheme) => {
      const cacheKey = `${scheme._id}_${profileHash}_${targetLang}`;
      
      // Check cache first
      if (explanationCache.has(cacheKey)) {
        const cachedExplanation = explanationCache.get(cacheKey);
        return {
          ...scheme,
          matchReason: cachedExplanation.reason,
          matchDetails: cachedExplanation.details
        };
      }

      // Fallback reason if LLM fails
      const fallbackReason = scheme.matchedCriteria.join(', ') + '.';
      const fallbackDetails = {
        coreMatch: "Based on standard eligibility criteria.",
        benefits: "General scheme benefits apply.",
        nextSteps: "Check official portal for application steps."
      };
      
      try {
        const prompt = `
          You are an expert Government Scheme Advisor in India.
          User Profile: Age ${userProfile.age}, Gender ${userProfile.gender}, Occupation ${userProfile.occupation}, Income ₹${userProfile.income}, Category ${userProfile.category}.
          
          Scheme: ${scheme.title}
          Summary: ${scheme.description}
          Why they matched (deterministic): ${scheme.matchedCriteria.join(', ')}
          
          TASK: Provide a detailed explanation of why the user qualifies for this scheme, what they get, and what to do next. Do NOT hallucinate. Do not use complex jargon.
          Respond in ${targetLang === 'kn' ? 'Kannada' : 'English'}.
          
          Output ONLY a valid JSON object matching this exact structure:
          {
            "reason": "A short, 1-sentence summary of why they qualify.",
            "details": {
              "coreMatch": "Deep explanation of exactly why their specific demographics (age, gender, income, occupation) qualify them.",
              "benefits": "What tangible benefits they will receive.",
              "nextSteps": "Clear, actionable steps on how they should proceed."
            }
          }
        `;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You output valid JSON only." },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.3
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content);
        
        const explanationData = {
          reason: aiResponse.reason || fallbackReason,
          details: aiResponse.details || fallbackDetails
        };

        // Cache the full explanation data
        explanationCache.set(cacheKey, explanationData);

        return {
          ...scheme,
          matchReason: explanationData.reason,
          matchDetails: explanationData.details
        };
      } catch (err) {
        console.error(`LLM failed for scheme ${scheme.title}:`, err);
        return {
          ...scheme,
          matchReason: fallbackReason,
          matchDetails: fallbackDetails
        };
      }
    });

    // Execute concurrently (Promise.all)
    // Note: For a production scale app, we'd use a concurrency limit (e.g. p-limit) here.
    let fullRecommendations = await Promise.all(promises);

    // Phase 4: Translation (if needed for the rest of the scheme body)
    if (targetLang !== 'en') {
      fullRecommendations = await Promise.all(
        fullRecommendations.map(s => getTranslatedScheme(s, targetLang))
      );
    }

    return {
      recommendations: fullRecommendations,
      aiConclusion: targetLang === 'kn' ? "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಧಾರದ ಮೇಲೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ." : "Highly recommended based on your profile."
    };

  } catch (error) {
    console.error("Recommendation Service Error:", error);
    throw error;
  }
};

const getCategoryNews = async (userProfile) => {
  try {
    const { category = 'general', occupation = 'student', location = 'India' } = userProfile;
    
    const prompt = `
      You are an expert news aggregator in India. The user is a ${category} ${occupation} living in ${location}.
      Generate 3 realistic, very recent news updates, government policy changes, or protests in India that directly affect this specific demographic.
      
      Output ONLY a valid JSON object with a single key "news" containing an array of 3 objects. Each object must have keys:
      "id" (string, unique like "news_1"),
      "title" (string, max 60 chars), 
      "date" (string, e.g., "2 hours ago", "1 day ago"), 
      "type" (string, either "Update" or "Protest"), 
      "content" (string, detailed paragraph explaining the news)
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    try {
      const aiResponse = JSON.parse(completion.choices[0].message.content);
      return aiResponse.news || [];
    } catch (e) {
      console.error("Failed to parse news:", e);
      return [];
    }
  } catch (error) {
    console.error("News Service Error:", error);
    return [];
  }
};

module.exports = {
  getRecommendations,
  getCategoryNews
};
