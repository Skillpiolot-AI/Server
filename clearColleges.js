const connectDB = require('/Users/ujjwal/Capstone sem 8/Server-college 2/db.js');
const { College } = require('/Users/ujjwal/Capstone sem 8/Server-college 2/models/College.js');
const mongoose = require('mongoose');

const clear = async () => {
  try {
    await connectDB();
    const result = await College.deleteMany({});
    console.log(`Deleted ${result.deletedCount} colleges`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

clear();
