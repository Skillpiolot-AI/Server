module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
  ],

  // Coverage thresholds - lowered for initial CI pass
  // Increase these as you add more tests
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },

  // Test match patterns
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.js'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.js'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Module name mapper for mocking external services
  moduleNameMapper: {
    '^@/tests/mocks/mailHelper$': '<rootDir>/tests/mocks/mailHelper.mock.js',
    '^@/tests/mocks/cloudinary$': '<rootDir>/tests/mocks/cloudinary.mock.js',
    '^@/tests/mocks/googleAuth$': '<rootDir>/tests/mocks/googleAuth.mock.js',
    '^@/tests/mocks/pushNotifications$': '<rootDir>/tests/mocks/pushNotifications.mock.js',
  },

  // Transform ESM modules (uuid uses ESM)
  transformIgnorePatterns: ['/node_modules/(?!(uuid)/)'],

  // Transform files - use babel for ESM support
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Bail after n failures
  bail: 0,

  // Max workers
  maxWorkers: '50%',

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
};
