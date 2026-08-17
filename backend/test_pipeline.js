require('dotenv').config();
const mongoose = require('mongoose');
const { runDiscoveryPipeline } = require('./scheduler');

async function testPipeline() {
  await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
  console.log("Connected to MongoDB. Triggering pipeline...");
  
  // Clear any stale locks
  await mongoose.connection.db.collection('crawl_logs').deleteMany({ status: 'running' });

  await runDiscoveryPipeline();
  
  // Wait a while before exiting so the child process has time to complete
  setTimeout(() => {
    console.log("Exiting test script.");
    process.exit(0);
  }, 120000); // Wait 2 minutes
}

testPipeline();
