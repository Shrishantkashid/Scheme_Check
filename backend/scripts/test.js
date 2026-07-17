const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('https://www.myscheme.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    
    // Check if any obvious keys are in the HTML
    const html = res.data;
    if (html.includes('x-api-key') || html.includes('api-key')) {
      console.log("Found something like 'api-key' in HTML!");
      const match = html.match(/.{0,50}api-key.{0,50}/gi);
      console.log(match);
    }
  } catch (e) {
    console.error("Error fetching homepage:", e.message);
  }
}

test();
