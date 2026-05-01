/**
 * ============================================================
 * BULK BOOKING CANCELLATION SCRIPT
 * Purpose: Cancel ALL test bookings created by bookAllMentors.js
 * Run: node scripts/cancelBulkBookings.js
 * ============================================================
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MentorBooking = require('../models/MentorBooking');
const User = require('../models/User');

const BOOKER_EMAIL = 'ujjwaljha744@gmail.com';
const REMARK_PATTERN = 'BULK TEST BOOKING';

async function main() {
  console.log('\n🗑️  Starting bulk booking CANCELLATION script...\n');

  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to MongoDB\n');

  const bookerUser = await User.findOne({ email: BOOKER_EMAIL });
  if (!bookerUser) {
    console.error(`❌ User not found: ${BOOKER_EMAIL}`);
    process.exit(1);
  }

  // Find all test bookings
  const testBookings = await MentorBooking.find({
    userId: bookerUser._id,
    remark: { $regex: REMARK_PATTERN },
    status: { $nin: ['cancelled'] },
  }).select('bookingId status scheduledAt mentorId');

  console.log(`📋 Found ${testBookings.length} test bookings to cancel\n`);

  if (testBookings.length === 0) {
    console.log('✅ Nothing to cancel.');
    await mongoose.disconnect();
    return;
  }

  // Cancel all
  const result = await MentorBooking.updateMany(
    {
      userId: bookerUser._id,
      remark: { $regex: REMARK_PATTERN },
      status: { $nin: ['cancelled'] },
    },
    {
      $set: {
        status: 'cancelled',
        cancellation: {
          cancelledBy: 'user',
          reason: 'Bulk test booking cancelled after verification.',
          cancelledAt: new Date(),
        },
      },
    }
  );

  console.log(`✅ Cancelled ${result.modifiedCount} test bookings successfully.`);
  console.log('\n');

  await mongoose.disconnect();
  console.log('✅ Done!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  mongoose.disconnect();
  process.exit(1);
});
