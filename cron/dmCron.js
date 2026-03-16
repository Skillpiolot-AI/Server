// cron/dmCron.js
// Auto-expire Priority DM threads that have passed their expiresAt or responseDeadline

const PriorityDM = require('../models/PriorityDM');

/**
 * Runs periodically to:
 * 1. Expire active threads past their expiresAt time
 * 2. Expire open threads past their responseDeadline (mentor never replied)
 */
async function expireThreads() {
  const now = new Date();

  try {
    // 1. Active threads past expiresAt
    const expiredActive = await PriorityDM.updateMany(
      {
        status: 'active',
        expiresAt: { $ne: null, $lt: now },
      },
      {
        $set: { status: 'expired', closedAt: now },
      }
    );

    // 2. Open threads past responseDeadline (mentor never replied)
    const expiredOpen = await PriorityDM.updateMany(
      {
        status: 'open',
        responseDeadline: { $ne: null, $lt: now },
      },
      {
        $set: { status: 'expired', closedAt: now },
      }
    );

    const totalExpired = (expiredActive.modifiedCount || 0) + (expiredOpen.modifiedCount || 0);
    if (totalExpired > 0) {
      console.log(
        `🕐 DM Cron: Expired ${totalExpired} threads (${expiredActive.modifiedCount} active, ${expiredOpen.modifiedCount} open)`
      );
    }
  } catch (error) {
    console.error('DM Cron error:', error.message);
  }
}

/**
 * Start the cron — runs every 5 minutes
 */
function startDMCron() {
  console.log('⏰ DM auto-expire cron started (every 5 minutes)');
  setInterval(expireThreads, 5 * 60 * 1000); // every 5 minutes
  // Also run once on startup
  expireThreads();
}

module.exports = { startDMCron, expireThreads };
