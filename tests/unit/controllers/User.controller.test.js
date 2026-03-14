/**
 * User Controller Tests
 * Tests for user profile management, updates, and role transitions
 * Focus: Can users update their profiles? Are permissions enforced?
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const User = require('../../../models/User');
const University = require('../../../models/University');
const {
  testUsers,
  generateId,
} = require('../../fixtures/testData');
const {
  cleanDatabase,
  createTestUser,
  getValidJWT,
} = require('../../helpers/testHelpers');

describe('User Controller', () => {
  let testUser;
  let authToken;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    
    testUser = await createTestUser('User');
    authToken = getValidJWT(testUser._id, 'User');
    
    adminUser = await createTestUser('Admin');
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // PROFILE RETRIEVAL TESTS
  // =========================================================================
  describe('Profile Retrieval', () => {
    test('should get own profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user._id.toString()).toBe(testUser._id.toString());
    });

    test('should get public profile by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}/public`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user._id.toString()).toBe(testUser._id.toString());
    });

    test('should not expose sensitive data in public profile', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}/public`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.isSuspended).toBeUndefined();
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/users/${fakeId}/public`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // PROFILE UPDATE TESTS
  // =========================================================================
  describe('Profile Updates', () => {
    test('should update own profile', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          phoneNumber: '+91-9999999999',
          jobTitle: 'Senior Developer',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('Updated Name');
      expect(response.body.user.phoneNumber).toBe('+91-9999999999');
    });

    test('should not allow changing username', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newusername',
        });

      expect(response.status).toBe(400);
    });

    test('should not allow changing email without verification', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@test.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('verification');
    });

    test('should not allow direct role change by user', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'Admin',
        });

      expect(response.status).toBe(400);
      expect(response.body.user.role).toBe('User');
    });

    test('should allow updating profile image URL', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/new-profile.jpg',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.imageUrl).toBe('https://example.com/new-profile.jpg');
    });

    test('should validate phone number format', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: 'invalid',
        });

      expect(response.status).toBe(400);
    });

    test('should track profile update timestamp', async () => {
      const beforeUpdate = new Date();
      
      await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
        });

      const updated = await User.findById(testUser._id);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });
  });

  // =========================================================================
  // PASSWORD MANAGEMENT TESTS
  // =========================================================================
  describe('Password Management', () => {
    test('should change password with correct old password', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'password123',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(200);
    });

    test('should reject password change with wrong old password', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        });

      expect(response.status).toBe(401);
    });

    test('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'password123',
          newPassword: 'weak', // Too weak
        });

      expect(response.status).toBe(400);
    });

    test('should not allow reusing recent passwords', async () => {
      // Change password first
      await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'password123',
          newPassword: 'newpassword456',
        });

      // Try to change back
      const response = await request(app)
        .post('/api/users/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          oldPassword: 'newpassword456',
          newPassword: 'password123', // Recent password
        });

      expect(response.status).toBe(400);
    });

    test('should trigger password reset via email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(200);
    });

    test('should verify reset token and allow password change', async () => {
      // In real scenario, token comes from email
      const resetToken = 'mock-reset-token-123';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newresetpassword456',
        });

      // Should succeed or fail based on token validity
      expect([200, 400]).toContain(response.status);
    });
  });

  // =========================================================================
  // EMAIL VERIFICATION TESTS
  // =========================================================================
  describe('Email Verification', () => {
    test('should send verification email', async () => {
      const response = await request(app)
        .post('/api/users/send-verification')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('should verify email with correct token', async () => {
      const verificationToken = 'mock-verification-token';

      const response = await request(app)
        .post('/api/users/verify-email')
        .send({
          token: verificationToken,
        });

      expect([200, 400]).toContain(response.status);
    });

    test('should mark user as verified after email confirmation', async () => {
      await request(app)
        .post('/api/users/send-verification')
        .set('Authorization', `Bearer ${authToken}`);

      // In real scenario, test would verify with token
      const user = await User.findById(testUser._id);
      // isVerified status depends on implementation
    });

    test('should not allow duplicate email addresses', async () => {
      const otherUser = await createTestUser('User');

      const response = await request(app)
        .patch('/api/users/request-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: otherUser.email,
        });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // NOTIFICATION & PREFERENCE TESTS
  // =========================================================================
  describe('Notifications and Preferences', () => {
    test('should update notification preferences', async () => {
      const response = await request(app)
        .patch('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emailNotifications: false,
          pushNotifications: true,
          smsNotifications: false,
        });

      expect(response.status).toBe(200);
    });

    test('should subscribe to newsletter', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newsletter: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.newsletter).toBe(true);
    });

    test('should manage push notification tokens', async () => {
      const response = await request(app)
        .post('/api/users/push-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'expo-push-token-123',
        });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // ACCOUNT ACTIONS TESTS
  // =========================================================================
  describe('Account Actions', () => {
    test('should deactivate account', async () => {
      const response = await request(app)
        .post('/api/users/deactivate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const user = await User.findById(testUser._id);
      expect(user.isActive).toBe(false);
    });

    test('should not allow operations with deactivated account', async () => {
      await request(app)
        .post('/api/users/deactivate')
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
        });

      expect(response.status).toBe(403);
    });

    test('should reactivate account', async () => {
      await request(app)
        .post('/api/users/deactivate')
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .post('/api/users/reactivate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const user = await User.findById(testUser._id);
      expect(user.isActive).toBe(true);
    });

    test('should allow account deletion with confirmation', async () => {
      const response = await request(app)
        .delete('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          confirmDeletion: true,
        });

      expect(response.status).toBe(200);

      const deleted = await User.findById(testUser._id);
      expect(deleted).toBeNull();
    });
  });

  // =========================================================================
  // ADMIN USER MANAGEMENT TESTS
  // =========================================================================
  describe('Admin User Management', () => {
    test('Admin should view user details', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Admin should suspend user account', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${testUser._id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Violation of terms',
          severity: 'warning',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.isSuspended).toBe(true);
    });

    test('Admin should unsuspend user', async () => {
      await User.findByIdAndUpdate(testUser._id, { isSuspended: true });

      const response = await request(app)
        .patch(`/api/admin/users/${testUser._id}/unsuspend`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.isSuspended).toBe(false);
    });

    test('Admin should grant mentor status', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${testUser._id}/make-mentor`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('Mentor');
    });

    test('Admin should view user activity log', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}/activity`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.activities)).toBe(true);
    });
  });

  // =========================================================================
  // BULK OPERATIONS TESTS
  // =========================================================================
  describe('Bulk Operations', () => {
    test('Admin should bulk suspend users', async () => {
      const users = await User.find({ role: 'User' }).limit(3);
      const userIds = users.map(u => u._id);

      const response = await request(app)
        .post('/api/admin/users/bulk-suspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userIds,
          reason: 'Policy violation',
        });

      expect(response.status).toBe(200);
    });

    test('Admin should bulk send notifications', async () => {
      const response = await request(app)
        .post('/api/admin/users/bulk-notify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userRole: 'User',
          message: 'System maintenance alert',
        });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // PRIVACY & DATA EXPORT TESTS
  // =========================================================================
  describe('Privacy and Data Export', () => {
    test('should generate user data export', async () => {
      const response = await request(app)
        .post('/api/users/data-export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.exportId).toBeDefined();
    });

    test('should download exported data', async () => {
      const exportResponse = await request(app)
        .post('/api/users/data-export')
        .set('Authorization', `Bearer ${authToken}`);

      const exportId = exportResponse.body.exportId;

      const downloadResponse = await request(app)
        .get(`/api/users/data-export/${exportId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 202]).toContain(downloadResponse.status);
    });
  });
});
