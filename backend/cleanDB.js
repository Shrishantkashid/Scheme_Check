require('dotenv').config({path:'.env'});
const mongoose = require('mongoose');
const Scheme = require('./models/Scheme');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await Scheme.deleteMany({ state: { $nin: ['Central', 'Karnataka'] } });
  console.log('Cleaned bad states:', result.deletedCount);
  process.exit(0);
}).catch(console.error);
