const mongoose = require('mongoose');
require('dotenv').config();
const Scheme = require('./models/Scheme');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  try {
    // 1. Update PM-KMY
    await Scheme.updateOne(
      { title: 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)' },
      { 
        $set: { 
          'eligibility.occupations': ['farmer'],
          'eligibility.ageMin': 18,
          'eligibility.ageMax': 40
        }
      }
    );

    // 2. Add Student Scheme
    const studentSchemeExists = await Scheme.findOne({ title: 'National Merit Scholarship for Students' });
    if (!studentSchemeExists) {
      await Scheme.create({
        title: 'National Merit Scholarship for Students',
        category: 'Student',
        state: 'Central',
        description: 'A scholarship for meritorious students to pursue higher education.',
        benefits: 'Rs. 10,000 per year for 3 years.',
        eligibility: {
          occupations: ['student'],
          ageMin: 10,
          ageMax: 25,
          incomeMax: 250000,
          gender: ['all'],
          castes: ['all'],
          isBPLRequired: false,
          isDisabilityRequired: false,
          residence: 'all'
        },
        applyLink: 'https://scholarships.gov.in',
        procedure: 'Apply online via National Scholarship Portal.',
      });
    }
    
    console.log("Successfully updated db!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
