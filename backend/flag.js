require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI, {family: 4});
  await mongoose.connection.db.collection('schemes_staging').updateMany({}, { $set: { promoted: true } });
  console.log('Staging records flagged.');
  process.exit(0);
}
fix();
