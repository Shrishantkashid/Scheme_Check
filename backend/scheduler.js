const cron = require('node-cron');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const path = require('path');
const { promoteStagedSchemes } = require('./services/promoter');

let isSchedulerRunning = false;

async function runDiscoveryPipeline() {
  if (isSchedulerRunning) {
    console.log('[Scheduler] In-memory lock active. Skipping run.');
    return;
  }

  const crawlLogsCollection = mongoose.connection.db.collection('crawl_logs');
  
  // Check DB lock
  const runningLock = await crawlLogsCollection.findOne({ status: 'running' });
  if (runningLock) {
    console.log('[Scheduler] Database lock active. Another crawler instance is running.');
    return;
  }

  // Set Lock
  isSchedulerRunning = true;
  const lockId = new mongoose.Types.ObjectId();
  await crawlLogsCollection.insertOne({
    _id: lockId,
    status: 'running',
    startTime: new Date(),
    type: 'discovery_pipeline'
  });

  console.log('[Scheduler] Starting Python Discovery Pipeline...');
  
  const rootDir = path.join(__dirname, '..');
  
  // Use spawn to pipe stdout and stderr
  const pythonProcess = spawn('python', ['-m', 'discovery.run', '--source', 'myscheme', '--limit', '10'], {
    cwd: rootDir
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Crawler stdout]: ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Crawler stderr]: ${data.toString().trim()}`);
  });

  pythonProcess.on('close', async (code) => {
    console.log(`[Scheduler] Python crawler exited with code ${code}`);
    
    if (code === 0) {
      console.log('[Scheduler] Crawler succeeded. Running Auto-Promoter...');
      await promoteStagedSchemes();
    } else {
      console.error('[Scheduler] Crawler failed. Skipping promotion.');
    }

    // Release Lock
    await crawlLogsCollection.updateOne(
      { _id: lockId },
      { $set: { status: 'completed', endTime: new Date(), exitCode: code } }
    );
    isSchedulerRunning = false;
    console.log('[Scheduler] Pipeline run finished and lock released.');
  });
}

function startScheduler() {
  // Run at 2:00 AM every day
  cron.schedule('0 2 * * *', () => {
    console.log('[Scheduler] Cron triggered at 2:00 AM.');
    runDiscoveryPipeline();
  });
  console.log('[Scheduler] Cron job registered for 02:00 AM daily.');
}

module.exports = {
  startScheduler,
  runDiscoveryPipeline
};
