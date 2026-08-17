require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testApi() {
  const token = jwt.sign({ userId: '6a6d8bb63e12710fe868633c' }, process.env.JWT_SECRET);
  const res = await fetch('http://localhost:5000/api/schemes/recommend', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

testApi();
