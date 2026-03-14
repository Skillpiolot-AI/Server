/**
 * Test Helper Utilities
 * Provides common functions for testing (JWT, auth, assertions, etc.)
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';

/**
 * Generate JWT token for a user
 * @param {string|Object} userIdOrUser - User ID or user object
 * @param {string} role - User role (Admin, User, Mentor, UniAdmin, UniTeach, Student)
 * @returns {string} JWT token
 */
const generateToken = (userIdOrUser, role = 'User') => {
  let userId = userIdOrUser;

  if (typeof userIdOrUser === 'object' && userIdOrUser._id) {
    userId = userIdOrUser._id;
  }

  const payload = {
    userId: userId.toString(),
    role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Create an authenticated request with JWT in Authorization header
 * @param {Object} request - Supertest request object
 * @param {string|Object} userIdOrUser - User ID or object
 * @param {string} role - User role
 * @returns {Object} Request with auth header
 */
const addAuthToken = (request, userIdOrUser, role = 'User') => {
  const token = generateToken(userIdOrUser, role);
  return request.set('Authorization', `Bearer ${token}`);
};

/**
 * Decode JWT token (for verification in tests)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = token => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Clean all database collections
 * @returns {Promise<void>}
 */
const cleanDatabase = async () => {
  if (!mongoose.connection.collections) return;

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Clean specific collection
 * @param {string} modelName - Model name
 * @returns {Promise<void>}
 */
const cleanCollection = async modelName => {
  try {
    const model = mongoose.model(modelName);
    await model.deleteMany({});
  } catch (error) {
    // Silently fail if model doesn't exist
  }
};

/**
 * Assert email was sent with specific template
 * @param {string} recipient - Email recipient
 * @param {string} template - Template name
 */
const expectEmailSent = (recipient, template = null) => {
  if (!template) {
    expect(global.testUtils.getEmailsByRecipient(recipient).length).toBeGreaterThan(0);
    return;
  }

  const sent = global.testUtils.wasEmailSentTo(recipient, template);
  expect(sent).toBe(true);
};

/**
 * Assert email was NOT sent
 * @param {string} recipient - Email recipient (optional)
 */
const expectNoEmailSent = (recipient = null) => {
  if (recipient) {
    const emails = global.testUtils.getEmailsByRecipient(recipient);
    expect(emails.length).toBe(0);
  } else {
    expect(global.testUtils.getEmailCount()).toBe(0);
  }
};

/**
 * Get mock user with token
 * Useful for test setup
 * @param {string} role - User role
 * @param {Object} userDoc - Additional user doc (from database)
 * @returns {Object} { token, userId, role, user }
 */
const getMockUserWithToken = (role = 'User', userDoc = null) => {
  const userId = userDoc?._id || new mongoose.Types.ObjectId();
  const token = generateToken(userId, role);

  return {
    token,
    userId,
    role,
    user: userDoc || { _id: userId, role },
  };
};

/**
 * Create test user in database
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user document
 */
const createTestUser = async (userData = {}) => {
  const User = mongoose.model('User');

  const defaultData = {
    email: `test-${Date.now()}@test.com`,
    password: 'hashed-password',
    role: 'User',
    isActive: true,
    isVerified: true,
    ...userData,
  };

  return await User.create(defaultData);
};

/**
 * Create test mentor in database
 * @param {Object} mentorData - Mentor data
 * @returns {Promise<Object>} Created mentor user
 */
const createTestMentor = async (mentorData = {}) => {
  return await createTestUser({
    role: 'Mentor',
    mentorStatus: 'approved',
    ...mentorData,
  });
};

/**
 * Create test student in database
 * @param {string} universityId - University ID
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} Created student user
 */
const createTestStudent = async (universityId, studentData = {}) => {
  return await createTestUser({
    role: 'Student',
    universityId,
    ...studentData,
  });
};

/**
 * Create test university admin
 * @param {string} universityId - University ID
 * @param {Object} adminData - Admin data
 * @returns {Promise<Object>} Created university admin user
 */
const createTestUniAdmin = async (universityId, adminData = {}) => {
  return await createTestUser({
    role: 'UniAdmin',
    universityId,
    ...adminData,
  });
};

/**
 * Wait for promise to complete (useful for async operations)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const wait = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Compare two objects (for API response validation)
 * @param {Object} received - Actual response
 * @param {Object} expected - Expected response
 * @param {Array<string>} ignoreFields - Fields to ignore in comparison
 */
const compareObjects = (
  received,
  expected,
  ignoreFields = ['_id', '__v', 'createdAt', 'updatedAt']
) => {
  const receivedCopy = { ...received };
  const expectedCopy = { ...expected };

  ignoreFields.forEach(field => {
    delete receivedCopy[field];
    delete expectedCopy[field];
  });

  return expect(receivedCopy).toEqual(expect.objectContaining(expectedCopy));
};

/**
 * Assert HTTP response status
 * @param {Object} response - HTTP response
 * @param {number} expectedStatus - Expected status code
 */
const expectStatus = (response, expectedStatus) => {
  expect(response.status).toBe(expectedStatus);
};

/**
 * Assert response error message
 * @param {Object} response - HTTP response
 * @param {string} expectedMessage - Expected error message
 */
const expectErrorMessage = (response, expectedMessage) => {
  expect(response.body.message || response.body.error).toContain(expectedMessage);
};

/**
 * Assert successful response with data
 * @param {Object} response - HTTP response
 * @param {Array<string>} requiredFields - Fields that must be present
 */
const expectSuccessResponse = (response, requiredFields = []) => {
  expect(response.status).toBeLessThan(400);

  if (requiredFields.length > 0) {
    requiredFields.forEach(field => {
      expect(response.body[field]).toBeDefined();
    });
  }
};

/**
 * Get all uploads made during test
 * @returns {Array} Upload calls
 */
const getUploadCalls = () => global.testUtils.getUploadCalls();

/**
 * Clear all test data (emails, uploads, etc.)
 */
const clearAllTestData = () => {
  global.testUtils.clearAllMocks();
};

/**
 * Export test utilities
 */
module.exports = {
  // JWT & Auth
  generateToken,
  addAuthToken,
  decodeToken,
  getMockUserWithToken,

  // Database
  cleanDatabase,
  cleanCollection,
  createTestUser,
  createTestMentor,
  createTestStudent,
  createTestUniAdmin,

  // Email assertions
  expectEmailSent,
  expectNoEmailSent,

  // HTTP response assertions
  expectStatus,
  expectErrorMessage,
  expectSuccessResponse,
  compareObjects,

  // File uploads
  getUploadCalls,

  // Utilities
  wait,
  clearAllTestData,
};
