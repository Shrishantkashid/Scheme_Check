require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { discoverSchemes, delay } = require('../services/discoveryService');
const { fetchSchemeDetail } = require('../services/schemeDetailService');
const { mapSchemeData } = require('../services/extractionService');
const { processSchemeDuplicates } = require('../services/duplicateChecker');
const Scheme = require('../models/Scheme');

const DELAY_BETWEEN_SCHEMES_MS = 500; // 500ms delay

async function main() {
  // Parse simple CLI arguments
  const args = process.argv.slice(2);
  let limit = null;
  let offset = 0;

  args.forEach(arg => {
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    }
    if (arg.startsWith('--from=')) {
      offset = parseInt(arg.split('=')[1], 10);
    }
  });

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log(`Starting Seed Pipeline... (limit=${limit || 'none'}, from=${offset})`);
    
    // 1. Discovery
    // discoverSchemes returns an array of simple overview objects
    const discoveredSchemes = await discoverSchemes(100, offset, limit);
    
    if (discoveredSchemes.length === 0) {
      console.log('No schemes discovered.');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;
    let updateCount = 0;
    let flagCount = 0;

    // 2. Process each scheme
    for (let i = 0; i < discoveredSchemes.length; i++) {
      const summary = discoveredSchemes[i];
      const slug = summary.slug;
      
      console.log(`\n[${i+1}/${discoveredSchemes.length}] Processing: ${slug} - ${summary.schemeName}`);
      
      try {
        // Fetch full raw details
        const rawDetail = await fetchSchemeDetail(slug);
        
        // Map to our schema deterministically (NO Groq AI here)
        const extractedData = mapSchemeData(rawDetail, summary);

        // Deduplicate
        const dupCheckResult = await processSchemeDuplicates(extractedData);

        // Save
        if (dupCheckResult.action === 'insert') {
          // By default, Mongoose will set enrichmentStatus to 'pending'
          await Scheme.create(extractedData);
          console.log(`[INSERTED] New scheme saved (pending AI enrichment): ${extractedData.title}`);
          successCount++;
        } else if (dupCheckResult.action === 'update') {
          // Safe auto-update of non-critical fields.
          // Note: we intentionally do NOT update aiSummary, youtubeQuery, or enrichmentStatus here 
          // to avoid downgrading a 'done' status.
          await Scheme.findByIdAndUpdate(dupCheckResult.schemeId, {
            $set: {
              description: extractedData.description,
              benefits: extractedData.benefits,
              documents: extractedData.documents,
              applyLink: extractedData.applyLink,
              procedure: extractedData.procedure,
              tags: extractedData.tags,
              lastScrapedAt: extractedData.lastScrapedAt
            }
          });
          console.log(`[UPDATED] Existing scheme updated: ${extractedData.title}`);
          updateCount++;
        } else if (dupCheckResult.action === 'flag_review') {
           // Flagged due to critical eligibility change
           await Scheme.findByIdAndUpdate(dupCheckResult.schemeId, {
              $set: { lastScrapedAt: extractedData.lastScrapedAt }
           });
           console.log(`[FLAGGED] Scheme needs manual review (eligibility changed): ${extractedData.title}`);
           flagCount++;
        }

      } catch (err) {
         console.error(`Failed to process ${slug}:`, err.message);
         failCount++;
      }

      // Polite delay
      if (i < discoveredSchemes.length - 1) {
        await delay(DELAY_BETWEEN_SCHEMES_MS);
      }
    }

    console.log('\n--- Seed Pipeline Execution Summary ---');
    console.log(`Total Found: ${discoveredSchemes.length}`);
    console.log(`Inserted:    ${successCount}`);
    console.log(`Updated:     ${updateCount}`);
    console.log(`Flagged:     ${flagCount}`);
    console.log(`Failed:      ${failCount}`);

  } catch (error) {
    console.error("Pipeline crashed:", error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

main();
