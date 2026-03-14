/**
 * Resource Controller Tests
 * Tests for learning resource management and sharing
 * Focus: Resource creation, categorization, usage tracking
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Resource = require('../../../models/Resource');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Resource Controller', () => {
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
  // RESOURCE RETRIEVAL TESTS
  // =========================================================================
  describe('Get Resources', () => {
    beforeEach(async () => {
      await Resource.create([
        {
          title: 'JavaScript Fundamentals',
          type: 'Course',
          category: 'Programming',
          url: 'https://example.com/js-course',
          difficulty: 'Beginner',
          creator: new mongoose.Types.ObjectId(),
        },
        {
          title: 'Design Patterns Book',
          type: 'Book',
          category: 'Software Design',
          url: 'https://example.com/design-patterns',
          difficulty: 'Advanced',
          creator: new mongoose.Types.ObjectId(),
        },
      ]);
    });

    test('should retrieve all resources', async () => {
      const response = await request(app)
        .get('/api/resources')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources.length).toBeGreaterThan(0);
    });

    test('should get single resource by ID', async () => {
      const resources = await Resource.find();
      const response = await request(app)
        .get(`/api/resources/${resources[0]._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resource.title).toBeDefined();
    });

    test('should filter resources by type', async () => {
      const response = await request(app)
        .get('/api/resources?type=Course')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.resources.forEach(r => {
        expect(r.type).toBe('Course');
      });
    });

    test('should filter resources by category', async () => {
      const response = await request(app)
        .get('/api/resources?category=Programming')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('should filter by difficulty level', async () => {
      const response = await request(app)
        .get('/api/resources?difficulty=Beginner')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      response.body.resources.forEach(r => {
        expect(r.difficulty).toBe('Beginner');
      });
    });
  });

  // =========================================================================
  // RESOURCE CREATION TESTS
  // =========================================================================
  describe('Create Resource', () => {
    test('should create resource for any authenticated user', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'New Learning Resource',
          type: 'Article',
          category: 'Career Development',
          url: 'https://example.com/resource',
          difficulty: 'Intermediate',
          description: 'A useful learning resource',
        });

      expect(response.status).toBe(201);
      expect(response.body.resource.title).toBe('New Learning Resource');
      expect(response.body.resource.creator.toString()).toBe(testUser._id.toString());
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/resources')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Missing title, type, url
          category: 'Programming',
        });

      expect(response.status).toBe(400);
    });

    test('should reject unauthenticated resource creation', async () => {
      const response = await request(app).post('/api/resources').send({
        title: 'Resource',
        type: 'Course',
        category: 'Tech',
        url: 'https://example.com',
      });

      expect(response.status).toBe(401);
    });
  });

  // =========================================================================
  // RESOURCE SEARCH & DISCOVERY TESTS
  // =========================================================================
  describe('Resource Search', () => {
    beforeEach(async () => {
      await Resource.create([
        {
          title: 'Python Programming',
          type: 'Course',
          category: 'Programming',
          tags: ['Python', 'Backend'],
          url: 'https://example.com/python',
          creator: adminUser._id,
        },
        {
          title: 'Python Web Development',
          type: 'Tutorial',
          category: 'Web Development',
          tags: ['Python', 'Web'],
          url: 'https://example.com/py-web',
          creator: adminUser._id,
        },
      ]);
    });

    test('should search resources by keyword', async () => {
      const response = await request(app)
        .get('/api/resources?search=Python')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources.some(r => r.title.includes('Python'))).toBe(true);
    });

    test('should search by tags', async () => {
      const response = await request(app)
        .get('/api/resources?tags=Backend')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('should return resources by creator', async () => {
      const response = await request(app)
        .get(`/api/resources?creator=${adminUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // RESOURCE USAGE TRACKING TESTS
  // =========================================================================
  describe('Resource Usage Tracking', () => {
    let resource;

    beforeEach(async () => {
      resource = await Resource.create({
        title: 'Popular Resource',
        type: 'Course',
        category: 'Programming',
        url: 'https://example.com/popular',
        creator: adminUser._id,
        views: 100,
        downloads: 50,
      });
    });

    test('should track resource views', async () => {
      const response = await request(app)
        .post(`/api/resources/${resource._id}/view`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resource.views).toBeGreaterThan(100);
    });

    test('should track resource downloads', async () => {
      const response = await request(app)
        .post(`/api/resources/${resource._id}/download`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resource.downloads).toBeGreaterThan(50);
    });

    test('should return popular resources', async () => {
      const response = await request(app)
        .get('/api/resources/trending/popular')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resources).toBeDefined();
    });
  });

  // =========================================================================
  // RESOURCE UPDATE & DELETE TESTS
  // =========================================================================
  describe('Update & Delete Resources', () => {
    let resource;

    beforeEach(async () => {
      resource = await Resource.create({
        title: 'Updatable Resource',
        type: 'Article',
        category: 'Tech',
        url: 'https://example.com/article',
        creator: testUser._id,
      });
    });

    test('should update own resource', async () => {
      const response = await request(app)
        .put(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          category: 'Programming',
        });

      expect(response.status).toBe(200);
      expect(response.body.resource.title).toBe('Updated Title');
    });

    test('should not allow update of others resource', async () => {
      const otherUser = await createTestUser({ role: 'User' });
      const otherToken = getValidJWT(otherUser._id, 'User');

      const response = await request(app)
        .put(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(response.status).toBe(403);
    });

    test('should delete own resource', async () => {
      const response = await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);

      const deleted = await Resource.findById(resource._id);
      expect(deleted).toBeNull();
    });

    test('should allow admin to delete any resource', async () => {
      const response = await request(app)
        .delete(`/api/resources/${resource._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // RESOURCE RATING & REVIEWS TESTS
  // =========================================================================
  describe('Resource Ratings & Reviews', () => {
    let resource;

    beforeEach(async () => {
      resource = await Resource.create({
        title: 'Reviewable Resource',
        type: 'Course',
        category: 'Tech',
        url: 'https://example.com/course',
        creator: adminUser._id,
        avgRating: 4.5,
        totalReviews: 10,
      });
    });

    test('should rate resource', async () => {
      const response = await request(app)
        .post(`/api/resources/${resource._id}/rate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          review: 'Great resource!',
        });

      expect(response.status).toBe(200);
      expect(response.body.resource.avgRating).toBeDefined();
    });

    test('should get resource reviews', async () => {
      const response = await request(app)
        .get(`/api/resources/${resource._id}/reviews`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reviews).toBeDefined();
    });

    test('should allow rating from 1-5', async () => {
      const validRatings = [1, 2, 3, 4, 5];

      for (const rating of validRatings) {
        const newUser = await createTestUser({ role: 'User' });
        const newToken = getValidJWT(newUser._id, 'User');

        const response = await request(app)
          .post(`/api/resources/${resource._id}/rate`)
          .set('Authorization', `Bearer ${newToken}`)
          .send({ rating });

        expect(response.status).toBe(200);
      }
    });
  });
});
