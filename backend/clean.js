require('dotenv').config();
const mongoose = require('mongoose');
const Scheme = require('./models/Scheme');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI, {family: 4});
  const db = mongoose.connection.db;
  
  // Wipe all PM-KMY from production
  await db.collection('schemes').deleteMany({ title: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)' });
  
  // Add exactly 1 good PM-KMY
  await Scheme.create({
    title: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)',
    category: 'Farmer',
    state: 'Central',
    description: 'A pension scheme for small and marginal farmers.',
    benefits: 'Assured pension of Rs. 3000/- month.',
    eligibility: {
      occupations: ['farmer'],
      ageMin: 18,
      ageMax: 40,
      incomeMax: 1000000,
      gender: ['all'],
      castes: ['all'],
      isBPLRequired: false,
      isDisabilityRequired: false,
      residence: 'all'
    },
    applyLink: 'https://pmkmy.gov.in',
    sourceUrl: 'https://pmkmy.gov.in',
    procedure: 'Enroll at CSC.'
  });

  // Flag everything in staging so it never promotes again
  await db.collection('schemes_staging').updateMany({}, { $set: { promoted: true } });
  
  console.log('Database cleaned and seeded.');
  process.exit(0);
}
fix();
