/**
 * Mock Email Service
 * Replaces config/mailHelper.js for testing
 * Tracks all email calls without sending real SMTP messages
 */

// Store all email calls for assertions
const emailCalls = [];

/**
 * Mock sendMail function
 * Tracks email calls instead of sending via SMTP
 */
const sendMail = jest.fn(async (emailOptions) => {
  const timestamp = new Date().toISOString();
  const callRecord = {
    to: emailOptions.to,
    template: emailOptions.template || emailOptions.subject,
    subject: emailOptions.subject,
    variables: emailOptions.variables || emailOptions.data,
    htmlContent: emailOptions.html,
    textContent: emailOptions.text,
    timestamp,
  };
  
  emailCalls.push(callRecord);
  
  // Return success response
  return {
    success: true,
    messageId: `mock-message-${emailCalls.length}`,
    timestamp,
  };
});

/**
 * Mock sendEmailFast function (alias for sendMail)
 */
const sendEmailFast = jest.fn(sendMail);

/**
 * Helper: Get all emails sent to a specific recipient
 */
const getEmailsByRecipient = (recipient) => {
  return emailCalls.filter(call => call.to === recipient);
};

/**
 * Helper: Get the most recent email to a specific recipient
 */
const getLastEmailTo = (recipient) => {
  const emails = getEmailsByRecipient(recipient);
  return emails.length > 0 ? emails[emails.length - 1] : null;
};

/**
 * Helper: Get a specific email by template name
 */
const getEmailsByTemplate = (template) => {
  return emailCalls.filter(call => call.template === template || call.subject === template);
};

/**
 * Helper: Check if email was sent with specific template to recipient
 */
const wasEmailSentTo = (recipient, template = null) => {
  const emails = getEmailsByRecipient(recipient);
  if (!template) return emails.length > 0;
  return emails.some(call => call.template === template || call.subject === template);
};

/**
 * Helper: Get all emails sent
 */
const getAllEmails = () => emailCalls;

/**
 * Helper: Clear all email history (useful for test cleanup)
 */
const clearAllEmails = () => {
  emailCalls.length = 0;
  jest.clearAllMocks();
};

/**
 * Helper: Get email count
 */
const getEmailCount = () => emailCalls.length;

/**
 * Mock transporter object
 */
const transporter = {
  verify: jest.fn(async () => true),
  sendMail: sendMail,
};

/**
 * Export mocked module
 */
module.exports = {
  sendMail,
  sendEmailFast,
  transporter,
  // Test helpers
  getEmailsByRecipient,
  getLastEmailTo,
  getEmailsByTemplate,
  wasEmailSentTo,
  getAllEmails,
  clearAllEmails,
  getEmailCount,
};
