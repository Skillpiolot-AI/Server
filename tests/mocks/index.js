/**
 * Mock Module Index
 * Exports all mock services for use in tests
 */

module.exports = {
  mailHelper: require('./mailHelper.mock.js'),
  cloudinary: require('./cloudinary.mock.js'),
  googleAuth: require('./googleAuth.mock.js'),
  pushNotifications: require('./pushNotifications.mock.js'),
};
