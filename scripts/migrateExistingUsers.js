// scripts/migrateExistingUsers.js
// Run this script ONCE to migrate existing users to verified status

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const { sendEmailFast, verificationEmailTemplate } = require('../config/mailHelper');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log('URI:', MONGO_URI.substring(0, 20) + '...');
    
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully\n');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Option 1: Auto-verify all existing users (RECOMMENDED FOR EXISTING USERS)
const autoVerifyExistingUsers = async () => {
  try {
    console.log('\n🔄 Starting auto-verification of existing users...\n');

    // Find all users who are not verified
    const unverifiedUsers = await User.find({
      $or: [
        { isVerified: { $exists: false } },
        { isVerified: false }
      ]
    });

    console.log(`📊 Found ${unverifiedUsers.length} unverified users\n`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ No users to verify. All users are already verified!\n');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of unverifiedUsers) {
      try {
        // Auto-verify existing users
        user.isVerified = true;
        
        // Ensure account is active
        if (!user.isActive) {
          user.isActive = true;
        }

        await user.save();
        
        console.log(`✅ Auto-verified: ${user.email} (${user.username})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to verify ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Migration Complete:`);
    console.log(`   ✅ Successfully verified: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
};

// Option 2: Send verification emails to existing users
const sendVerificationToExistingUsers = async () => {
  try {
    console.log('\n📧 Sending verification emails to existing unverified users...\n');

    const unverifiedUsers = await User.find({
      $or: [
        { isVerified: { $exists: false } },
        { isVerified: false }
      ]
    });

    console.log(`📊 Found ${unverifiedUsers.length} users requiring verification\n`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ No users to verify. All users are already verified!\n');
      return;
    }

    let emailsSent = 0;
    let errors = 0;

    for (const user of unverifiedUsers) {
      try {
        // Delete any existing verification tokens for this user
        await EmailVerification.deleteMany({ userId: user._id });

        // Create new verification token
        const verification = await EmailVerification.createVerificationToken(
          user._id,
          user.email,
          '127.0.0.1',
          'Migration Script'
        );

        const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

        // Send verification email
        await sendEmailFast(
          user.email,
          verificationEmailTemplate(user.name, verificationLink, user.username)
        );

        console.log(`✅ Email sent to: ${user.email}`);
        emailsSent++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Email Campaign Complete:`);
    console.log(`   ✅ Emails sent: ${emailsSent}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Email campaign error:', error);
  }
};

// Option 3: Manual verification for specific users
const verifySpecificUsers = async (emailsOrUsernames) => {
  try {
    console.log('\n🔍 Verifying specific users...\n');

    if (!emailsOrUsernames || emailsOrUsernames.length === 0) {
      console.log('⚠️  No users specified for verification');
      return;
    }

    for (const identifier of emailsOrUsernames) {
      try {
        const user = await User.findOne({
          $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
          ]
        });

        if (!user) {
          console.log(`⚠️  User not found: ${identifier}`);
          continue;
        }

        user.isVerified = true;
        user.isActive = true;
        await user.save();

        console.log(`✅ Verified: ${user.email} (${user.username})`);
      } catch (error) {
        console.error(`❌ Error verifying ${identifier}:`, error.message);
      }
    }

    console.log('\n✅ Specific user verification complete\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Option 4: Check verification status
const checkVerificationStatus = async () => {
  try {
    console.log('\n📊 Checking Verification Status...\n');

    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({
      $or: [
        { isVerified: { $exists: false } },
        { isVerified: false }
      ]
    });

    console.log('='.repeat(50));
    console.log(`Total Users: ${totalUsers}`);
    console.log(`✅ Verified: ${verifiedUsers}`);
    console.log(`❌ Unverified: ${unverifiedUsers}`);
    console.log('='.repeat(50) + '\n');

    if (unverifiedUsers > 0) {
      console.log('Unverified users:');
      const unverified = await User.find({
        $or: [
          { isVerified: { $exists: false } },
          { isVerified: false }
        ]
      }).select('username email createdAt');

      unverified.forEach(user => {
        console.log(`  - ${user.email} (${user.username}) - Created: ${user.createdAt.toLocaleDateString()}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
};

// Main execution
const run = async () => {
  await connectDB();

  console.log('\n' + '='.repeat(50));
  console.log('📧 EMAIL VERIFICATION MIGRATION TOOL');
  console.log('='.repeat(50) + '\n');

  // Get command line argument
  const mode = process.argv[2] || 'status';

  switch (mode) {
    case 'auto':
      console.log('🔧 Mode: AUTO-VERIFY (Recommended for existing users)\n');
      await autoVerifyExistingUsers();
      break;

    case 'email':
      console.log('🔧 Mode: SEND VERIFICATION EMAILS\n');
      await sendVerificationToExistingUsers();
      break;

    case 'manual':
      console.log('🔧 Mode: MANUAL VERIFICATION\n');
      // Add specific emails/usernames here
      const usersToVerify = process.argv.slice(3);
      
      if (usersToVerify.length === 0) {
        console.log('⚠️  Usage: node migrateExistingUsers.js manual email1@example.com username1 email2@example.com');
        console.log('⚠️  No users specified. Exiting...\n');
      } else {
        await verifySpecificUsers(usersToVerify);
      }
      break;

    case 'status':
      console.log('🔧 Mode: CHECK STATUS\n');
      await checkVerificationStatus();
      break;

    default:
      console.log('❌ Unknown mode. Available modes:');
      console.log('  - auto    : Auto-verify all unverified users');
      console.log('  - email   : Send verification emails to unverified users');
      console.log('  - manual  : Manually verify specific users (provide emails/usernames)');
      console.log('  - status  : Check verification status (default)\n');
      console.log('Usage examples:');
      console.log('  node migrateExistingUsers.js auto');
      console.log('  node migrateExistingUsers.js email');
      console.log('  node migrateExistingUsers.js manual user1@example.com username2');
      console.log('  node migrateExistingUsers.js status\n');
  }

  console.log('✅ Migration script completed');
  console.log('🔒 You can now close this window\n');
  
  await mongoose.connection.close();
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
run().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});