require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { enrichSchemeWithAI } = require('../services/extractionService');
const Scheme = require('../models/Scheme');

const DELAY_BETWEEN_CALLS_MS = 1000; // 1s delay to respect Groq rate limits

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  let limit = null;

  args.forEach(arg => {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    }
  });

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const query = { enrichmentStatus: { $in: ['pending', 'failed'] } };
    
    console.log(`Querying schemes for AI enrichment...`);
    let schemesToEnrich;
    if (limit) {
      schemesToEnrich = await Scheme.find(query).limit(limit);
    } else {
      schemesToEnrich = await Scheme.find(query);
    }

    if (schemesToEnrich.length === 0) {
      console.log('No pending or failed schemes found for enrichment.');
      process.exit(0);
    }

    console.log(`Starting Enrichment Pipeline for ${schemesToEnrich.length} schemes... (Groq Model: ${process.env.GROQ_ENRICHMENT_MODEL || 'llama-3.1-8b-instant'})`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < schemesToEnrich.length; i++) {
      const scheme = schemesToEnrich[i];
      console.log(`\n[${i + 1}/${schemesToEnrich.length}] Enriching: ${scheme.sourceSlug || scheme._id} - ${scheme.title}`);

      try {
        // enrichSchemeWithAI expects a mapped object, our Mongoose document works fine
        const enriched = await enrichSchemeWithAI(scheme);

        // Save back to DB
        scheme.aiSummary = enriched.aiSummary;
        scheme.youtubeQuery = enriched.youtubeQuery;
        
        if (enriched.structuredEligibility) {
          Object.assign(scheme.eligibility, enriched.structuredEligibility);
        }
        
        scheme.enrichmentStatus = 'done';
        await scheme.save();

        console.log(`[SUCCESS] Enriched and saved: ${scheme.title}`);
        successCount++;
      } catch (err) {
        console.error(`[FAILED] Failed to enrich ${scheme.title}:`, err.message);
        
        // Mark as failed so we can retry later and it doesn't stay 'pending' infinitely
        scheme.enrichmentStatus = 'failed';
        await scheme.save();
        failCount++;
      }

      if (i < schemesToEnrich.length - 1) {
        await delay(DELAY_BETWEEN_CALLS_MS);
      }
    }

    console.log('\n--- Enrichment Pipeline Execution Summary ---');
    console.log(`Processed:   ${schemesToEnrich.length}`);
    console.log(`Successful:  ${successCount}`);
    console.log(`Failed:      ${failCount}`);

    // Check remaining queue
    const remaining = await Scheme.countDocuments({ enrichmentStatus: { $in: ['pending', 'failed'] } });
    console.log(`Remaining in DB queue: ${remaining}`);

  } catch (error) {
    console.error("Pipeline crashed:", error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

main();
