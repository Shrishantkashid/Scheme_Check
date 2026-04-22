const { Groq } = require('groq-sdk');
const Scheme = require('../models/Scheme');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Translates scheme content to Kannada using Groq AI
 * Caches the result in the database
 */
const getTranslatedScheme = async (scheme, targetLang = 'kn') => {
  if (targetLang === 'en') return scheme.toObject ? scheme.toObject() : scheme;

  // Check if translation already exists in cache
  if (scheme.translations && scheme.translations[targetLang] && scheme.translations[targetLang].title) {
    const translated = scheme.toObject ? scheme.toObject() : { ...scheme };
    return {
      ...translated,
      title: scheme.translations[targetLang].title,
      description: scheme.translations[targetLang].description,
      benefits: scheme.translations[targetLang].benefits,
      isTranslated: true
    };
  }

  try {
    console.log(`Translating scheme: ${scheme.title} to ${targetLang}...`);
    
    const prompt = `
      Translate the following Indian Government Scheme details into pure, professional Kannada.
      
      Title: ${scheme.title}
      Description: ${scheme.description}
      Benefits: ${scheme.benefits}
      
      Output ONLY a JSON object with keys: "title", "description", "benefits".
      Example: {"title": "...", "description": "...", "benefits": "..."}
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a professional English to Kannada translator." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const translatedContent = JSON.parse(completion.choices[0].message.content);

    // Update the scheme in the database with the new translation (Cache it)
    await Scheme.findByIdAndUpdate(scheme._id, {
      $set: {
        [`translations.${targetLang}`]: translatedContent
      }
    });

    const original = scheme.toObject ? scheme.toObject() : { ...scheme };
    return {
      ...original,
      title: translatedContent.title,
      description: translatedContent.description,
      benefits: translatedContent.benefits,
      isTranslated: true
    };
  } catch (error) {
    console.error(`Translation error for scheme ${scheme._id}:`, error);
    // Fallback to original if translation fails
    return scheme.toObject ? scheme.toObject() : scheme;
  }
};

module.exports = {
  getTranslatedScheme
};
