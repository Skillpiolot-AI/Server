// jobs/tempPasswordReminder.js
// Scheduled job to send reminders for users with temporary passwords

const cron = require('node-cron');
const User = require('../models/User');
const { sendEmailFast } = require('../config/mailHelper');
const { tempPasswordReminderEmail } = require('../config/emailTemplates');

/**
 * Send reminder emails to users with temporary passwords
 * Runs every day at 9:00 AM
 */
const sendTempPasswordReminders = async () => {
  try {
    console.log('\n📅 Running temporary password reminder job...');
    
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));
    const fourDaysAgo = new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000));
    const sixDaysAgo = new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000));
    
    // Find users with temporary passwords who haven't changed them
    const usersWithTempPassword = await User.find({
      temporaryPassword: true,
      mustChangePassword: true,
      isActive: true,
      $or: [
        { passwordLastChanged: { $lte: twoDaysAgo } },
        { passwordLastChanged: { $lte: fourDaysAgo } },
        { passwordLastChanged: { $lte: sixDaysAgo } }
      ]
    }).select('name email username createdAt passwordLastChanged');

    console.log(`Found ${usersWithTempPassword.length} users with temporary passwords`);

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const user of usersWithTempPassword) {
      try {
        // Calculate days since password was set
        const passwordDate = user.passwordLastChanged || user.createdAt;
        const daysSince = Math.floor((now - passwordDate) / (1000 * 60 * 60 * 24));
        
        // Only send on day 2, 4, 6, etc.
        if (daysSince % 2 === 0 && daysSince >= 2) {
          console.log(`Sending reminder to ${user.email} (${daysSince} days)`);
          
          await sendEmailFast(
            user.email,
            tempPasswordReminderEmail(user.name, daysSince)
          );
          
          emailsSent++;
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to send reminder to ${user.email}:`, error.message);
        emailsFailed++;
      }
    }

    console.log(`✅ Temporary password reminders complete: ${emailsSent} sent, ${emailsFailed} failed`);
    
    return {
      success: true,
      totalUsers: usersWithTempPassword.length,
      emailsSent,
      emailsFailed
    };
    
  } catch (error) {
    console.error('❌ Error in temporary password reminder job:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Schedule the job to run daily at 9:00 AM
 * Cron format: minute hour day month weekday
 * '0 9 * * *' = Every day at 9:00 AM
 */
const scheduleReminders = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('\n⏰ Scheduled job triggered: Temporary password reminders');
    await sendTempPasswordReminders();
  }, {
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('✅ Temporary password reminder scheduler initialized (runs daily at 9:00 AM)');
};

/**
 * Manual trigger for testing
 */
const runNow = async () => {
  console.log('\n🧪 Manual trigger: Running temporary password reminders now...');
  return await sendTempPasswordReminders();
};

module.exports = {
  scheduleReminders,
  runNow,
  sendTempPasswordReminders
};