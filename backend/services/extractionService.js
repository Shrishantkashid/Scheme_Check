const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Step 1: Deterministic Mapping
 * Maps the raw API response to our Mongoose Scheme schema defensively.
 * @param {Object} rawData - The data.en object from the detail API
 * @param {Object} discoverySummary - The summary object from discovery step (contains slug, schemeName)
 * @returns {Object} - Mapped scheme data ready for DB (minus Groq enrichments)
 */
function mapSchemeData(rawData, discoverySummary) {
  // Required critical fields
  const title = discoverySummary.schemeName || rawData.basicDetails?.schemeName;
  const slug = discoverySummary.slug || rawData.basicDetails?.slug;

  if (!title || !slug) {
    throw new Error("Missing critical required fields: title or slug");
  }

  // Defensive mappings with safe fallbacks
  const basic = rawData.basicDetails || {};
  const content = rawData.schemeContent || {};
  const eligibility = rawData.eligibilityCriteria || {};
  
  const state = basic.beneficiaryState || 'Central';
  let category = basic.schemeCategory || discoverySummary.schemeCategory || 'Uncategorized';
  if (Array.isArray(category)) {
    category = category.map(c => typeof c === 'object' ? c.label : c).join(', ');
  } else if (typeof category === 'object') {
    category = category.label || 'Uncategorized';
  }
  
  // Use markdown fields if available, otherwise fallback to plain text, stringifying ASTs if necessary
  const descriptionRaw = content.briefDescription_md || content.briefDescription || basic.briefDescription || '';
  const description = typeof descriptionRaw === 'string' ? descriptionRaw : JSON.stringify(descriptionRaw);
  
  const benefitsRaw = content.benefits_md || content.benefits || '';
  const benefits = typeof benefitsRaw === 'string' ? benefitsRaw : JSON.stringify(benefitsRaw);
  
  // Eligibility is often purely text in the API, we map it to our structured/unstructured format
  const eligibilityRaw = eligibility.eligibilityDescription_md || eligibility.eligibilityDescription || '';
  const eligibilityText = typeof eligibilityRaw === 'string' ? eligibilityRaw : JSON.stringify(eligibilityRaw);
  
  // Extract apply link and procedure from applicationProcess array if it exists
  let applyLink = `https://www.myscheme.gov.in/schemes/${slug}`; // Fallback to info page
  let procedureRaw = '';
  
  if (Array.isArray(rawData.applicationProcess) && rawData.applicationProcess.length > 0) {
    const onlineProcess = rawData.applicationProcess.find(p => p.mode?.toLowerCase() === 'online') || rawData.applicationProcess[0];
    if (onlineProcess.url) {
      applyLink = onlineProcess.url;
    }
    procedureRaw = onlineProcess.process_md || onlineProcess.process || '';
  }
  
  const procedure = typeof procedureRaw === 'string' ? procedureRaw : JSON.stringify(procedureRaw);

  // Documents
  let documents = [];
  if (Array.isArray(rawData.schemeDefinitions)) {
    // Attempt to pull out document requirements if they exist in definitions
    documents = rawData.schemeDefinitions
      .filter(def => def.type === 'document' || def.name?.toLowerCase().includes('document'))
      .map(def => def.description || def.name);
  }

  // Map to our Mongoose schema format
  const mappedData = {
    title,
    state,
    category,
    description,
    benefits,
    documents,
    applyLink,
    procedure,
    tags: discoverySummary.tags || basic.tags || [],
    sourceSlug: slug,
    sourceUrl: `https://www.myscheme.gov.in/schemes/${slug}`,
    
    // We map the raw text into our schema's eligibility object where we can, 
    // or just store it for RAG later if we don't have structured fields
    eligibility: {
      // Set safe defaults for our structured schema
      ageMin: 0,
      ageMax: Infinity,
      gender: ['all'],
      incomeMax: Infinity,
      occupations: ['all'],
      castes: ['all'],
      isBPLRequired: false,
      isDisabilityRequired: false,
      landSizeMax: Infinity,
      residence: 'all',
      // We'll tuck the raw text in here for reference, though it's not strictly in our old schema
      rawText: eligibilityText 
    }
  };

  // We enforce that at least one meaningful descriptive field is present
  if (!mappedData.description && !mappedData.eligibility.rawText) {
    throw new Error("Missing both description and eligibility text. Record is too sparse.");
  }

  return mappedData;
}

/**
 * Step 2: AI Enrichment (Groq)
 * Generates a short plain-language summary and a YouTube search query.
 */
async function enrichSchemeWithAI(mappedData) {
  const prompt = `
    You are an AI assistant for a welfare schemes app.
    Given the scheme details below, provide:
    1. A short, plain-language summary (2-3 sentences max) explaining what this is and who it's for.
    2. A highly specific YouTube search query string that a user could use to find a tutorial on how to apply for this exact scheme. (e.g. "How to apply for PM Kisan Yojana 2024 online steps")

    Scheme Name: ${mappedData.title}
    State: ${mappedData.state}
    Description: ${mappedData.description.substring(0, 1000)}
    Eligibility: ${mappedData.eligibility.rawText ? mappedData.eligibility.rawText.substring(0, 1000) : 'N/A'}

    Output ONLY a valid JSON object in this format:
    {
      "aiSummary": "...",
      "youtubeQuery": "..."
    }
  `;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You generate helpful summaries and search queries. Output pure JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const enrichments = JSON.parse(completion.choices[0].message.content);
    
    // Attach to mapped data
    // (Assuming our schema gets updated to support these, or we just stick them on the object)
    mappedData.aiSummary = enrichments.aiSummary;
    mappedData.youtubeQuery = enrichments.youtubeQuery;

    return mappedData;
  } catch (error) {
    console.error(`AI Enrichment failed for ${mappedData.sourceSlug}:`, error.message);
    // Non-fatal, we just return the mapped data without enrichments
    return mappedData; 
  }
}

/**
 * Full extraction pipeline for a single scheme.
 */
async function extractSchemeData(rawDetailData, discoverySummary) {
  const mapped = mapSchemeData(rawDetailData, discoverySummary);
  const enriched = await enrichSchemeWithAI(mapped);
  return enriched;
}

module.exports = {
  extractSchemeData
};
