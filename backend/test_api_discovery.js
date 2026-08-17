require('dotenv').config();
const { discoverSchemes } = require('./services/discoveryService');

async function test() {
  try {
    const schemes = await discoverSchemes(5, 0, 5); // Just fetch 5 for a test
    console.log(schemes);
  } catch (error) {
    console.error("Test failed:", error);
  }
}
test();
