const mongoose = require('mongoose');
const User = require('./models/User');
const Profile = require('./models/Profile');
require('dotenv').config();

async function checkProfiles() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    const emails = ['shivanshkhera15.12.2002@gmail.com', 'jenachandan741@gmail.com'];

    for (const email of emails) {
      const user = await User.findOne({ email });
      if (user) {
        console.log(`\nUser: ${user.name} (${user.email})`);
        const profile = await Profile.findOne({ user: user._id });
        if (profile) {
          console.log('Profile found:');
          console.log('Bio:', profile.bio);
          console.log('Skills:', profile.skills);
          console.log('Tenth Grade:', profile.tenthGrade);
          console.log('Twelfth Grade:', profile.twelfthGrade);
          console.log('Undergraduate:', profile.undergraduate);
          console.log('Graduation:', profile.graduation);
        } else {
          console.log('Profile NOT found');
        }
      } else {
        console.log(`User NOT found for email: ${email}`);
      }
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkProfiles();
