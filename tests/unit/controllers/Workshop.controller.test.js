/**
 * Workshop Controller Tests
 * Tests for workshop/event management and registration
 * Focus: Workshop creation, registration, scheduling
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Workshop = require('../../../models/Workshop');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Workshop Controller', () => {
  let testUser;
  let adminUser;
  let userToken;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({ role: 'User' });
    adminUser = await createTestUser({ role: 'Admin' });
    userToken = getValidJWT(testUser._id, 'User');
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // WORKSHOP RETRIEVAL TESTS
  // =========================================================================
  describe('Get Workshops', () => {
    beforeEach(async () => {
      await Workshop.create([
        {
          title: 'Web Development Basics',
          description: 'Learn fundamentals of web development',
          instructor: new mongoose.Types.ObjectId(),
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 120,
          capacity: 50,
          registered: 10,
          status: 'Scheduled',
        },
        {
          title: 'Advanced JavaScript',
          description: 'Deep dive into JavaScript concepts',
          instructor: new mongoose.Types.ObjectId(),
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          duration: 180,
          capacity: 30,
          registered: 25,
          status: 'Scheduled',
        },
      ]);
    });

    test('should retrieve all workshops', async () => {
      const response = await request(app)
        .get('/api/workshops')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workshops.length).toBeGreaterThan(0);
    });

    test('should get single workshop by ID', async () => {
      const workshops = await Workshop.find();
      const response = await request(app)
        .get(`/api/workshops/${workshops[0]._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workshop.title).toBe('Web Development Basics');
    });

    test('should show available seats for workshop', async () => {
      const response = await request(app)
        .get('/api/workshops')
        .set('Authorization', `Bearer ${userToken}`);

      const workshop = response.body.workshops[0];
      expect(workshop.availableSeats).toBeDefined();
      expect(workshop.availableSeats).toBe(workshop.capacity - workshop.registered);
    });
  });

  // =========================================================================
  // WORKSHOP CREATION (ADMIN ONLY) TESTS
  // =========================================================================
  describe('Create Workshop', () => {
    test('should create workshop (admin only)', async () => {
      const response = await request(app)
        .post('/api/workshops')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Career Planning Workshop',
          description: 'Plan your career effectively',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          duration: 90,
          capacity: 40,
          instructor: adminUser._id,
        });

      expect(response.status).toBe(201);
      expect(response.body.workshop.title).toBe('Career Planning Workshop');
    });

    test('should reject workshop creation for non-admin', async () => {
      const response = await request(app)
        .post('/api/workshops')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Unauthorized Workshop',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          duration: 120,
          capacity: 50,
        });

      expect(response.status).toBe(403);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/workshops')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Incomplete Workshop',
          // Missing date and other required fields
        });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // WORKSHOP REGISTRATION TESTS
  // =========================================================================
  describe('Workshop Registration', () => {
    let workshop;

    beforeEach(async () => {
      workshop = await Workshop.create({
        title: 'Python for Beginners',
        description: 'Learn Python basics',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: 120,
        capacity: 30,
        registered: 5,
        registeredUsers: [],
      });
    });

    test('should register user for workshop', async () => {
      const response = await request(app)
        .post(`/api/workshops/${workshop._id}/register`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workshop.registered).toBeGreaterThan(5);
    });

    test('should not register if workshop is full', async () => {
      const fullWorkshop = await Workshop.create({
        title: 'Full Workshop',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: 120,
        capacity: 2,
        registered: 2,
      });

      const response = await request(app)
        .post(`/api/workshops/${fullWorkshop._id}/register`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });

    test('should prevent duplicate registration', async () => {
      await request(app)
        .post(`/api/workshops/${workshop._id}/register`)
        .set('Authorization', `Bearer ${userToken}`);

      const response = await request(app)
        .post(`/api/workshops/${workshop._id}/register`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });

    test('should get user registered workshops', async () => {
      await request(app)
        .post(`/api/workshops/${workshop._id}/register`)
        .set('Authorization', `Bearer ${userToken}`);

      const response = await request(app)
        .get('/api/users/registered-workshops')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workshops.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // WORKSHOP CANCELLATION/UNREGISTER TESTS
  // =========================================================================
  describe('Workshop Unregister', () => {
    let workshop;

    beforeEach(async () => {
      workshop = await Workshop.create({
        title: 'Advanced Concepts',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: 120,
        capacity: 30,
        registered: 10,
        registeredUsers: [testUser._id],
      });
    });

    test('should unregister user from workshop', async () => {
      const response = await request(app)
        .post(`/api/workshops/${workshop._id}/unregister`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('should not unregister if workshop has started', async () => {
      const startedWorkshop = await Workshop.create({
        title: 'Started Workshop',
        date: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        duration: 120,
        capacity: 30,
        registered: 10,
        registeredUsers: [testUser._id],
        status: 'Ongoing',
      });

      const response = await request(app)
        .post(`/api/workshops/${startedWorkshop._id}/unregister`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // WORKSHOP UPDATE TESTS
  // =========================================================================
  describe('Update Workshop', () => {
    let workshop;

    beforeEach(async () => {
      workshop = await Workshop.create({
        title: 'Original Title',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 120,
        capacity: 30,
      });
    });

    test('should update workshop details (admin only)', async () => {
      const response = await request(app)
        .put(`/api/workshops/${workshop._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          capacity: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.workshop.title).toBe('Updated Title');
    });

    test('should not allow user to update workshop', async () => {
      const response = await request(app)
        .put(`/api/workshops/${workshop._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // WORKSHOP DELETION TESTS
  // =========================================================================
  describe('Delete Workshop', () => {
    let workshop;

    beforeEach(async () => {
      workshop = await Workshop.create({
        title: 'Workshop to Delete',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        duration: 120,
        capacity: 30,
      });
    });

    test('should delete workshop (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/workshops/${workshop._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletedWorkshop = await Workshop.findById(workshop._id);
      expect(deletedWorkshop).toBeNull();
    });
  });

  // =========================================================================
  // WORKSHOP FILTERING & SEARCH TESTS
  // =========================================================================
  describe('Workshop Search & Filter', () => {
    beforeEach(async () => {
      await Workshop.create([
        {
          title: 'Upcoming Workshop 1',
          category: 'Technical',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          duration: 120,
          capacity: 30,
        },
        {
          title: 'Upcoming Workshop 2',
          category: 'Soft Skills',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          duration: 90,
          capacity: 40,
        },
      ]);
    });

    test('should filter workshops by category', async () => {
      const response = await request(app)
        .get('/api/workshops?category=Technical')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.workshops.forEach(w => {
        expect(w.category).toBe('Technical');
      });
    });

    test('should search workshops by title', async () => {
      const response = await request(app)
        .get('/api/workshops?search=Upcoming')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workshops.some(w => w.title.includes('Upcoming'))).toBe(true);
    });

    test('should filter by upcoming workshops only', async () => {
      const response = await request(app)
        .get('/api/workshops?filter=upcoming')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.workshops.length).toBeGreaterThan(0);
    });
  });
});
