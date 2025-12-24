// tests/unit/models/announcement.test.js
const mongoose = require('mongoose');
const Announcement = require('../../../models/Announcement');

describe('Announcement Model Tests', () => {
  let testAdminId;

  beforeEach(() => {
    testAdminId = new mongoose.Types.ObjectId();
  });

  describe('Announcement Creation', () => {
    it('should create a valid announcement', async () => {
      const announcementData = {
        subject: 'Important Update',
        description: 'This is an important announcement for all users.',
        recipientType: 'all',
        createdBy: testAdminId,
      };

      const announcement = new Announcement(announcementData);
      const savedAnnouncement = await announcement.save();

      expect(savedAnnouncement._id).toBeDefined();
      expect(savedAnnouncement.announcementId).toBeDefined();
      expect(savedAnnouncement.announcementId).toMatch(/^ANN-/);
      expect(savedAnnouncement.status).toBe('draft');
      expect(savedAnnouncement.type).toBe('general');
    });

    it('should generate unique announcementId', async () => {
      const ann1 = await Announcement.create({
        subject: 'Announcement 1',
        description: 'Description 1',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      const ann2 = await Announcement.create({
        subject: 'Announcement 2',
        description: 'Description 2',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      expect(ann1.announcementId).not.toBe(ann2.announcementId);
    });

    it('should not create announcement without required subject', async () => {
      const announcement = new Announcement({
        description: 'Description without subject',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should not create announcement without required description', async () => {
      const announcement = new Announcement({
        subject: 'Subject without description',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should not create announcement without createdBy', async () => {
      const announcement = new Announcement({
        subject: 'Test Subject',
        description: 'Test description',
        recipientType: 'all',
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const announcement = await Announcement.create({
        subject: 'Test Subject',
        description: 'Test description',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      expect(announcement.status).toBe('draft');
      expect(announcement.type).toBe('general');
      expect(announcement.channels.push).toBe(true);
      expect(announcement.channels.email).toBe(false);
      expect(announcement.channels.inApp).toBe(true);
    });

    it('should generate shortDescription from description if not provided', async () => {
      const longDescription = 'A'.repeat(200);
      const announcement = await Announcement.create({
        subject: 'Test Subject',
        description: longDescription,
        recipientType: 'all',
        createdBy: testAdminId,
      });

      expect(announcement.shortDescription).toBeDefined();
      expect(announcement.shortDescription.length).toBeLessThanOrEqual(153); // 150 + '...'
    });
  });

  describe('Status Validation', () => {
    it('should validate status enum values', async () => {
      const announcement = new Announcement({
        subject: 'Test',
        description: 'Test',
        recipientType: 'all',
        createdBy: testAdminId,
        status: 'invalid_status',
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should accept all valid status values', async () => {
      const validStatuses = ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'];

      for (const status of validStatuses) {
        const ann = await Announcement.create({
          subject: `Status ${status}`,
          description: `Description for ${status}`,
          recipientType: 'all',
          createdBy: testAdminId,
          status,
        });

        expect(ann.status).toBe(status);
      }
    });
  });

  describe('Type Validation', () => {
    it('should validate type enum values', async () => {
      const announcement = new Announcement({
        subject: 'Test',
        description: 'Test',
        recipientType: 'all',
        createdBy: testAdminId,
        type: 'invalid_type',
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should accept all valid type values', async () => {
      const validTypes = ['general', 'important', 'urgent', 'update', 'event'];

      for (const type of validTypes) {
        const ann = await Announcement.create({
          subject: `Type ${type}`,
          description: `Description for ${type}`,
          recipientType: 'all',
          createdBy: testAdminId,
          type,
        });

        expect(ann.type).toBe(type);
      }
    });
  });

  describe('Recipient Type Validation', () => {
    it('should validate recipientType enum values', async () => {
      const announcement = new Announcement({
        subject: 'Test',
        description: 'Test',
        recipientType: 'invalid_recipient',
        createdBy: testAdminId,
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should accept all valid recipientType values', async () => {
      const validTypes = ['all', 'mentors', 'users', 'college', 'specific'];

      for (const recipientType of validTypes) {
        const ann = await Announcement.create({
          subject: `Recipient ${recipientType}`,
          description: `Description for ${recipientType}`,
          recipientType,
          createdBy: testAdminId,
        });

        expect(ann.recipientType).toBe(recipientType);
      }
    });

    it('should handle specific recipients', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();

      const announcement = await Announcement.create({
        subject: 'Specific Recipients',
        description: 'For specific users only',
        recipientType: 'specific',
        recipientIds: [userId1, userId2],
        createdBy: testAdminId,
      });

      expect(announcement.recipientIds).toHaveLength(2);
    });
  });

  describe('markAsRead Method', () => {
    it('should mark announcement as read for user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const announcement = await Announcement.create({
        subject: 'Test',
        description: 'Test description',
        recipientType: 'all',
        createdBy: testAdminId,
        status: 'sent',
        deliveryLog: [{ userId, pushSent: true }],
      });

      const result = await announcement.markAsRead(userId);

      expect(result).toBe(true);

      const updated = await Announcement.findById(announcement._id);
      const log = updated.deliveryLog.find(l => l.userId.toString() === userId.toString());
      expect(log.readAt).toBeDefined();
    });

    it('should return false if already read', async () => {
      const userId = new mongoose.Types.ObjectId();
      const announcement = await Announcement.create({
        subject: 'Test',
        description: 'Test description',
        recipientType: 'all',
        createdBy: testAdminId,
        status: 'sent',
        deliveryLog: [{ userId, pushSent: true, readAt: new Date() }],
      });

      const result = await announcement.markAsRead(userId);
      expect(result).toBe(false);
    });

    it('should return false if user not in delivery log', async () => {
      const userId = new mongoose.Types.ObjectId();
      const announcement = await Announcement.create({
        subject: 'Test',
        description: 'Test description',
        recipientType: 'all',
        createdBy: testAdminId,
        status: 'sent',
        deliveryLog: [],
      });

      const result = await announcement.markAsRead(userId);
      expect(result).toBe(false);
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      await Announcement.create({
        subject: 'All Users',
        description: 'For everyone',
        recipientType: 'all',
        createdBy: testAdminId,
        status: 'sent',
        sentAt: new Date(),
      });

      await Announcement.create({
        subject: 'Mentors Only',
        description: 'For mentors',
        recipientType: 'mentors',
        createdBy: testAdminId,
        status: 'sent',
        sentAt: new Date(),
      });

      await Announcement.create({
        subject: 'Draft Announcement',
        description: 'Not sent yet',
        recipientType: 'all',
        createdBy: testAdminId,
        status: 'draft',
      });
    });

    describe('getForUser', () => {
      it('should get announcements for user role', async () => {
        const userId = new mongoose.Types.ObjectId();
        const announcements = await Announcement.getForUser(userId, 'User');

        // Should include 'all' recipient type
        expect(announcements.some(a => a.recipientType === 'all')).toBe(true);
      });

      it('should only return sent announcements', async () => {
        const userId = new mongoose.Types.ObjectId();
        const announcements = await Announcement.getForUser(userId, 'User');

        announcements.forEach(ann => {
          expect(ann.status).toBe('sent');
        });
      });

      it('should limit results', async () => {
        const userId = new mongoose.Types.ObjectId();
        const announcements = await Announcement.getForUser(userId, 'User');

        expect(announcements.length).toBeLessThanOrEqual(50);
      });
    });

    describe('getUnreadCount', () => {
      it('should count unread announcements', async () => {
        const userId = new mongoose.Types.ObjectId();
        const count = await Announcement.getUnreadCount(userId, 'User');

        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Delivery Channels', () => {
    it('should configure multiple channels', async () => {
      const announcement = await Announcement.create({
        subject: 'Multi-channel',
        description: 'Sent via all channels',
        recipientType: 'all',
        createdBy: testAdminId,
        channels: {
          push: true,
          email: true,
          inApp: true,
        },
      });

      expect(announcement.channels.push).toBe(true);
      expect(announcement.channels.email).toBe(true);
      expect(announcement.channels.inApp).toBe(true);
    });
  });



  describe('Stats Tracking', () => {
    it('should initialize stats with defaults', async () => {
      const announcement = await Announcement.create({
        subject: 'Stats Test',
        description: 'Testing stats',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      expect(announcement.stats.totalRecipients).toBe(0);
      expect(announcement.stats.pushSent).toBe(0);
      expect(announcement.stats.pushFailed).toBe(0);
      expect(announcement.stats.emailSent).toBe(0);
      expect(announcement.stats.emailFailed).toBe(0);
      expect(announcement.stats.read).toBe(0);
    });

    it('should update stats', async () => {
      const announcement = await Announcement.create({
        subject: 'Stats Update',
        description: 'Updating stats',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      announcement.stats.totalRecipients = 100;
      announcement.stats.pushSent = 95;
      announcement.stats.pushFailed = 5;
      await announcement.save();

      const updated = await Announcement.findById(announcement._id);
      expect(updated.stats.totalRecipients).toBe(100);
      expect(updated.stats.pushSent).toBe(95);
    });
  });

  describe('Target Roles', () => {
    it('should accept multiple target roles', async () => {
      const announcement = await Announcement.create({
        subject: 'Multi-role',
        description: 'For multiple roles',
        recipientType: 'all',
        targetRoles: ['User', 'Mentor'],
        createdBy: testAdminId,
      });

      expect(announcement.targetRoles).toContain('User');
      expect(announcement.targetRoles).toContain('Mentor');
    });

    it('should validate targetRoles enum values', async () => {
      const announcement = new Announcement({
        subject: 'Test',
        description: 'Test',
        recipientType: 'all',
        targetRoles: ['InvalidRole'],
        createdBy: testAdminId,
      });

      await expect(announcement.save()).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should enforce subject maxlength', async () => {
      const announcement = new Announcement({
        subject: 'A'.repeat(201),
        description: 'Test',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should enforce description maxlength', async () => {
      const announcement = new Announcement({
        subject: 'Test',
        description: 'A'.repeat(5001),
        recipientType: 'all',
        createdBy: testAdminId,
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should trim subject whitespace', async () => {
      const announcement = await Announcement.create({
        subject: '  Important Update  ',
        description: 'Test',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      expect(announcement.subject).toBe('Important Update');
    });

    it('should handle scheduling', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const announcement = await Announcement.create({
        subject: 'Scheduled',
        description: 'Scheduled announcement',
        recipientType: 'all',
        createdBy: testAdminId,
        status: 'scheduled',
        scheduledAt: futureDate,
      });

      expect(announcement.scheduledAt.getTime()).toBe(futureDate.getTime());
    });

    it('should update timestamps on save', async () => {
      const announcement = await Announcement.create({
        subject: 'Timestamp Test',
        description: 'Testing timestamps',
        recipientType: 'all',
        createdBy: testAdminId,
      });

      const originalUpdatedAt = announcement.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      announcement.subject = 'Updated Subject';
      await announcement.save();

      expect(announcement.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should handle delivery log', async () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();

      const announcement = await Announcement.create({
        subject: 'Delivery Log Test',
        description: 'Testing delivery log',
        recipientType: 'all',
        createdBy: testAdminId,
        deliveryLog: [
          { userId: userId1, pushSent: true, pushSentAt: new Date() },
          { userId: userId2, emailSent: true, emailSentAt: new Date() },
        ],
      });

      expect(announcement.deliveryLog).toHaveLength(2);
    });
  });
});
