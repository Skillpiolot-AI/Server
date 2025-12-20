// services/pushNotificationService.js - Expo Push Notification Service

const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a single user
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.log(`Invalid push token: ${pushToken}`);
    return { success: false, error: 'Invalid push token' };
  }

  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'announcements',
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log(`Push sent to ${pushToken}:`, ticket);
    return { success: true, ticket: ticket[0] };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications to multiple users
 * Returns stats object with sent/failed counts
 */
const sendBulkPushNotifications = async (users, title, body, data = {}) => {
  const messages = [];
  const validUsers = [];

  // Filter valid tokens and create messages
  for (const user of users) {
    if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
      messages.push({
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data: { ...data, userId: user._id?.toString() },
        priority: 'high',
        channelId: 'announcements',
      });
      validUsers.push(user);
    }
  }

  if (messages.length === 0) {
    console.log('No valid push tokens found');
    return { sent: 0, failed: 0, results: [] };
  }

  // Chunk messages (Expo has a limit of 100 per request)
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];
  const results = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending chunk:', error);
      // Add failed results for this chunk
      for (let i = 0; i < chunk.length; i++) {
        tickets.push({ status: 'error', message: error.message });
      }
    }
  }

  // Process results
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const user = validUsers[i];

    if (ticket.status === 'ok') {
      sent++;
      results.push({ userId: user._id, success: true, ticketId: ticket.id });
    } else {
      failed++;
      results.push({
        userId: user._id,
        success: false,
        error: ticket.message || ticket.details?.error,
      });

      // Handle invalid tokens
      if (ticket.details?.error === 'DeviceNotRegistered') {
        // Token is invalid, should be removed from user
        console.log(`Invalid token for user ${user._id}, should be removed`);
      }
    }
  }

  console.log(`Push notifications: ${sent} sent, ${failed} failed`);
  return { sent, failed, results };
};

/**
 * Send test notification to a specific token
 */
const sendTestNotification = async pushToken => {
  return sendPushNotification(
    pushToken,
    '🔔 Test Notification',
    'This is a test notification from SkillPilot Admin!',
    { type: 'test', timestamp: Date.now() }
  );
};

/**
 * Validate if a token is valid Expo push token
 */
const isValidPushToken = token => {
  return Expo.isExpoPushToken(token);
};

/**
 * Get push notification receipt (for checking delivery status later)
 */
const getReceipts = async ticketIds => {
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
  const receipts = [];

  for (const chunk of receiptIdChunks) {
    try {
      const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
      receipts.push(...Object.entries(receiptChunk));
    } catch (error) {
      console.error('Error getting receipts:', error);
    }
  }

  return receipts;
};

module.exports = {
  sendPushNotification,
  sendBulkPushNotifications,
  sendTestNotification,
  isValidPushToken,
  getReceipts,
};
