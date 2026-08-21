const axios = require('axios');

async function testRenderRecommendations() {
  try {
    const baseURL = 'https://scheme-check.onrender.com/api';
    
    // 1. Login to get a token (assuming skshrishant44@gmail.com exists, or we use our test user)
    const email = `test_${Date.now()}@test.com`;
    console.log('Registering user:', email);
    const regRes = await axios.post(`${baseURL}/auth/signup`, {
      fullName: 'Test User',
      email: email,
      password: 'password123'
    });
    
    const token = regRes.data.token;
    
    // 2. Set user profile
    await axios.put(`${baseURL}/user/profile`, {
      profile: {
        age: 20,
        gender: "male",
        category: "general",
        occupation: "farmer",
        income: 250000,
        location: "rural",
        disability: "no",
        bpl_card: "yes",
        state: "Karnataka",
        district: "Mysuru",
        land_size: 5
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 3. Get recommendations
    console.log('Fetching recommendations from Render...');
    const recRes = await axios.get(`${baseURL}/schemes/recommend`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Render returned ${recRes.data.recommendations?.length} recommendations.`);
    console.log('AI Conclusion:', recRes.data.aiConclusion);
    
  } catch (err) {
    console.error('Error testing Render Recommendations:', err.response?.data || err.message);
  }
}

testRenderRecommendations();
