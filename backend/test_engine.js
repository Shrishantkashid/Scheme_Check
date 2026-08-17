const assert = require('assert');
const { applyHardFilters, scoreSchemes } = require('./services/recommendationEngine');

// Mock data
const mockSchemes = [
  {
    _id: "1",
    title: "Karnataka Farmer Scheme",
    state: "Karnataka",
    eligibility: {
      ageMin: 18,
      ageMax: 60,
      incomeMax: 50000,
      occupations: ['farmer'],
      castes: ['all'],
      gender: ['all']
    }
  },
  {
    _id: "2",
    title: "Central Student Scholarship",
    state: "Central",
    eligibility: {
      ageMin: 0,
      ageMax: 25,
      incomeMax: Infinity,
      occupations: ['student'],
      castes: ['sc', 'st'],
      gender: ['female']
    }
  },
  {
    _id: "3",
    title: "General BPL Scheme",
    state: "Central",
    eligibility: {
      ageMin: 0,
      ageMax: 200,
      incomeMax: Infinity,
      occupations: ['all'],
      castes: ['all'],
      gender: ['all'],
      isBPLRequired: true
    }
  }
];

function runTests() {
  console.log("Running Unit Tests for Recommendation Engine...");

  // Test 1: Hard Filters - Perfect Match
  const profile1 = {
    location: 'Karnataka',
    age: 30,
    income: 40000,
    occupation: 'farmer',
    category: 'general',
    gender: 'male',
    bpl_card: 'no'
  };
  const filtered1 = applyHardFilters(profile1, mockSchemes);
  assert.strictEqual(filtered1.length, 1, "Should match exactly 1 scheme");
  assert.strictEqual(filtered1[0].title, "Karnataka Farmer Scheme", "Should match Farmer Scheme");

  // Test 2: Hard Filters - Excluded by State
  const profile2 = { ...profile1, location: 'Maharashtra' };
  const filtered2 = applyHardFilters(profile2, mockSchemes);
  assert.strictEqual(filtered2.length, 0, "Should be excluded by state");

  // Test 3: Hard Filters - Excluded by Income
  const profile3 = { ...profile1, income: 60000 };
  const filtered3 = applyHardFilters(profile3, mockSchemes);
  assert.strictEqual(filtered3.length, 0, "Should be excluded by income");

  // Test 4: Hard Filters - Student Match
  const profile4 = {
    location: 'Karnataka',
    age: 20,
    income: 10000,
    occupation: 'student',
    category: 'sc',
    gender: 'female',
    bpl_card: 'no'
  };
  const filtered4 = applyHardFilters(profile4, mockSchemes);
  assert.strictEqual(filtered4.length, 1, "Should match Student Scholarship");

  // Test 5: Hard Filters - Null/Missing fields do not disqualify
  const profile5 = {
    location: 'Karnataka',
    // Missing age, income, occupation, etc.
  };
  const filtered5 = applyHardFilters(profile5, mockSchemes);
  // It should match both Central Student Scholarship (since it doesn't disqualify on missing fields)
  // And Karnataka Farmer Scheme (since it doesn't disqualify on missing fields)
  assert.strictEqual(filtered5.length, 3, "Missing fields should not disqualify");

  // Test 6: Scoring Weights
  const profile6 = {
    occupation: 'farmer',
    bpl_card: 'yes',
    income: 20000 // < 70% of 50000, should get income proximity points
  };
  const scored6 = scoreSchemes(profile6, mockSchemes);
  
  const farmerScheme = scored6.find(s => s._id === "1");
  const bplScheme = scored6.find(s => s._id === "3");

  // Farmer scheme: Base(50) + Exact Occupation(20) + Income Proximity(5) = 75
  assert.strictEqual(farmerScheme.matchScore, 75, "Farmer scheme score should be 75");
  
  // BPL Scheme: Base(50) + BPL Match(10) = 60
  assert.strictEqual(bplScheme.matchScore, 60, "BPL scheme score should be 60");

  console.log("All Unit Tests Passed Successfully! ✅");
}

try {
  runTests();
} catch (e) {
  console.error("Test Failed: ", e.message);
  process.exit(1);
}
