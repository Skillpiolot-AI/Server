const mongoose = require('mongoose');
// Load environment variables from a .env file when present. If the project
// already configures dotenv elsewhere, this call is harmless (it will noop).
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURL = process.env.mongo_url || process.env.MONGO_URL;
    if (!mongoURL) {
      console.error('Missing MongoDB connection string. Set "mongo_url" or "MONGO_URL" in the environment.');
      process.exit(1);
    }

    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;


