const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { College } = require('./models/College');
const connectDB = require('./db');

const seedColleges = async () => {
  try {
    // 1. Connect DB
    await connectDB();

    // 2. Read JSON file
    const dataPath = path.join(__dirname, 'colleges_combined.json');
    const collegesData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Found ${collegesData.length} colleges to insert`);

    // 3. Optional: Clear existing
    await College.deleteMany({});
    console.log('Cleared existing colleges');

    // 4. Insert data
    const result = await College.insertMany(collegesData);
    console.log(`Successfully inserted ${result.length} colleges`);
  } catch (error) {
    console.error('Error seeding colleges:', error);
  } finally {
    // 5. Disconnect
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

seedColleges();
