require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Scheme = require('./models/Scheme');
const { getRecommendations } = require('./services/recommendationService');

async function checkup() {
  console.log("--- DETAILED DIAGNOSTIC CHECKUP ---");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {family: 4});
    console.log("[OK] Connected to MongoDB.");

    // 1. Check schemes in DB
    const schemes = await Scheme.find({});
    console.log(`\n--- SCHEMES IN DATABASE (${schemes.length}) ---`);
    for (const s of schemes) {
      console.log(`- ID: ${s._id}`);
      console.log(`  Title: ${s.title}`);
      console.log(`  Eligibility: ${JSON.stringify(s.eligibility)}`);
    }

    if (schemes.length === 0) {
      console.log("ERROR: No schemes found in the production database!");
      return;
    }

    // 2. Check users in DB
    const users = await User.find({});
    console.log(`\n--- USERS IN DATABASE (${users.length}) ---`);
    if (users.length === 0) {
      console.log("ERROR: No users found in database!");
      return;
    }
    
    // Pick the most recently created user
    const user = users[users.length - 1];
    console.log(`Testing with User ID: ${user._id}`);
    console.log(`User Profile: ${JSON.stringify(user.profile, null, 2)}`);

    if (!user.profile || Object.keys(user.profile).length === 0) {
      console.log("ERROR: User profile is empty! The user hasn't completed onboarding.");
      return;
    }

    // 3. Run Recommendation Engine
    console.log("\n--- RUNNING RECOMMENDATION ENGINE ---");
    const recs = await getRecommendations(user.profile, 'en');
    
    console.log(`\nResults returned: ${recs.recommendations.length} schemes`);
    for (const r of recs.recommendations) {
      console.log(`- Match: ${r.title}`);
      console.log(`  Score: ${r.matchScore}`);
      console.log(`  Reason: ${r.matchReason}`);
    }

  } catch (err) {
    console.error("DIAGNOSTIC FAILED:", err);
  } finally {
    await mongoose.disconnect();
    console.log("--- DIAGNOSTIC COMPLETE ---");
  }
}

checkup();
