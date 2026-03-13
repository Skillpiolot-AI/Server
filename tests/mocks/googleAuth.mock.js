/**
 * Mock Google OAuth Service
 * Replaces config/googleAuth.js for testing
 * Handles OAuth without real Google API calls
 */

const verifyCalls = [];
const tokenCalls = [];

/**
 * Mock google auth library
 */
const google = {
  auth: {
    OAuth2: jest.fn(function(clientId, clientSecret, redirectUrl) {
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.redirectUrl = redirectUrl;

      this.getAccessToken = jest.fn(async () => {
        return {
          token: 'mock-access-token-' + Date.now(),
          expiry_date: Date.now() + 3600000,
        };
      });

      this.verifyIdToken = jest.fn(async (options) => {
        const verifyRecord = {
          idToken: options.idToken,
          audience: options.audience,
          timestamp: new Date().toISOString(),
        };
        verifyCalls.push(verifyRecord);

        // Return mock user ticket
        return {
          getPayload: jest.fn(() => ({
            iss: 'https://accounts.google.com',
            azp: options.audience,
            aud: options.audience,
            sub: 'mock-google-id-' + Date.now(),
            email: 'test-oauth-user@gmail.com',
            email_verified: true,
            at_hash: 'mock-hash',
            name: 'Test OAuth User',
            picture: 'https://lh3.googleusercontent.com/a/default-user',
            given_name: 'Test',
            family_name: 'User',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
          })),
        };
      });

      return this;
    }),
  },
};

/**
 * Mock getTokenInfo endpoint
 */
const getTokenInfo = jest.fn(async (token) => {
  const tokenRecord = {
    token,
    timestamp: new Date().toISOString(),
  };
  tokenCalls.push(tokenRecord);

  return {
    issued_at: Date.now(),
    expires_in: 3600,
    scope: 'openid email profile',
    token_type: 'Bearer',
  };
});

/**
 * Helper: Get all OAuth verify calls
 */
const getVerifyCalls = () => verifyCalls;

/**
 * Helper: Get all token calls
 */
const getTokenCalls = () => tokenCalls;

/**
 * Helper: Clear all call records
 */
const clearAllCalls = () => {
  verifyCalls.length = 0;
  tokenCalls.length = 0;
  jest.clearAllMocks();
};

/**
 * Helper: Get verify call count
 */
const getVerifyCount = () => verifyCalls.length;

/**
 * Helper: Get token call count
 */
const getTokenCount = () => tokenCalls.length;

/**
 * Export mocked google auth module
 */
module.exports = {
  google,
  getTokenInfo,
  // Test helpers
  getVerifyCalls,
  getTokenCalls,
  clearAllCalls,
  getVerifyCount,
  getTokenCount,
};
