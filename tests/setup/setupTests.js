// tests/setup/setupTests.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

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
