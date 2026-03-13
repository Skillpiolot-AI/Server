/**
 * Mock Push Notification Service
 * Replaces services/pushNotificationService.js for testing
 * Handles push notifications without real Expo server calls
 */

const sendCalls = [];
const subscribeCalls = [];

/**
 * Mock Expo SDK
 */
const Expo = jest.fn(function() {
  this.isExpoPushToken = jest.fn((token) => {
    return typeof token === 'string' && token.startsWith('ExponentPushToken[');
  });

  this.sendPushNotificationsAsync = jest.fn(async (messages) => {
    const sendRecord = {
      messages: Array.isArray(messages) ? messages : [messages],
      timestamp: new Date().toISOString(),
      count: Array.isArray(messages) ? messages.length : 1,
    };
    sendCalls.push(sendRecord);

    // Return mock response for each message
    const responses = (Array.isArray(messages) ? messages : [messages]).map((msg, index) => ({
      id: `mock-notification-${sendCalls.length}-${index}`,
      status: 'ok',
    }));

    return responses;
  });

  this.sendSNSMessageAsync = jest.fn(async (message) => {
    return {
      id: 'mock-sns-' + Date.now(),
      status: 'ok',
    };
  });

  return this;
});

/**
 * Mock Expo Push Ticket
 */
const ExpoPushTicket = jest.fn(function(data) {
  this.id = data.id || 'mock-ticket-' + Date.now();
  this.status = data.status || 'ok';
  this.receiptId = data.receiptId || 'mock-receipt-' + Date.now();
});

/**
 * Mock subscribe to topic
 */
const subscribeToTopic = jest.fn(async (deviceTokens, topic) => {
  const subscribeRecord = {
    deviceTokens: Array.isArray(deviceTokens) ? deviceTokens : [deviceTokens],
    topic,
    timestamp: new Date().toISOString(),
  };
  subscribeCalls.push(subscribeRecord);

  return {
    success: true,
    subscribed: Array.isArray(deviceTokens) ? deviceTokens.length : 1,
  };
});

/**
 * Mock unsubscribe from topic
 */
const unsubscribeFromTopic = jest.fn(async (deviceTokens, topic) => {
  return {
    success: true,
    unsubscribed: Array.isArray(deviceTokens) ? deviceTokens.length : 1,
  };
});

/**
 * Helper: Get all push notification sends
 */
const getSendCalls = () => sendCalls;

/**
 * Helper: Get all subscription calls
 */
const getSubscribeCalls = () => subscribeCalls;

/**
 * Helper: Clear all call records
 */
const clearAllCalls = () => {
  sendCalls.length = 0;
  subscribeCalls.length = 0;
  jest.clearAllMocks();
};

/**
 * Helper: Get send call count
 */
const getSendCount = () => sendCalls.length;

/**
 * Helper: Get subscribe call count
 */
const getSubscribeCount = () => subscribeCalls.length;

/**
 * Helper: Get total notifications sent
 */
const getTotalNotificationsSent = () => {
  return sendCalls.reduce((total, call) => total + call.count, 0);
};

/**
 * Export mocked push notification module
 */
module.exports = {
  Expo,
  ExpoPushTicket,
  subscribeToTopic,
  unsubscribeFromTopic,
  // Test helpers
  getSendCalls,
  getSubscribeCalls,
  clearAllCalls,
  getSendCount,
  getSubscribeCount,
  getTotalNotificationsSent,
};
