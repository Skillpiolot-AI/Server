// Delete user script - Run with: node deleteUser.js
// This script permanently deletes a user and all their related data

const mongoose = require('mongoose');
require('dotenv').config();

const deleteUserCompletely = async () => {
  const EMAIL_TO_DELETE = 'helloworld8919@gmail.com';

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    // Import all models that might have user data
    const User = require('./models/User');
    const MentorProfile = require('./models/MentorProfile');
    const MentorBooking = require('./models/MentorBooking');
    const Application = require('./models/Application');
    const Assessment = require('./models/Assessment');
    const Profile = require('./models/Profile');
    const Post = require('./models/Post');
    const OTP = require('./models/OTP');
    const EmailVerification = require('./models/EmailVerification');
    const LoginVerification = require('./models/LoginVerification');
    const UserActivity = require('./models/UserActivity');

    console.log(`\n🔍 Looking for user: ${EMAIL_TO_DELETE}\n`);

    // Find the user first
    const user = await User.findOne({ email: EMAIL_TO_DELETE.toLowerCase() });

    if (!user) {
      console.log('❌ User not found in database!');
      await mongoose.disconnect();
      return;
    }

    const userId = user._id;
    console.log(`📌 Found user: ${user.name || user.username} (ID: ${userId})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt || 'Unknown'}`);
    console.log('\n🗑️ Deleting related data...\n');

    // Delete from all related collections
    const deletions = await Promise.all([
      // Delete user's mentor profile
      MentorProfile.deleteMany({ userId }).then(r => ({
        collection: 'MentorProfile',
        deleted: r.deletedCount,
      })),

      // Delete user's bookings (as mentor or as user)
      MentorBooking.deleteMany({ $or: [{ userId }, { mentorId: userId }] }).then(r => ({
        collection: 'MentorBooking',
        deleted: r.deletedCount,
      })),

      // Delete user's mentor applications
      Application.deleteMany({ email: EMAIL_TO_DELETE.toLowerCase() }).then(r => ({
        collection: 'Application',
        deleted: r.deletedCount,
      })),

      // Delete user's assessments
      Assessment.deleteMany({ userId }).then(r => ({
        collection: 'Assessment',
        deleted: r.deletedCount,
      })),

      // Delete user's profile
      Profile.deleteMany({ userId }).then(r => ({
        collection: 'Profile',
        deleted: r.deletedCount,
      })),

      // Delete user's posts
      Post.deleteMany({ userId }).then(r => ({ collection: 'Post', deleted: r.deletedCount })),

      // Delete OTPs
      OTP.deleteMany({ email: EMAIL_TO_DELETE.toLowerCase() }).then(r => ({
        collection: 'OTP',
        deleted: r.deletedCount,
      })),

      // Delete email verifications
      EmailVerification.deleteMany({ email: EMAIL_TO_DELETE.toLowerCase() }).then(r => ({
        collection: 'EmailVerification',
        deleted: r.deletedCount,
      })),

      // Delete login verifications
      LoginVerification.deleteMany({ email: EMAIL_TO_DELETE.toLowerCase() }).then(r => ({
        collection: 'LoginVerification',
        deleted: r.deletedCount,
      })),

      // Delete user activity
      UserActivity.deleteMany({ userId }).then(r => ({
        collection: 'UserActivity',
        deleted: r.deletedCount,
      })),
    ]);

    // Log deletion results
    deletions.forEach(d => {
      if (d.deleted > 0) {
        console.log(`   ✅ ${d.collection}: ${d.deleted} document(s) deleted`);
      } else {
        console.log(`   ⚪ ${d.collection}: No documents found`);
      }
    });

    // Finally delete the user
    await User.deleteOne({ _id: userId });
    console.log('\n✅ User account deleted successfully!');

    // Summary
    const totalDeleted = deletions.reduce((sum, d) => sum + d.deleted, 0) + 1; // +1 for user
    console.log(
      `\n📊 SUMMARY: Permanently deleted ${totalDeleted} document(s) for ${EMAIL_TO_DELETE}`
    );

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

deleteUserCompletely();
