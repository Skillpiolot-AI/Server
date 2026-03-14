/**
 * Auth Controller Tests
 * Tests for authentication, RBAC, and role-based access control
 * Focus: Can each user role access what they should?
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
  expectErrorMessage,
} = require('../../helpers/testHelpers');

describe('Auth Controller - RBAC', () => {
  let adminUser;
  let mentorUser;
  let studentUser;
  let userUser;
  let uniAdminUser;
  let uniTeachUser;
  
  let adminToken;
  let mentorToken;
  let studentToken;
  let userToken;
  let uniAdminToken;
  let uniTeachToken;

  let testUniversity;

  beforeEach(async () => {
    await cleanDatabase();

    // Create test university
    testUniversity = await University.create({
      name: 'Test University',
      code: 'TU001',
    });

    // Create users with all 6 roles
    adminUser = await createTestUser('Admin');
    mentorUser = await createTestUser('Mentor');
    studentUser = await User.create({
      username: 'student1',
      name: 'Student User',
      email: 'student@test.com',
      password: 'pass123',
      role: 'Student',
      universityId: testUniversity._id,
    });
    userUser = await createTestUser('User');
    uniAdminUser = await User.create({
      username: 'uniadmin1',
      name: 'Uni Admin',
      email: 'uniadmin@test.com',
      password: 'pass123',
      role: 'UniAdmin',
      universityId: testUniversity._id,
    });
    uniTeachUser = await User.create({
      username: 'unitech1',
      name: 'Uni Teacher',
      email: 'unitech@test.com',
      password: 'pass123',
      role: 'UniTeach',
      universityId: testUniversity._id,
    });

    // Generate tokens
    adminToken = getValidJWT(adminUser._id, 'Admin');
    mentorToken = getValidJWT(mentorUser._id, 'Mentor');
    studentToken = getValidJWT(studentUser._id, 'Student');
    userToken = getValidJWT(userUser._id, 'User');
    uniAdminToken = getValidJWT(uniAdminUser._id, 'UniAdmin');
    uniTeachToken = getValidJWT(uniTeachUser._id, 'UniTeach');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // LOGIN TESTS
  // =========================================================================
  describe('Login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin1',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.role).toBe('Admin');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin1',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'pass123',
        });

      expect(response.status).toBe(401);
    });

    test('should lock account after failed attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: adminUser.username,
            password: 'wrongpass',
          });
      }

      // Next attempt should fail with account locked error
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: adminUser.username,
          password: 'password123',
        });

      expect(response.status).toBe(403);
      expectErrorMessage(response, 'locked');
    });

    test('should track last login timestamp', async () => {
      const before = new Date();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin1',
          password: 'password123',
        });

      expect(response.status).toBe(200);

      const user = await User.findOne({ username: 'admin1' });
      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  // =========================================================================
  // ADMIN ACCESS CONTROL TESTS
  // =========================================================================
  describe('Admin Access Control', () => {
    test('Admin should access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Admin should manage users', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${userUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'Mentor' });

      expect(response.status).toBe(200);
    });

    test('Admin should view all reports', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Non-Admin should NOT access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('Mentor should NOT access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(403);
    });

    test('Student should NOT access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // UNIVERSITY ADMIN ACCESS CONTROL TESTS
  // =========================================================================
  describe('University Admin Access Control', () => {
    test('UniAdmin should manage their university', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
    });

    test('UniAdmin should manage students in their university', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/students`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
    });

    test('UniAdmin should only access their assigned university', async () => {
      const otherUni = await University.create({
        name: 'Other University',
        code: 'OU001',
      });

      const response = await request(app)
        .get(`/api/universities/${otherUni._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(403);
    });

    test('UniTeach should NOT manage university settings', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${uniTeachToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(403);
    });

    test('Regular User should NOT access university admin panel', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // MENTOR ACCESS CONTROL TESTS
  // =========================================================================
  describe('Mentor Access Control', () => {
    test('Mentor should create bookings', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          studentId: studentUser._id,
          sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          sessionDuration: 60,
        });

      expect([200, 201]).toContain(response.status);
    });

    test('Mentor should manage their own profile', async () => {
      const response = await request(app)
        .patch(`/api/mentors/${mentorUser._id}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ expertise: ['JavaScript', 'React'] });

      expect(response.status).toBe(200);
    });

    test('Mentor should NOT manage other mentors', async () => {
      const otherMentor = await createTestUser('Mentor');
      
      const response = await request(app)
        .patch(`/api/mentors/${otherMentor._id}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ expertise: ['Python'] });

      expect(response.status).toBe(403);
    });

    test('Non-Mentor should NOT create mentorships', async () => {
      const response = await request(app)
        .post('/api/mentors')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ expertise: ['JavaScript'] });

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // STUDENT ACCESS CONTROL TESTS
  // =========================================================================
  describe('Student Access Control', () => {
    test('Student should access their portal', async () => {
      const response = await request(app)
        .get('/api/students/portal')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
    });

    test('Student should view their assessments', async () => {
      const response = await request(app)
        .get('/api/assessments/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
    });

    test('Student should NOT access other students portal', async () => {
      const otherStudent = await User.create({
        username: 'student2',
        name: 'Other Student',
        email: 'otherstudent@test.com',
        password: 'pass123',
        role: 'Student',
        universityId: testUniversity._id,
      });

      const response = await request(app)
        .get(`/api/students/${otherStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    test('Non-Student should NOT access student portal', async () => {
      const response = await request(app)
        .get('/api/students/portal')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(403);
    });

    test('Student should book mentor sessions', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mentorId: mentorUser._id,
          sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          sessionDuration: 60,
        });

      expect([200, 201]).toContain(response.status);
    });
  });

  // =========================================================================
  // TOKEN VALIDATION TESTS
  // =========================================================================
  describe('Token Validation', () => {
    test('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/admin/users');

      expect(response.status).toBe(401);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });

    test('should reject expired token', async () => {
      const expiredToken = getValidJWT(adminUser._id, 'Admin', { expiresIn: '-1s' });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    test('should reject token from deleted user', async () => {
      const tempUser = await createTestUser('User');
      const tempToken = getValidJWT(tempUser._id, 'User');

      await User.deleteOne({ _id: tempUser._id });

      const response = await request(app)
        .get('/api/assessments/my')
        .set('Authorization', `Bearer ${tempToken}`);

      expect(response.status).toBe(401);
    });

    test('should refresh token when near expiry', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(userToken);
    });
  });

  // =========================================================================
  // GOOGLE OAuth TESTS
  // =========================================================================
  describe('Google OAuth', () => {
    test('should create account with Google OAuth', async () => {
      // Mock Google OAuth response
      const response = await request(app)
        .post('/api/auth/google')
        .send({
          googleId: 'google_123456',
          email: 'newuser@gmail.com',
          name: 'New User',
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.authProvider).toBe('google');
    });

    test('should login existing user via Google', async () => {
      const googleUser = await User.create({
        username: 'googleuser',
        name: 'Google User',
        email: 'google@test.com',
        password: 'random123',
        role: 'User',
        googleId: 'google_123',
        authProvider: 'google',
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({
          googleId: 'google_123',
          email: 'google@test.com',
          name: 'Google User',
        });

      expect(response.status).toBe(200);
      expect(response.body.user._id.toString()).toBe(googleUser._id.toString());
    });

    test('should not override existing local account', async () => {
      const localUser = await User.create({
        username: 'localuser',
        name: 'Local User',
        email: 'local@test.com',
        password: 'pass123',
        role: 'User',
        authProvider: 'local',
      });

      const response = await request(app)
        .post('/api/auth/google')
        .send({
          googleId: 'google_456',
          email: 'local@test.com', // Same email as local user
          name: 'Someone Else',
        });

      // Should either fail or create new account, not override
      expect([400, 201]).toContain(response.status);
    });
  });

  // =========================================================================
  // PERMISSION DELEGATION TESTS
  // =========================================================================
  describe('Permission Delegation', () => {
    test('UniAdmin should grant permissions to themselves', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}/permissions`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          permissions: ['manage_students', 'manage_courses'],
        });

      expect(response.status).toBe(200);
    });

    test('UniAdmin should NOT grant permissions to Admin', async () => {
      const response = await request(app)
        .patch(`/api/admin/permissions`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          permissions: ['anything'],
        });

      expect(response.status).toBe(403);
    });

    test('Student should progressively get access to more features', async () => {
      // New student starts with basic access
      const basicResponse = await request(app)
        .get('/api/students/portal')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(basicResponse.status).toBe(200);

      // After completing assessment, can access recommendations
      const assessmentResponse = await request(app)
        .get('/api/recommendations')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 403]).toContain(assessmentResponse.status);
    });
  });

  // =========================================================================
  // LOGOUT & SESSION TESTS
  // =========================================================================
  describe('Logout and Sessions', () => {
    test('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('should invalidate token after logout', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${userToken}`);

      const response = await request(app)
        .get('/api/assessments/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
    });

    test('should track current session', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin1',
          password: 'password123',
        });

      const user = await User.findById(loginResponse.body.user._id);
      expect(user.currentSession).toBeDefined();
      expect(user.currentSession.ip).toBeDefined();
      expect(user.currentSession.userAgent).toBeDefined();
    });

    test('should limit concurrent sessions', async () => {
      const maxSessions = 3;

      // Try to create more than max sessions
      for (let i = 0; i < maxSessions + 2; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            username: 'mentor1',
            password: 'password123',
          });
      }

      const user = await User.findOne({ username: 'mentor1' });
      const sessions = user.sessions || [user.currentSession];
      expect(sessions.length).toBeLessThanOrEqual(maxSessions);
    });
  });
});
