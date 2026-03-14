// tests/setup/setupTests.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');

// ============================================================================
// MOCK EXTERNAL SERVICES - Must be done BEFORE any imports from app code
// ============================================================================

// Mock email service
jest.mock('../../config/mailHelper', () => require('../mocks/mailHelper.mock.js'));

// Mock cloudinary service
jest.mock('../../config/cloudinary', () => require('../mocks/cloudinary.mock.js'));

// Mock google auth service
jest.mock('../../config/googleAuth', () => require('../mocks/googleAuth.mock.js'));

// Mock push notification service
jest.mock('../../services/pushNotificationService', () =>
  require('../mocks/pushNotifications.mock.js')
);

// Mock nodemailer (email transporter)
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    verify: jest.fn(async () => true),
    sendMail: jest.fn(async options => ({
      messageId: 'mock-email-' + Date.now(),
      response: '250 Message accepted',
    })),
  })),
}));

// ============================================================================
// END MOCKS
// ============================================================================

let mongoServer;

// Global setup before all tests
beforeAll(async () => {
  try {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Test database connected');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

// Global teardown after all tests
afterAll(async () => {
  try {
    // Disconnect from database
    await mongoose.disconnect();

    // Stop in-memory MongoDB
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test database disconnected');
  } catch (error) {
    console.error('❌ Test teardown failed:', error);
  }
});

// Clear all collections before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-key';
process.env.CLOUDINARY_API_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';

// Increase timeout for all tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error and assert for debugging
  error: console.error,
  assert: console.assert,
};

// ============================================================================
// GLOBAL TEST UTILITIES - Access via global.testUtils
// ============================================================================

const mailHelperMock = require('../mocks/mailHelper.mock.js');
const cloudinaryMock = require('../mocks/cloudinary.mock.js');
const googleAuthMock = require('../mocks/googleAuth.mock.js');
const pushNotificationsMock = require('../mocks/pushNotifications.mock.js');

global.testUtils = {
  // Email helpers
  clearEmails: () => mailHelperMock.clearAllEmails(),
  getEmails: () => mailHelperMock.getAllEmails(),
  getLastEmailTo: recipient => mailHelperMock.getLastEmailTo(recipient),
  getEmailsByRecipient: recipient => mailHelperMock.getEmailsByRecipient(recipient),
  getEmailsByTemplate: template => mailHelperMock.getEmailsByTemplate(template),
  wasEmailSentTo: (recipient, template) => mailHelperMock.wasEmailSentTo(recipient, template),
  getEmailCount: () => mailHelperMock.getEmailCount(),

  // Cloudinary helpers
  clearCloudinaryUploads: () => cloudinaryMock.clearAllCalls(),
  getUploadCalls: () => cloudinaryMock.getUploadCalls(),
  getUploadCount: () => cloudinaryMock.getUploadCount(),
  getDeleteCalls: () => cloudinaryMock.getDeleteCalls(),
  getDeleteCount: () => cloudinaryMock.getDeleteCount(),

  // Google Auth helpers
  clearGoogleAuthCalls: () => googleAuthMock.clearAllCalls(),
  getVerifyCalls: () => googleAuthMock.getVerifyCalls(),
  getTokenCalls: () => googleAuthMock.getTokenCalls(),

  // Push Notifications helpers
  clearNotifications: () => pushNotificationsMock.clearAllCalls(),
  getSendCalls: () => pushNotificationsMock.getSendCalls(),
  getSubscribeCalls: () => pushNotificationsMock.getSubscribeCalls(),
  getTotalNotificationsSent: () => pushNotificationsMock.getTotalNotificationsSent(),

  // Master clear for all mocks
  clearAllMocks: () => {
    mailHelperMock.clearAllEmails();
    cloudinaryMock.clearAllCalls();
    googleAuthMock.clearAllCalls();
    pushNotificationsMock.clearAllCalls();
  },
};

// ============================================================================
// END TEST UTILITIES
// ============================================================================
