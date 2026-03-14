/**
 * Announcement Controller Tests
 * Tests for announcement creation, delivery, and tracking
 * Focus: Admin announcements, user reception, read tracking
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Announcement = require('../../../models/Announcement');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Announcement Controller', () => {
  let normalUser;
  let adminUser;
  let userToken;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    normalUser = await createTestUser({ role: 'User' });
    adminUser = await createTestUser({ role: 'Admin' });
    userToken = getValidJWT(normalUser._id, 'User');
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // ANNOUNCEMENT RETRIEVAL TESTS
  // =========================================================================
  describe('Get Announcements', () => {
    beforeEach(async () => {
      await Announcement.create([
        {
          subject: 'System Maintenance',
          description: 'Server maintenance scheduled',
          type: 'System',
          recipientType: 'all',
          channels: { push: true, email: false, inApp: true },
          createdBy: adminUser._id,
          status: 'sent',
          sentAt: new Date(),
        },
        {
          subject: 'New Feature Available',
          description: 'Check out the new feature',
          type: 'Feature',
          recipientType: 'all',
          channels: { push: true, email: true, inApp: true },
          createdBy: adminUser._id,
          status: 'sent',
          sentAt: new Date(),
        },
      ]);
    });

    test('should retrieve announcements for user', async () => {
      const response = await request(app)
        .get('/api/announcements/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.announcements).toBeDefined();
    });

    test('should mark announcement as read', async () => {
      const announcements = await Announcement.find({ status: 'sent' });

      const response = await request(app)
        .post(`/api/announcements/${announcements[0]._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('should get unread announcement count', async () => {
      const response = await request(app)
        .get('/api/announcements/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.unreadCount).toBeDefined();
    });
  });

  // =========================================================================
  // ADMIN ANNOUNCEMENT CREATION TESTS
  // =========================================================================
  describe('Create Announcement (Admin Only)', () => {
    test('should create announcement (admin only)', async () => {
      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Important Update',
          description: 'Please read this important update',
          type: 'Update',
          recipientType: 'all',
          channels: { push: true, email: true, inApp: true },
          sendNow: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.announcement.subject).toBe('Important Update');
      expect(response.body.announcement.createdBy.toString()).toBe(adminUser._id.toString());
    });

    test('should reject announcement creation for non-admin', async () => {
      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          subject: 'Hacked Announcement',
          description: 'I am a hacker',
          recipientType: 'all',
        });

      expect(response.status).toBe(403);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing subject and description
          recipientType: 'all',
        });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // ANNOUNCEMENT SCHEDULING TESTS
  // =========================================================================
  describe('Announcement Scheduling', () => {
    test('should create scheduled announcement', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Scheduled Announcement',
          description: 'This will be sent later',
          type: 'Scheduled',
          recipientType: 'all',
          channels: { push: true, email: false, inApp: true },
          scheduledAt: futureDate,
          sendNow: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.announcement.status).toBe('draft');
    });

    test('should send announcement immediately if sendNow is true', async () => {
      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Immediate Announcement',
          description: 'Sent right now',
          type: 'Urgent',
          recipientType: 'all',
          channels: { push: true, email: true, inApp: true },
          sendNow: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.announcement.status).toBe('sent');
    });
  });

  // =========================================================================
  // ANNOUNCEMENT TARGETING TESTS
  // =========================================================================
  describe('Announcement Targeting', () => {
    test('should target specific roles', async () => {
      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Admin Only',
          description: 'For admins only',
          recipientType: 'roles',
          targetRoles: ['Admin'],
          channels: { push: true, email: false, inApp: true },
          sendNow: false,
        });

      expect(response.status).toBe(201);
    });

    test('should target specific users', async () => {
      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Personal Message',
          description: 'For specific users',
          recipientType: 'specific',
          recipientIds: [normalUser._id],
          channels: { push: true, email: false, inApp: true },
          sendNow: false,
        });

      expect(response.status).toBe(201);
    });

    test('should preview recipient count', async () => {
      const response = await request(app)
        .post('/api/announcements/preview-recipients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recipientType: 'all',
          targetRoles: [],
          recipientIds: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.totalRecipients).toBeDefined();
    });
  });

  // =========================================================================
  // ANNOUNCEMENT UPDATE TESTS
  // =========================================================================
  describe('Update Announcement', () => {
    let announcement;

    beforeEach(async () => {
      announcement = await Announcement.create({
        subject: 'Original Subject',
        description: 'Original description',
        type: 'Update',
        createdBy: adminUser._id,
        status: 'draft',
      });
    });

    test('should update draft announcement', async () => {
      const response = await request(app)
        .put(`/api/announcements/${announcement._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Updated Subject',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.announcement.subject).toBe('Updated Subject');
    });

    test('should not allow update of sent announcement', async () => {
      const sentAnnouncement = await Announcement.create({
        subject: 'Sent Announcement',
        description: 'Already sent',
        type: 'Update',
        createdBy: adminUser._id,
        status: 'sent',
        sentAt: new Date(),
      });

      const response = await request(app)
        .put(`/api/announcements/${sentAnnouncement._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Hack Update',
        });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // ANNOUNCEMENT DELETION TESTS
  // =========================================================================
  describe('Delete Announcement', () => {
    let announcement;

    beforeEach(async () => {
      announcement = await Announcement.create({
        subject: 'To Delete',
        description: 'This will be deleted',
        type: 'Update',
        createdBy: adminUser._id,
        status: 'draft',
      });
    });

    test('should delete announcement (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/announcements/${announcement._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Announcement.findById(announcement._id);
      expect(deleted).toBeNull();
    });
  });

  // =========================================================================
  // ANNOUNCEMENT DELIVERY TRACKING TESTS
  // =========================================================================
  describe('Announcement Delivery Tracking', () => {
    let announcement;

    beforeEach(async () => {
      announcement = await Announcement.create({
        subject: 'Track This',
        description: 'Delivery tracking',
        type: 'Update',
        recipientType: 'all',
        createdBy: adminUser._id,
        status: 'sent',
        sentAt: new Date(),
        stats: {
          totalRecipients: 100,
          pushSent: 95,
          emailSent: 80,
          read: 50,
        },
        deliveryLog: [],
      });
    });

    test('should get announcement delivery stats', async () => {
      const response = await request(app)
        .get(`/api/announcements/${announcement._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.announcement.stats).toBeDefined();
      expect(response.body.announcement.stats.totalRecipients).toBe(100);
    });

    test('should track read status', async () => {
      const response = await request(app)
        .post(`/api/announcements/${announcement._id}/read`)
        .set('Authorization', `Bearer ${normalUser}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  // =========================================================================
  // ANNOUNCEMENT BATCH OPERATIONS
  // =========================================================================
  describe('Batch Operations', () => {
    beforeEach(async () => {
      await Announcement.create([
        {
          subject: 'Batch 1',
          description: 'First',
          type: 'Update',
          recipientType: 'all',
          createdBy: adminUser._id,
          status: 'sent',
          sentAt: new Date(),
        },
        {
          subject: 'Batch 2',
          description: 'Second',
          type: 'Update',
          recipientType: 'all',
          createdBy: adminUser._id,
          status: 'sent',
          sentAt: new Date(),
        },
      ]);
    });

    test('should mark all announcements as read', async () => {
      const response = await request(app)
        .post('/api/announcements/read-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });
  });
});
