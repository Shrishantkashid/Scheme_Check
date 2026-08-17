const mongoose = require('mongoose');
require('dotenv').config();
const { getRecommendations } = require('./services/recommendationService');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const userProfile = {
    age: 25,
    gender: 'male',
    occupation: 'student',
    income: 10000,
    category: 'general'
  };

  try {
    const recs = await getRecommendations(userProfile, 'en');
    console.log("Recommendations Output:");
    console.log(JSON.stringify(recs, null, 2));
  } catch (err) {
    console.error("Error during recommendations:", err);
  } finally {
    await mongoose.disconnect();
  }
}

debug();
