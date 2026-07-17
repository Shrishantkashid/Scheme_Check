const axios = require('axios');

const TIMEOUT_MS = 15000;

/**
 * Fetches the full detailed JSON record for a specific scheme slug.
 * @param {string} slug - The unique slug identifier for the scheme.
 * @returns {Promise<Object>} - The detailed scheme data object (data.en)
 */
async function fetchSchemeDetail(slug) {
  const apiUrl = `https://api.myscheme.gov.in/schemes/v6/public/schemes?slug=${slug}&lang=en`;
  
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

    const data = response.data?.data?.en;
    if (!data) {
      throw new Error("Invalid detail API response structure: missing data.en");
    }

    return data;
  } catch (error) {
    console.error(`Error fetching details for slug '${slug}':`, error.message);
    throw error;
  }
}

module.exports = {
  fetchSchemeDetail
};
