require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MentorService = require('./models/MentorService');

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to DB');

  const user = await User.findOne({ email: 'rahul.kapoor@skillpilot.dev' });
  if (!user) {
    console.log('❌ User not found');
    process.exit(0);
  }

  console.log('👤 User found:', user._id);

  try {
    const services = await MentorService.getForMentor(user._id.toString(), true);
    console.log('📊 Services Count:', services.length);
  } catch (err) {
    console.error('💥 CRASHED:', err);
  }

  await mongoose.disconnect();
}

main();
