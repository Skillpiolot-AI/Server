/**
 * Mock Cloudinary Service
 * Replaces config/cloudinary.js for testing
 * Handles image/file uploads without real cloud storage
 */

const uploadCalls = [];
const deleteCalls = [];

/**
 * Mock v2 object with uploader
 */
const v2 = {
  config: jest.fn((options) => {
    return {
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
      ...options,
    };
  }),

  uploader: {
    /**
     * Mock upload function
     */
    upload: jest.fn(async (file, options = {}) => {
      const uploadRecord = {
        file,
        options,
        timestamp: new Date().toISOString(),
      };

      // Generate mock response
      const mockResponse = {
        public_id: `mock-upload-${uploadCalls.length}`,
        url: `https://res.cloudinary.com/test/image/upload/mock-upload-${uploadCalls.length}.jpg`,
        secure_url: `https://res.cloudinary.com/test/image/upload/mock-upload-${uploadCalls.length}.jpg`,
        resource_type: options.resource_type || 'image',
        width: 800,
        height: 600,
        bytes: 102400,
        format: 'jpg',
        created_at: new Date(),
      };

      uploadCalls.push(uploadRecord);
      return mockResponse;
    }),

    /**
     * Mock destroy function (delete)
     */
    destroy: jest.fn(async (publicId, options = {}) => {
      const deleteRecord = {
        publicId,
        options,
        timestamp: new Date().toISOString(),
      };

      deleteCalls.push(deleteRecord);
      return {
        result: 'ok',
        public_id: publicId,
      };
    }),

    /**
     * Mock resource function
     */
    resource: jest.fn(async (publicId) => {
      return {
        public_id: publicId,
        url: `https://res.cloudinary.com/test/image/upload/${publicId}.jpg`,
        secure_url: `https://res.cloudinary.com/test/image/upload/${publicId}.jpg`,
      };
    }),
  },

  url: jest.fn((publicId, options = {}) => {
    return `https://res.cloudinary.com/test/image/upload/${publicId}.jpg`;
  }),
};

/**
 * Helper: Get all upload calls
 */
const getUploadCalls = () => uploadCalls;

/**
 * Helper: Get all delete calls
 */
const getDeleteCalls = () => deleteCalls;

/**
 * Helper: Clear all call records
 */
const clearAllCalls = () => {
  uploadCalls.length = 0;
  deleteCalls.length = 0;
  jest.clearAllMocks();
};

/**
 * Helper: Get upload count
 */
const getUploadCount = () => uploadCalls.length;

/**
 * Helper: Get delete count
 */
const getDeleteCount = () => deleteCalls.length;

/**
 * Export mocked cloudinary module
 */
module.exports = {
  v2,
  // Test helpers
  getUploadCalls,
  getDeleteCalls,
  clearAllCalls,
  getUploadCount,
  getDeleteCount,
};
