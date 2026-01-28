// Script to delete mentor profile from MongoDB
// Run with: node deleteData.js

const mongoose = require('mongoose');
require('dotenv').config();

const MENTOR_PROFILE_ID = '6943dd42061bd76cf000294e';

async function deleteData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Delete the mentor profile
    const result = await mongoose.connection.db.collection('mentorprofiles').deleteOne({
      _id: new mongoose.Types.ObjectId(MENTOR_PROFILE_ID),
    });

    if (result.deletedCount === 1) {
      console.log('✅ Successfully deleted mentor profile:', MENTOR_PROFILE_ID);
    } else {
      console.log('⚠️ No document found with ID:', MENTOR_PROFILE_ID);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

deleteData();
