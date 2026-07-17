const axios = require('axios');

// Hygiene constants
const DELAY_MS = 300; // 300ms delay between requests
const TIMEOUT_MS = 15000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Discovers schemes from the myscheme search API.
 * Handles pagination automatically based on total results.
 * @param {number} pageSize - Number of results per page (default 100)
 * @param {number} startOffset - Starting offset (default 0)
 * @param {number} maxLimit - Optional maximum number of schemes to fetch overall
 * @returns {Promise<Object[]>} - Array of scheme summary objects
 */
async function discoverSchemes(pageSize = 100, startOffset = 0, maxLimit = null) {
  const allSchemes = [];
  let currentOffset = startOffset;
  let totalSchemesAvailable = Infinity;

  console.log(`Starting API discovery (pageSize=${pageSize}, startOffset=${startOffset}, maxLimit=${maxLimit || 'none'})`);

  while (currentOffset < totalSchemesAvailable) {
    if (maxLimit !== null && allSchemes.length >= maxLimit) {
      console.log(`Reached requested limit of ${maxLimit} schemes.`);
      break;
    }

    // Don't exceed the total limit if we're near the end of our requested limit
    let fetchSize = pageSize;
    if (maxLimit !== null && (allSchemes.length + fetchSize) > maxLimit) {
      fetchSize = maxLimit - allSchemes.length;
    }

    const apiUrl = `https://api.myscheme.gov.in/search/v6/schemes?lang=en&q=%5B%5D&keyword=&sort=&from=${currentOffset}&size=${fetchSize}`;
    
    console.log(`Fetching from offset ${currentOffset}...`);
    
    try {
      const response = await axios.get(apiUrl, {
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.myscheme.gov.in/',
          'Origin': 'https://www.myscheme.gov.in',
          'Connection': 'keep-alive',
          // NOTE: This is a static key embedded in their frontend. 
          // If the API starts returning 401s again, this key was likely rotated or we've been rate-limited.
          'x-api-key': process.env.MYSCHEME_API_KEY
        }
      });

      if (response.status !== 200) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = response.data?.data;
      if (!data || !data.hits) {
        throw new Error("Invalid API response structure");
      }

      totalSchemesAvailable = data.hits.page.total;
      const items = data.hits.items || [];
      
      const mappedItems = items.map(item => {
        const fields = item.fields || {};
        return {
          slug: Array.isArray(fields.slug) ? fields.slug[0] : fields.slug,
          schemeName: Array.isArray(fields.schemeName) ? fields.schemeName[0] : fields.schemeName,
          schemeCategory: Array.isArray(fields.schemeCategory) ? fields.schemeCategory[0] : fields.schemeCategory,
          tags: Array.isArray(fields.tags) ? fields.tags : (fields.tags ? [fields.tags] : [])
        };
      });
      
      allSchemes.push(...mappedItems);
      currentOffset += fetchSize;

      console.log(`Discovered ${items.length} schemes on this page. Total collected: ${allSchemes.length} / ${totalSchemesAvailable}`);

      // Polite delay
      await delay(DELAY_MS);

    } catch (error) {
      console.error(`Error fetching offset ${currentOffset}:`, error.message);
      // Basic retry could be implemented here, for now we break and return what we have
      break; 
    }
  }

  return allSchemes.slice(0, maxLimit || allSchemes.length);
}

module.exports = {
  discoverSchemes,
  delay
};
