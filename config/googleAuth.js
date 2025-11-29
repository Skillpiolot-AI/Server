const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token
 * @param {string} token - Google ID token from frontend
 * @returns {Object} Verified user payload
 */
async function verifyGoogleToken(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
      success: true,
      data: {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
        locale: payload.locale
      }
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  verifyGoogleToken,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
};
