require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { getRecommendations } = require('../services/recommendationService');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    const user = await User.findOne({ email: "skshrishant44@gmail.com" });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    console.log('Generating recommendations for:', user.fullName);
    console.log('Profile:', JSON.stringify(user.profile, null, 2));

    const startTime = Date.now();
    const result = await getRecommendations(user.profile);
    const endTime = Date.now();

    console.log(`\nAI Recommendations (Time taken: ${endTime - startTime}ms):`);
    console.log('Conclusion:', result.aiConclusion);
    console.log('Matches Found:', result.recommendations.length);
    
    result.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`\n${i+1}. [${rec.matchScore}% Match] ${rec.title} (${rec.state})`);
      console.log(`   Reason: ${rec.personalReason}`);
      console.log(`   Benefits: ${rec.benefits}`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error('Test Error:', err);
  }
}

test();
