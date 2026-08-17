/**
 * Deterministic Engine for Stage 1 (Hard Filters) and Stage 2 (Weighted Scoring).
 * These are pure functions, completely decoupled from MongoDB and LLMs.
 */

/**
 * Normalizes a list of strings for loose matching.
 */
function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => String(item).toLowerCase().trim());
}

/**
 * Stage 1: Hard Filters (Deterministic)
 * A scheme is excluded outright if any *known* eligibility constraint is violated.
 * Unknown/null fields on either side are treated as "not disqualifying".
 * 
 * @param {Object} userProfile 
 * @param {Array} schemes 
 * @returns {Array} List of schemes that pass the hard filters
 */
function applyHardFilters(userProfile, schemes) {
  const {
    gender = 'all',
    age = null,
    income = null,
    occupation = 'all',
    category = 'all',
    location = 'all', // Can be state-level string, e.g. 'Karnataka'
    marital_status = 'all',
    minority = 'all'
  } = userProfile;

  const normalizedUserGender = String(gender).toLowerCase();
  const normalizedUserOcc = String(occupation).toLowerCase();
  const normalizedUserCategory = String(category).toLowerCase();
  const normalizedUserLocation = String(location).toLowerCase();
  const normalizedUserMarital = String(marital_status).toLowerCase();
  const normalizedUserMinority = String(minority).toLowerCase();
  
  const isUserBPL = userProfile.bpl_card === undefined ? null : String(userProfile.bpl_card).toLowerCase() === 'yes';
  const hasUserDisability = userProfile.disability === undefined ? null : String(userProfile.disability).toLowerCase() === 'yes';

  return schemes.filter(scheme => {
    const el = scheme.eligibility || {};

    // 1. State mismatch
    // If scheme state is Central, it applies to all. If it's Karnataka, user must be in Karnataka or 'all'.
    if (scheme.state && scheme.state.toLowerCase() !== 'central') {
      const schemeState = scheme.state.toLowerCase();
      if (normalizedUserLocation !== 'all' && normalizedUserLocation !== schemeState) {
        return false;
      }
    }

    // 2. Age constraints
    if (age !== null && age !== undefined) {
      const userAge = Number(age);
      if (typeof el.ageMin === 'number' && userAge < el.ageMin) return false;
      if (typeof el.ageMax === 'number' && userAge > el.ageMax) return false;
    }

    // 3. Income ceiling
    if (income !== null && income !== undefined) {
      const userIncome = Number(income);
      if (typeof el.incomeMax === 'number' && el.incomeMax !== null && userIncome > el.incomeMax) {
        return false;
      }
    }

    // 4. Gender restriction
    if (el.gender && Array.isArray(el.gender) && el.gender.length > 0) {
      const schemeGenders = normalizeList(el.gender);
      if (!schemeGenders.includes('all') && normalizedUserGender !== 'all') {
        if (!schemeGenders.includes(normalizedUserGender)) return false;
      }
    }

    // 5. Category (Caste) restriction
    if (el.castes && Array.isArray(el.castes) && el.castes.length > 0) {
      const schemeCastes = normalizeList(el.castes);
      if (!schemeCastes.includes('all') && normalizedUserCategory !== 'all') {
        if (!schemeCastes.includes(normalizedUserCategory)) return false;
      }
    }

    // 6. Occupation restriction
    if (el.occupations && Array.isArray(el.occupations) && el.occupations.length > 0) {
      const schemeOccs = normalizeList(el.occupations);
      if (!schemeOccs.includes('all') && normalizedUserOcc !== 'all') {
        if (!schemeOccs.includes(normalizedUserOcc)) return false;
      }
    }

    // 7. BPL constraint
    if (el.isBPLRequired === true && isUserBPL === false) {
      return false;
    }

    // 8. Disability constraint
    if (el.isDisabilityRequired === true && hasUserDisability === false) {
      return false;
    }

    // 9. Marital Status constraint
    if (el.maritalStatus && Array.isArray(el.maritalStatus) && el.maritalStatus.length > 0) {
      const schemeMaritals = normalizeList(el.maritalStatus);
      if (!schemeMaritals.includes('all') && normalizedUserMarital !== 'all') {
        if (!schemeMaritals.includes(normalizedUserMarital)) return false;
      }
    }

    // 10. Minority constraint
    if (el.minority && el.minority.toLowerCase() !== 'all' && normalizedUserMinority !== 'all') {
      if (el.minority.toLowerCase() === 'yes' && normalizedUserMinority === 'no') return false;
      if (el.minority.toLowerCase() === 'no' && normalizedUserMinority === 'yes') return false;
    }

    return true; // Passed all hard filters
  });
}

