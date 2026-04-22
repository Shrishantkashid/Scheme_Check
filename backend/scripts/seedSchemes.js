require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Scheme = require('../models/Scheme');

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');
    
    // Clear existing schemes
    await Scheme.deleteMany({});
    console.log('Cleared existing schemes.');

    const dataDir = path.join(__dirname, '../data/schemes');
    const files = fs.readdirSync(dataDir);
    
    let totalSchemes = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dataDir, file);
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        totalSchemes = totalSchemes.concat(fileContent);
        console.log(`Loaded ${fileContent.length} schemes from ${file}`);
      }
    }

    // Insert all schemes
    await Scheme.insertMany(totalSchemes);
    console.log(`Successfully seeded total ${totalSchemes.length} schemes.`);

    mongoose.disconnect();
    console.log('Seeding complete and disconnected.');
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seedDB();
