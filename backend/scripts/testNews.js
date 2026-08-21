require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { getCategoryNews } = require('../services/recommendationService');

async function testNews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    const user = await User.findOne({ email: "skshrishant44@gmail.com" });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    console.log('Generating news for profile:', user.profile);
    const news = await getCategoryNews(user.profile);
    console.log('Generated News:', JSON.stringify(news, null, 2));

    mongoose.disconnect();
  } catch (err) {
    console.error('Test Error:', err);
  }
}

testNews();
