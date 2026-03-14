/**
 * Interest Controller Tests
 * Tests for user interests and interest-to-career mapping
 * Focus: Holland Code interest profiles and career discovery
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Interest = require('../../../models/Interest');
const Career = require('../../../models/Career');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Interest Controller', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({ role: 'User' });
    authToken = getValidJWT(testUser._id, 'User');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // INTEREST RETRIEVAL TESTS
  // =========================================================================
  describe('Get Interests', () => {
    beforeEach(async () => {
      await Interest.create([
        {
          name: 'Technology',
          hollandCode: 'I',
          relatedCareers: ['Software Engineer', 'Data Scientist'],
        },
        {
          name: 'Art & Design',
          hollandCode: 'A',
          relatedCareers: ['UX Designer', 'Graphic Designer'],
        },
        { name: 'Business', hollandCode: 'E', relatedCareers: ['Manager', 'Entrepreneur'] },
      ]);
    });

    test('should retrieve all interests', async () => {
      const response = await request(app)
        .get('/api/interests')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.interests.length).toBeGreaterThan(0);
    });

    test('should get single interest by ID', async () => {
      const interests = await Interest.find();
      const response = await request(app)
        .get(`/api/interests/${interests[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.interest.name).toBe(interests[0].name);
    });

    test('should include Holland Code for interest', async () => {
      const response = await request(app)
        .get('/api/interests')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.interests[0].hollandCode).toBeDefined();
    });
  });

  // =========================================================================
  // USER INTEREST TRACKING TESTS
  // =========================================================================
  describe('User Interest Tracking', () => {
    let interest;

    beforeEach(async () => {
      interest = await Interest.create({
        name: 'Machine Learning',
        hollandCode: 'I',
        relatedCareers: ['ML Engineer', 'AI Researcher'],
      });
    });

    test('should add interest to user profile', async () => {
      const response = await request(app)
        .post('/api/users/interests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interestId: interest._id,
          level: 'High',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.interests.length).toBeGreaterThan(0);
    });

    test('should track interest level (High/Medium/Low)', async () => {
      const response = await request(app)
        .post('/api/users/interests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interestId: interest._id,
          level: 'Medium',
        });

      expect(response.status).toBe(200);
      expect(['High', 'Medium', 'Low']).toContain(response.body.user.interests[0].level);
    });

    test('should update interest level', async () => {
      await request(app)
        .post('/api/users/interests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interestId: interest._id,
          level: 'Low',
        });

      const response = await request(app)
        .put(`/api/users/interests/${interest._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ level: 'High' });

      expect(response.status).toBe(200);
      expect(response.body.user.interests[0].level).toBe('High');
    });
  });

  // =========================================================================
  // INTEREST-TO-CAREER MAPPING TESTS
  // =========================================================================
  describe('Interest to Career Mapping', () => {
    beforeEach(async () => {
      await Interest.create([
        {
          name: 'Problem Solving',
          hollandCode: 'I',
          relatedCareers: ['Software Engineer', 'Researcher', 'Analyst'],
        },
        {
          name: 'Helping People',
          hollandCode: 'S',
          relatedCareers: ['Counselor', 'Nurse', 'Teacher', 'Social Worker'],
        },
      ]);
    });

    test('should return careers matching user interest', async () => {
      const interests = await Interest.find({ name: 'Problem Solving' });
      const response = await request(app)
        .get(`/api/interests/${interests[0]._id}/careers`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.careers.length).toBeGreaterThan(0);
    });

    test('should suggest careers based on multiple interests', async () => {
      const interests = await Interest.find();

      await request(app)
        .post('/api/users/interests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interestId: interests[0]._id,
          level: 'High',
        });

      const response = await request(app)
        .get('/api/recommendations/by-interests')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.careerMatches).toBeDefined();
    });
  });

  // =========================================================================
  // HOLLAND CODE INTEREST MAPPING TESTS
  // =========================================================================
  describe('Holland Code Interest Profile', () => {
    beforeEach(async () => {
      await Interest.create([
        { name: 'Research', hollandCode: 'I', description: 'Investigation and discovery' },
        { name: 'Engineering', hollandCode: 'R', description: 'Building and making things' },
        { name: 'Teaching', hollandCode: 'S', description: 'Helping and guiding others' },
      ]);
    });

    test('should identify Holland Code profile from interests', async () => {
      const interests = await Interest.find();

      const response = await request(app)
        .post('/api/interests/holland-profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interestIds: [interests[0]._id, interests[2]._id],
        });

      expect(response.status).toBe(200);
      expect(response.body.hollandCode).toBeDefined();
    });

    test('should match interests to Holland Code domain', async () => {
      const response = await request(app)
        .get('/api/interests')
        .set('Authorization', `Bearer ${authToken}`);

      response.body.interests.forEach(interest => {
        expect(['R', 'I', 'A', 'S', 'E', 'C']).toContain(interest.hollandCode);
      });
    });
  });

  // =========================================================================
  // INTEREST EXPLORATION TESTS
  // =========================================================================
  describe('Interest Exploration', () => {
    beforeEach(async () => {
      await Interest.create([
        {
          name: 'Computer Science',
          hollandCode: 'I',
          relatedResources: ['Learn algorithms', 'Study data structures'],
          careerPathway: ['Junior Developer', 'Senior Developer', 'Tech Lead'],
        },
      ]);
    });

    test('should return learning resources for interest', async () => {
      const interests = await Interest.find();
      const response = await request(app)
        .get(`/api/interests/${interests[0]._id}/resources`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources).toBeDefined();
    });

    test('should show career pathway for interest', async () => {
      const interests = await Interest.find();
      const response = await request(app)
        .get(`/api/interests/${interests[0]._id}/career-pathway`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pathway).toBeDefined();
    });

    test('should recommend next steps based on interest', async () => {
      const interests = await Interest.find();

      await request(app)
        .post('/api/users/interests')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          interestId: interests[0]._id,
          level: 'High',
        });

      const response = await request(app)
        .get('/api/recommendations/next-steps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.steps).toBeDefined();
    });
  });

  // =========================================================================
  // INTEREST REMOVAL TESTS
  // =========================================================================
  describe('Remove Interest', () => {
    let interest;

    beforeEach(async () => {
      interest = await Interest.create({
        name: 'Deprecated Interest',
        hollandCode: 'E',
      });

      testUser.interests = [
        {
          interestId: interest._id,
          level: 'High',
          addedAt: new Date(),
        },
      ];
      await testUser.save();
    });

    test('should remove interest from user profile', async () => {
      const response = await request(app)
        .delete(`/api/users/interests/${interest._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.interests.length).toBe(0);
    });
  });

  // =========================================================================
  // INTEREST SEARCH TESTS
  // =========================================================================
  describe('Interest Search', () => {
    beforeEach(async () => {
      await Interest.create([
        { name: 'Web Development', hollandCode: 'I' },
        { name: 'Web Design', hollandCode: 'A' },
        { name: 'Game Development', hollandCode: 'I' },
      ]);
    });

    test('should search interests by name', async () => {
      const response = await request(app)
        .get('/api/interests?search=Web')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.interests.some(i => i.name.includes('Web'))).toBe(true);
    });

    test('should find interests by Holland Code', async () => {
      const response = await request(app)
        .get('/api/interests?hollandCode=I')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.interests.forEach(interest => {
        expect(interest.hollandCode).toBe('I');
      });
    });
  });
});
