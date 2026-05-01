/**
 * ============================================================
 * BULK MENTOR BOOKING SCRIPT
 * Purpose: Book ALL available time slots for ALL mentors
 *          across the next 30 days (for testing purposes).
 * Run: node scripts/bookAllMentors.js
 * ============================================================
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ── Load models directly (bypass HTTP auth complexity) ──────────────────────
const MentorProfile = require('../models/MentorProfile');
const MentorBooking = require('../models/MentorBooking');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');

// ── Config ───────────────────────────────────────────────────────────────────
const BOOKER_EMAIL = 'ujjwaljha744@gmail.com';
const DAYS_AHEAD = 30; // book slots for the next 30 days
const HOUR_START = 9; // 9 AM
const HOUR_END = 21; // 9 PM
const LOG_FILE = path.join(__dirname, '../booking_notes.md');
const DELAY_MS = 50; // small delay between insertions to be safe

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateJitsiLink(bookingId) {
  const shortId = bookingId.replace('BK-', '').substring(0, 12);
  const roomName = `SkillPilot${shortId}`;
  const configParams = [
    'config.prejoinConfig.enabled=false',
    'config.startWithAudioMuted=true',
    'config.startWithVideoMuted=false',
  ].join('&');
  return `https://meet.jit.si/${roomName}#${configParams}`;
}

function formatDate(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getDatesAhead(days) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function padLog(lines) {
  return lines.map(l => `  ${l}`).join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = new Date();
  console.log('\n🚀 Starting bulk mentor booking script...\n');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to MongoDB\n');

  // Find the booker user
  const bookerUser = await User.findOne({ email: BOOKER_EMAIL });
  if (!bookerUser) {
    console.error(`❌ User not found: ${BOOKER_EMAIL}`);
    process.exit(1);
  }
  console.log(`✅ Booker user found: ${bookerUser.name} (${bookerUser._id})\n`);

  // Get system settings for auto-confirm
  const settings = await SystemSettings.getSettings();
  const autoConfirm = settings?.bookingSettings?.autoConfirmBookings ?? true;

  // Get all VISIBLE mentor profiles
  const mentors = await MentorProfile.find({ isVisible: true }).populate(
    'userId',
    'name email _id'
  );

  console.log(`📋 Found ${mentors.length} visible mentor profiles\n`);

  // Generate dates
  const dates = getDatesAhead(DAYS_AHEAD);
  const hours = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h);

  // ── Tracking ────────────────────────────────────────────────────────────────
  const results = [];
  let totalBooked = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // ── Loop over every mentor ──────────────────────────────────────────────────
  for (const mentor of mentors) {
    // Skip self-booking if the booker IS the mentor
    if (mentor.userId._id.toString() === bookerUser._id.toString()) {
      console.log(`⚠️  Skipping self-booking for ${mentor.displayName}`);
      results.push({
        mentor: mentor.displayName,
        mentorEmail: mentor.userId.email,
        status: 'SKIPPED_SELF',
        booked: 0,
        skipped: 0,
        errors: [],
        slots: [],
      });
      continue;
    }

    const mentorEntry = {
      mentor: mentor.displayName,
      mentorId: mentor._id.toString(),
      mentorUserId: mentor.userId._id.toString(),
      mentorEmail: mentor.userId.email,
      booked: 0,
      skipped: 0,
      errors: [],
      slots: [],
    };

    console.log(`\n🧑 Processing mentor: ${mentor.displayName} (${mentor.userId.email})`);

    for (const date of dates) {
      const dateStr = formatDate(date);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

      // Check if this date is a busy date
      const isBusy = (mentor.busyDates || []).some(b => {
        const bd = new Date(b.date);
        return formatDate(bd) === dateStr;
      });
      if (isBusy) {
        mentorEntry.skipped += hours.length;
        totalSkipped += hours.length;
        continue;
      }

      // Check weekly availability
      const dayAvail = (mentor.availabilitySlots || []).find(
        s => s.day === dayOfWeek && s.isAvailable
      );
      // If mentor has slots defined but none for this day, skip
      if (!dayAvail && mentor.availabilitySlots && mentor.availabilitySlots.length > 0) {
        mentorEntry.skipped += hours.length;
        totalSkipped += hours.length;
        continue;
      }

      // Determine valid hours for this day
      let validHours = hours;
      if (dayAvail) {
        const startH = parseInt(dayAvail.startTime.split(':')[0]);
        const endH = parseInt(dayAvail.endTime.split(':')[0]);
        validHours = hours.filter(h => h >= startH && h < endH);
      }

      for (const hour of validHours) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const scheduledAt = new Date(`${dateStr}T${timeStr}:00`);

        try {
          // Check for existing booking conflict
          const duration = mentor.sessionDuration || 60;
          const existing = await MentorBooking.checkConflict(
            mentor.userId._id,
            scheduledAt,
            duration
          );

          if (existing) {
            mentorEntry.skipped++;
            totalSkipped++;
            continue;
          }

          // Create the booking directly via model
          const booking = new MentorBooking({
            userId: bookerUser._id,
            mentorId: mentor.userId._id,
            mentorProfileId: mentor._id,
            scheduledAt,
            duration,
            remark:
              '[BULK TEST BOOKING] - Booked by admin for testing. Will be cancelled after verification.',
            topics: ['Testing slot availability'],
            isFree: true,
            originalPrice: 0,
            paidAmount: 0,
            status: autoConfirm ? 'confirmed' : 'pending',
          });

          booking.meetingLink = generateJitsiLink(booking.bookingId);
          booking.meetingLinkSentAt = new Date();

          await booking.save();
          await sleep(DELAY_MS);

          mentorEntry.slots.push({
            date: dateStr,
            time: timeStr,
            bookingId: booking.bookingId,
            status: booking.status,
          });
          mentorEntry.booked++;
          totalBooked++;

          process.stdout.write(`  ✅ Booked ${dateStr} ${timeStr} → ${booking.bookingId}\n`);
        } catch (err) {
          const errMsg = `${dateStr} ${timeStr}: ${err.message}`;
          mentorEntry.errors.push(errMsg);
          totalErrors++;
          process.stdout.write(`  ❌ Error ${dateStr} ${timeStr}: ${err.message}\n`);
        }
      }
    }

    results.push(mentorEntry);
    console.log(
      `  📊 ${mentor.displayName}: booked=${mentorEntry.booked}, skipped=${mentorEntry.skipped}, errors=${mentorEntry.errors.length}`
    );
  }

  // ── Write Notes / Log File ──────────────────────────────────────────────────
  const endTime = new Date();
  const durationSec = ((endTime - startTime) / 1000).toFixed(1);

  const lines = [
    '# 📅 Bulk Mentor Booking Notes',
    '',
    `**Generated:** ${endTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
    `**Booker Account:** ${bookerUser.name} (${BOOKER_EMAIL})`,
    `**Booker User ID:** ${bookerUser._id}`,
    `**Script Duration:** ${durationSec}s`,
    `**Date Range:** ${formatDate(dates[0])} → ${formatDate(dates[dates.length - 1])} (${DAYS_AHEAD} days)`,
    `**Time Range:** ${HOUR_START}:00 - ${HOUR_END}:00`,
    '',
    '---',
    '',
    '## 📊 Summary',
    '',
    '| Metric | Count |',
    '|--------|-------|',
    `| Mentors Processed | ${mentors.length} |`,
    `| ✅ Total Bookings Created | ${totalBooked} |`,
    `| ⏭️  Total Slots Skipped (already booked/unavailable) | ${totalSkipped} |`,
    `| ❌ Total Errors | ${totalErrors} |`,
    '',
    '---',
    '',
    '## 🧑 Per-Mentor Details',
    '',
  ];

  for (const r of results) {
    lines.push(`### ${r.mentor}`);
    lines.push(`- **Email:** ${r.mentorEmail}`);
    lines.push(`- **Mentor Profile ID:** ${r.mentorId || 'N/A'}`);
    if (r.status === 'SKIPPED_SELF') {
      lines.push('- **Status:** ⚠️ Skipped (self-booking not allowed)');
    } else {
      lines.push(`- **Bookings Created:** ${r.booked}`);
      lines.push(`- **Slots Skipped:** ${r.skipped}`);
      lines.push(`- **Errors:** ${r.errors.length}`);

      if (r.errors.length > 0) {
        lines.push('- **Error Details:**');
        r.errors.forEach(e => lines.push(`  - ${e}`));
      }

      if (r.slots.length > 0) {
        lines.push('- **Booked Slots (first 10 shown):**');
        r.slots
          .slice(0, 10)
          .forEach(s => lines.push(`  - ${s.date} ${s.time} → \`${s.bookingId}\` (${s.status})`));
        if (r.slots.length > 10) {
          lines.push(`  - ... and ${r.slots.length - 10} more`);
        }
      }
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## ⚠️ Cancellation Instructions');
  lines.push('');
  lines.push('After verification, run the following to cancel all test bookings:');
  lines.push('');
  lines.push('```js');
  lines.push('// In Node.js / Mongo shell:');
  lines.push(`// Cancel all bookings made by ${BOOKER_EMAIL}`);
  lines.push('db.mentorbookings.updateMany(');
  lines.push(`  { userId: ObjectId("${bookerUser._id}"), remark: /BULK TEST BOOKING/ },`);
  lines.push('  { $set: { status: "cancelled" } }');
  lines.push(')');
  lines.push('```');
  lines.push('');
  lines.push('Or run: `node scripts/cancelBulkBookings.js`');
  lines.push('');

  fs.writeFileSync(LOG_FILE, lines.join('\n'), 'utf-8');

  // ── Final Console Summary ───────────────────────────────────────────────────
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  BULK BOOKING COMPLETE');
  console.log('═'.repeat(60));
  console.log(`  ✅ Total Bookings Created : ${totalBooked}`);
  console.log(`  ⏭️  Total Slots Skipped    : ${totalSkipped}`);
  console.log(`  ❌ Total Errors           : ${totalErrors}`);
  console.log(`  ⏱️  Duration               : ${durationSec}s`);
  console.log(`  📄 Notes saved to         : ${LOG_FILE}`);
  console.log('═'.repeat(60));
  console.log('\n');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB. Done!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  mongoose.disconnect();
  process.exit(1);
});
