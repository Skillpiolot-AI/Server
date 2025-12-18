// tests/unit/middleware/activityTracker.test.js

// Mock UserActivity model
jest.mock('../../../models/UserActivity', () => ({
  create: jest.fn(),
}));

const UserActivity = require('../../../models/UserActivity');
const { logActivity } = require('../../../middleware/activityTracker');

describe('Activity Tracker Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logActivity function', () => {
    it('should log activity with minimal parameters', async () => {
      UserActivity.create.mockResolvedValue({});

      await logActivity('user123', 'login');

      expect(UserActivity.create).toHaveBeenCalledTimes(1);
      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          activityType: 'login',
          details: {},
        })
      );
    });

    it('should log activity with all details provided', async () => {
      UserActivity.create.mockResolvedValue({});

      const details = {
        sessionId: 'session-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        page: '/dashboard',
      };

      await logActivity('user456', 'page_visit', details);

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user456',
          sessionId: 'session-123',
          activityType: 'page_visit',
          details,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        })
      );
    });

    it('should generate session ID if not provided', async () => {
      UserActivity.create.mockResolvedValue({});

      await logActivity('user789', 'logout', {});

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user789',
          sessionId: expect.stringMatching(/^manual-\d+$/),
          activityType: 'logout',
        })
      );
    });

    it('should handle various activity types', async () => {
      UserActivity.create.mockResolvedValue({});

      const activityTypes = [
        'login',
        'logout',
        'page_visit',
        'quiz_taken',
        'profile_updated',
        'video_watched',
      ];

      for (const activityType of activityTypes) {
        await logActivity('user123', activityType);
      }

      expect(UserActivity.create).toHaveBeenCalledTimes(activityTypes.length);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      UserActivity.create.mockRejectedValue(dbError);

      // Should not throw
      await expect(logActivity('user123', 'login')).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalledWith('Activity logging error:', dbError);
    });

    it('should include timestamp in activity log', async () => {
      UserActivity.create.mockResolvedValue({});

      await logActivity('user123', 'login');

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Date),
        })
      );
    });

    it('should handle null/undefined userId gracefully', async () => {
      UserActivity.create.mockResolvedValue({});

      await logActivity(null, 'login');

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          activityType: 'login',
        })
      );
    });

    it('should handle empty activity type', async () => {
      UserActivity.create.mockResolvedValue({});

      await logActivity('user123', '');

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          activityType: '',
        })
      );
    });

    it('should preserve additional details in the details object', async () => {
      UserActivity.create.mockResolvedValue({});

      const details = {
        sessionId: 'session-abc',
        customField: 'custom-value',
        nestedData: { key: 'value' },
      };

      await logActivity('user123', 'custom_event', details);

      expect(UserActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            customField: 'custom-value',
            nestedData: { key: 'value' },
          }),
        })
      );
    });
  });
});
