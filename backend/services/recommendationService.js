const { Groq } = require('groq-sdk');
const Scheme = require('../models/Scheme');
const { getTranslatedScheme } = require('./translationService');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Recommendation Engine
 * Phase 1: Mongoose query filtering (Strict Eligibility)
 * Phase 2: Groq AI Ranking & Personalization
 * Phase 3: Dynamic Translation (if requested)
 */
const getRecommendations = async (userProfile, targetLang = 'en') => {
  try {
    const {
      gender = 'all',
      age = 25,
      income = 0,
      occupation = 'all',
      category = 'general',
      location = 'all',
      disability = 'no',
      bpl_card = 'no',
      land_size = 0
    } = userProfile;

    // Phase 1: Deterministic Filtering
    const query = {
      $and: [
        // Gender matching
        { "eligibility.gender": { $in: [gender.toLowerCase(), 'all'] } },
        // Age matching
        { "eligibility.ageMin": { $lte: Number(age) } },
        { "eligibility.ageMax": { $gte: Number(age) } },
        // Income matching
        { $or: [
            { "eligibility.incomeMax": { $gte: Number(income) } },
            { "eligibility.incomeMax": Infinity }
          ] 
        },
        // Occupation matching
        { "eligibility.occupations": { $in: [occupation.toLowerCase(), 'all'] } },
        // Caste matching
        { "eligibility.castes": { $in: [category.toLowerCase(), 'all'] } },
        // Location matching
        { "eligibility.residence": { $in: [location.toLowerCase(), 'all'] } }
      ]
    };

    // Add specific filters for BPL and Disability if user doesn't have them
    if (bpl_card === 'no') {
      query["eligibility.isBPLRequired"] = false;
    }
    if (disability === 'no') {
      query["eligibility.isDisabilityRequired"] = false;
    }

    // Sort by state (local state Karnataka first, then Central) or vice-versa
    // For now, just find all that match the strict rules
    const matches = await Scheme.find(query).limit(15);

    if (matches.length === 0) {
      return {
        recommendations: [],
        aiConclusion: "No direct matches found based on your parameters. Try updating your profile for better results."
      };
    }

    // Phase 2: AI Personalization (Groq)
    // Create a summarized context for the LLM
    const schemesContext = matches.map((s, index) => 
      `${index + 1}. [${s.state}] ${s.title}: ${s.description}. Benefits: ${s.benefits}`
    ).join('\n');

    const prompt = `
      You are an expert Government Scheme Advisor in India. 
      The user profile is:
      - Age: ${age}
      - Gender: ${gender}
      - Occupation: ${occupation}
      - Annual Income: ₹${income}
      - Category: ${category}
      - Location: ${location}
      - BPL Status: ${bpl_card}
      - Disability: ${disability}
      - Land Size: ${land_size} acres

      Below are the schemes that currently match their strict eligibility criteria:
      ${schemesContext}

      TASK:
      1. Rank these schemes based on the high impact and relevance to the user's profile.
      2. Provide a "matchScore" (0-100) for each.
      3. For the top 3 schemes, provide a "personalReason" why this is great for them specifically (in simple words).
      4. Output only a valid JSON array of objects with keys: "schemeId" (use the index from context starting at 1), "title", "matchScore", "personalReason".
      
      Output JSON Format:
      [
        {"schemeId": 1, "title": "Scheme Name", "matchScore": 95, "personalReason": "..."},
        ...
      ]
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that provides JSON output." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    try {
      const aiResponse = JSON.parse(completion.choices[0].message.content);
      // It might return { "recommendations": [...] } or just the array depending on the exact interpretation
      const rankedData = Array.isArray(aiResponse) ? aiResponse : (aiResponse.recommendations || Object.values(aiResponse)[0]);

      // Map back to full scheme objects
      let fullRecommendations = rankedData.map(item => {
        const original = matches[item.schemeId - 1];
        if (!original) return null;
        return {
          ...original.toObject(),
          matchScore: item.matchScore,
          personalReason: item.personalReason
        };
      }).filter(Boolean);

      // Phase 3: Translation
      if (targetLang !== 'en') {
        fullRecommendations = await Promise.all(
          fullRecommendations.map(s => getTranslatedScheme(s, targetLang))
        );
      }

      return {
        recommendations: fullRecommendations.sort((a, b) => b.matchScore - a.matchScore),
        aiConclusion: targetLang === 'kn' ? "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಆಧಾರದ ಮೇಲೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ." : "Highly recommended based on your profile."
      };
    } catch (e) {
      console.error("Failed to parse AI response:", completion.choices[0].message.content);
      // Fallback to match results without AI ranking
      return {
        recommendations: matches.map(m => ({ ...m.toObject(), matchScore: 80, personalReason: "Matches your eligibility criteria." })),
        aiConclusion: "Recommended based on your eligibility."
      };
    }

  } catch (error) {
    console.error("Recommendation Service Error:", error);
    throw error;
  }
};

module.exports = {
  getRecommendations
};
