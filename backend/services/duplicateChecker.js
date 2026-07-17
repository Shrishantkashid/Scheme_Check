const stringSimilarity = require('string-similarity');
const Scheme = require('../models/Scheme');

const SIMILARITY_THRESHOLD = 0.85;

/**
 * Checks if a scheme already exists in the database.
 * Primary check: sourceSlug (exact match).
 * Secondary check: title + state (fuzzy match).
 * @param {Object} extractedScheme - The newly mapped/extracted scheme data
 * @returns {Promise<Object>} - { action: 'insert' | 'update' | 'flag_review', schemeId: string }
 */
async function processSchemeDuplicates(extractedScheme) {
  // 1. Primary Check: Exact match on sourceSlug
  if (extractedScheme.sourceSlug) {
    const existingBySlug = await Scheme.findOne({ sourceSlug: extractedScheme.sourceSlug });
    if (existingBySlug) {
      return determineUpdateAction(existingBySlug, extractedScheme);
    }
  }

  // 2. Secondary Check: Fetch existing schemes without slugs (or all) for fuzzy matching
  // This is a fallback for older seeded data that might not have slugs, 
  // or a rare case where the slug changed but the title is identical.
  const existingSchemes = await Scheme.find({}, 'title state category eligibility sourceSlug');

  if (existingSchemes.length === 0) {
    return { action: 'insert' };
  }

  const existingTitles = existingSchemes.map(s => s.title);
  const matches = stringSimilarity.findBestMatch(extractedScheme.title, existingTitles);
  const bestMatch = matches.bestMatch;
  
  if (bestMatch.rating >= SIMILARITY_THRESHOLD) {
    const matchedExistingScheme = existingSchemes[matches.bestMatchIndex];
    
    // Validate state to avoid false positive merges
    if (matchedExistingScheme.state === extractedScheme.state) {
      return determineUpdateAction(matchedExistingScheme, extractedScheme);
    }
  }

  // No close match found
  return { action: 'insert' };
}

/**
 * Determines whether it's safe to auto-update or if manual review is needed.
 */
function determineUpdateAction(existingScheme, extractedScheme) {
  // Determine if critical fields (eligibility) have changed.
  const isEligibilityChanged = hasEligibilityChanged(existingScheme.eligibility, extractedScheme.eligibility);
  
  if (isEligibilityChanged) {
    console.warn(`[FLAG] Scheme '${extractedScheme.title}' exists but critical eligibility criteria changed.`);
    return { action: 'flag_review', schemeId: existingScheme._id };
  } else {
    console.log(`[UPDATE] Scheme '${extractedScheme.title}' exists. Safe to update non-critical fields.`);
    return { action: 'update', schemeId: existingScheme._id };
  }
}

/**
 * Compares eligibility objects to detect any changes.
 */
function hasEligibilityChanged(existing, extracted) {
  if (!existing || !extracted) return true;

  // We added rawText in the new API pipeline. If raw text differs significantly, flag it.
  if (existing.rawText !== extracted.rawText) {
    return true; 
  }

  // Check structured fields (kept for backward compatibility with old scraper logic)
  const keysToCheck = ['ageMin', 'ageMax', 'incomeMax', 'landSizeMax', 'residence', 'isBPLRequired', 'isDisabilityRequired'];
  for (const key of keysToCheck) {
    if (existing[key] !== extracted[key]) return true;
  }
  
  const arraysToCheck = ['gender', 'occupations', 'castes'];
  for (const key of arraysToCheck) {
    const existingArr = existing[key] || [];
    const extractedArr = extracted[key] || [];
    if (existingArr.length !== extractedArr.length) return true;
    
    const e1 = [...existingArr].sort().join(',');
    const e2 = [...extractedArr].sort().join(',');
    if (e1 !== e2) return true;
  }
  
  return false;
}

module.exports = {
  processSchemeDuplicates
};
