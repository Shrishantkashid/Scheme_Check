const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

/**
 * Auto-Promoter Service
 * Queries schemes_staging for validated records and upserts them into the main schemes collection.
 */
async function promoteStagedSchemes() {
  try {
    const stagingCollection = mongoose.connection.db.collection('schemes_staging');
    const crawlLogsCollection = mongoose.connection.db.collection('crawl_logs');
    const validationLogsCollection = mongoose.connection.db.collection('validation_logs');

    // Find schemes that have high confidence and haven't been promoted in this version yet
    // Find schemes that have high confidence and haven't been promoted yet
    const stagedSchemes = await stagingCollection.find({ 
      confidence: { $gte: 0.8 },
      promoted: { $ne: true }
    }).toArray();

    if (stagedSchemes.length === 0) {
      console.log("[Promoter] No validated schemes in staging to promote.");
      return;
    }

    console.log(`[Promoter] Found ${stagedSchemes.length} schemes to evaluate for promotion.`);

    let promotedCount = 0;
    let rejectedCount = 0;

    for (const staged of stagedSchemes) {
      // Must have a source URL to use as a stable key
      const stableKey = staged.sourceUrl || staged.url || staged.applyLink;
      
      if (!stableKey) {
        rejectedCount++;
        await validationLogsCollection.insertOne({
          timestamp: new Date(),
          error: "Missing stable key (sourceUrl/applyLink) for upsert",
          schemeTitle: staged.title
        });
        continue;
      }

      // Map from StagedScheme (Pydantic output) to Scheme (Mongoose schema)
      const eligibility = staged.eligibility || {};
      
      const updateDoc = {
        $set: {
          title: staged.title,
          category: staged.category,
          state: staged.state,
          description: staged.description || staged.title,
          benefits: (staged.benefits || []).join('\n'),
          documents: staged.documents || [],
          applyLink: staged.applyLink || '',
          procedure: staged.procedure || '',
          sourceSlug: staged.source || 'myscheme',
          sourceUrl: stableKey,
          lastScrapedAt: new Date(),
          
          'eligibility.ageMin': eligibility.ageMin !== undefined ? eligibility.ageMin : 0,
          'eligibility.ageMax': eligibility.ageMax !== undefined ? eligibility.ageMax : 200,
          'eligibility.incomeMax': eligibility.incomeMax !== undefined ? eligibility.incomeMax : Infinity,
          'eligibility.gender': eligibility.gender || ['all'],
          'eligibility.occupations': eligibility.occupations || ['all'],
          'eligibility.castes': eligibility.castes || ['all'],
          'eligibility.isBPLRequired': eligibility.isBPLRequired || false,
          'eligibility.isDisabilityRequired': eligibility.isDisabilityRequired || false,
          'eligibility.residence': eligibility.residence || 'all'
        }
      };

      try {
        await Scheme.updateOne(
          { sourceUrl: stableKey },
          updateDoc,
          { upsert: true }
        );
        
        // Mark as promoted in staging
        await stagingCollection.updateOne(
          { _id: staged._id },
          { $set: { promoted: true } }
        );
        
        promotedCount++;
      } catch (err) {
        rejectedCount++;
        await validationLogsCollection.insertOne({
          timestamp: new Date(),
          error: `Upsert failed: ${err.message}`,
          schemeTitle: staged.title
        });
      }
    }

    // Log the promotion run
    await crawlLogsCollection.insertOne({
      timestamp: new Date(),
      type: 'promotion_run',
      stagedCount: stagedSchemes.length,
      promotedCount,
      rejectedCount
    });

    console.log(`[Promoter] Promotion complete. Promoted: ${promotedCount}, Rejected: ${rejectedCount}.`);

  } catch (error) {
    console.error("[Promoter] Error during promotion:", error);
  }
}

module.exports = {
  promoteStagedSchemes
};