/**
 * Stage 2: Weighted Scoring (Deterministic)
 * Computes a 0-100 match score for schemes that survived Stage 1.
 * 
 * @param {Object} userProfile 
 * @param {Array} schemes 
 * @param {Number} limit Number of top schemes to return
 * @returns {Array} Ranked list of schemes with a `matchScore` and `matchedCriteria` array appended.
 */
function scoreSchemes(userProfile, schemes, limit = 15) {
  const {
    gender = 'all',
    occupation = 'all',
    category = 'all',
    bpl_card = 'no',
    disability = 'no',
    income = null,
    marital_status = 'all',
    minority = 'no'
  } = userProfile;

  const normalizedUserOcc = String(occupation).toLowerCase();
  const normalizedUserCategory = String(category).toLowerCase();
  const normalizedUserMarital = String(marital_status).toLowerCase();
  const isMinority = String(minority).toLowerCase() === 'yes';
  const isBPL = String(bpl_card).toLowerCase() === 'yes';
  const hasDisability = String(disability).toLowerCase() === 'yes';
  const userIncome = income !== null ? Number(income) : 0;

  const scoredSchemes = schemes.map(scheme => {
    let score = 50; // Base score for surviving hard filters
    let matchedCriteria = ['Meets basic eligibility'];
    const el = scheme.eligibility || {};

    // 1. Exact Occupation Match (High weight)
    if (el.occupations && Array.isArray(el.occupations)) {
      const schemeOccs = normalizeList(el.occupations);
      if (normalizedUserOcc !== 'all' && schemeOccs.includes(normalizedUserOcc)) {
        score += 20;
        matchedCriteria.push(`Specifically targets ${normalizedUserOcc}s`);
      }
    }

    // 2. Exact Category Match (Moderate weight)
    if (el.castes && Array.isArray(el.castes)) {
      const schemeCastes = normalizeList(el.castes);
      if (normalizedUserCategory !== 'all' && schemeCastes.includes(normalizedUserCategory)) {
        score += 15;
        matchedCriteria.push(`Targeted for ${normalizedUserCategory} category`);
      }
    }

    // 3. Optional criteria matches (Incremental weight)
    if (el.isBPLRequired && isBPL) {
      score += 10;
      matchedCriteria.push('Matches BPL status');
    }
    if (el.isDisabilityRequired && hasDisability) {
      score += 15;
      matchedCriteria.push('Supports persons with disabilities');
    }
    
    // 4. Marital and Minority matches
    if (el.minority && el.minority.toLowerCase() === 'yes' && isMinority) {
      score += 15;
      matchedCriteria.push('Targets minority communities');
    }
    if (el.maritalStatus && Array.isArray(el.maritalStatus)) {
      const schemeMaritals = normalizeList(el.maritalStatus);
      if (normalizedUserMarital !== 'all' && !schemeMaritals.includes('all') && schemeMaritals.includes(normalizedUserMarital)) {
        score += 10;
        matchedCriteria.push(`Targeted for ${normalizedUserMarital} status`);
      }
    }

    // 5. Income proximity (Small weight)
    if (typeof el.incomeMax === 'number' && el.incomeMax < Infinity) {
      // If user's income is at least 30% below the ceiling, they are comfortably eligible
      if (userIncome < (el.incomeMax * 0.7)) {
        score += 5;
        matchedCriteria.push('Well within income limits');
      }
    }

    // Cap at 100
    score = Math.min(100, score);

    return {
      ...scheme.toObject ? scheme.toObject() : scheme, // Handle Mongoose documents vs POJOs
      matchScore: score,
      matchedCriteria
    };
  });

  return scoredSchemes
    .filter(scheme => scheme.matchScore >= 60) // Require more than just passing hard filters
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

module.exports = {
  applyHardFilters,
  scoreSchemes
};
