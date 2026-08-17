require('dotenv').config();
const mongoose = require('mongoose');
const Scheme = require('./models/Scheme');

mongoose.connect(process.env.MONGODB_URI, {family: 4}).then(async () => {
  await Scheme.updateOne({ title: 'Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)' }, { $set: { 'eligibility.incomeMax': 300000 } });
  console.log('Updated PM-SYM income limit to 300000');
  process.exit(0);
});
