require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');

async function testApi() {
  try {
    const apiUrl = `https://api.myscheme.gov.in/search/v6/schemes?lang=en&q=%5B%5D&keyword=&sort=&from=0&size=1`;
    const response = await axios.get(apiUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.myscheme.gov.in/',
        'Origin': 'https://www.myscheme.gov.in',
        'Connection': 'keep-alive',
        'x-api-key': process.env.MYSCHEME_API_KEY
      }
    });
    
    // Log the top-level keys
    console.log("Top level keys:", Object.keys(response.data));
    
    // If there is a 'data' property, check inside it
    let items;
    if (response.data.data && response.data.data.hits) {
       items = response.data.data.hits.items;
       console.log("Found items under response.data.data.hits.items");
    } else if (response.data.hits) {
       items = response.data.hits.items;
       console.log("Found items under response.data.hits.items");
    } else if (response.data.items) {
       items = response.data.items;
       console.log("Found items under response.data.items");
    }
    
    if (items && items.length > 0) {
       console.log("First item keys:", Object.keys(items[0]));
       console.log("First item basic fields:", {
         slug: items[0].slug || items[0].basicDetails?.slug,
         name: items[0].schemeName || items[0].basicDetails?.schemeName,
       });
       console.log("Full first item:", JSON.stringify(items[0], null, 2).substring(0, 500));
    } else {
       console.log("Could not find items array in response.");
       console.log("Response data snippet:", JSON.stringify(response.data).substring(0, 500));
    }
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testApi();
