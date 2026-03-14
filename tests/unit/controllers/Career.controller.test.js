/**
 * Career Controller Tests
 * Tests for career data management and career discovery features
 * Focus: Career profiles, salary ranges, skill requirements
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Career = require('../../../models/Career');
const User = require('../../../models/User');
const { testUsers, testCareers } = require('../../fixtures/testData');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Career Controller', () => {
  let testUser;
  let authToken;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({ role: 'User' });
    authToken = getValidJWT(testUser._id, 'User');
    adminUser = await createTestUser({ role: 'Admin' });
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // CAREER RETRIEVAL TESTS
  // =========================================================================
  describe('Get Careers', () => {
    beforeEach(async () => {
      await Career.create([
        {
          name: 'Software Engineer',
          code: 'SE001',
          category: 'Technology',
          salary: { min: 60000, max: 150000, currency: 'USD' },
          hollandCode: { R: 40, I: 90, A: 20, S: 35, E: 50, C: 45 },
        },
        {
          name: 'Data Scientist',
          code: 'DS001',
          category: 'Technology',
          salary: { min: 80000, max: 180000, currency: 'USD' },
          hollandCode: { R: 45, I: 95, A: 30, S: 40, E: 60, C: 55 },
        },
      ]);
    });

    test('should retrieve all careers', async () => {
      const response = await request(app)
        .get('/api/careers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.careers).toBeDefined();
      expect(response.body.careers.length).toBeGreaterThan(0);
    });

    test('should filter careers by category', async () => {
      const response = await request(app)
        .get('/api/careers?category=Technology')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.careers.forEach(career => {
        expect(career.category).toBe('Technology');
      });
    });

    test('should search careers by name', async () => {
      const response = await request(app)
        .get('/api/careers?search=Software')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.careers.some(c => c.name.includes('Software'))).toBe(true);
    });

    test('should return career with salary information', async () => {
      const response = await request(app)
        .get('/api/careers')
        .set('Authorization', `Bearer ${authToken}`);

      const career = response.body.careers[0];
      expect(career.salary).toBeDefined();
      expect(career.salary.min).toBeGreaterThan(0);
      expect(career.salary.max).toBeGreaterThan(career.salary.min);
    });

    test('should include Holland Code profile in career', async () => {
      const response = await request(app)
        .get('/api/careers')
        .set('Authorization', `Bearer ${authToken}`);

      const career = response.body.careers[0];
      expect(career.hollandCode).toBeDefined();
      expect(career.hollandCode.I).toBeDefined();
    });

    test('should get single career by ID', async () => {
      const careers = await Career.find();
      const response = await request(app)
        .get(`/api/careers/${careers[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.career._id.toString()).toBe(careers[0]._id.toString());
    });

    test('should return 404 for non-existent career', async () => {
      const response = await request(app)
        .get(`/api/careers/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // CAREER CREATION (ADMIN ONLY) TESTS
  // =========================================================================
  describe('Create Career (Admin Only)', () => {
    test('should create career with valid data (admin only)', async () => {
      const careerData = {
        name: 'Product Manager',
        code: 'PM001',
        category: 'Management',
        salary: { min: 100000, max: 200000, currency: 'USD' },
        hollandCode: { R: 30, I: 70, A: 50, S: 80, E: 90, C: 60 },
        skills: ['Leadership', 'Communication', 'Analytics'],
      };

      const response = await request(app)
        .post('/api/careers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(careerData);

      expect(response.status).toBe(201);
      expect(response.body.career.name).toBe('Product Manager');
      expect(response.body.career.code).toBe('PM001');
    });

    test('should reject career creation for non-admin', async () => {
      const careerData = {
        name: 'UX Designer',
        code: 'UX001',
        category: 'Design',
      };

      const response = await request(app)
        .post('/api/careers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(careerData);

      expect(response.status).toBe(403);
    });

    test('should validate required fields', async () => {
      const incompleteData = { category: 'Technology' };

      const response = await request(app)
        .post('/api/careers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
    });

    test('should prevent duplicate career codes', async () => {
      const careerData = {
        name: 'Career 1',
        code: 'UNIQUE001',
        category: 'Tech',
      };

      await request(app)
        .post('/api/careers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(careerData);

      const duplicateData = {
        name: 'Career 2',
        code: 'UNIQUE001', // Same code
        category: 'Tech',
      };

      const response = await request(app)
        .post('/api/careers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // CAREER UPDATE TESTS
  // =========================================================================
  describe('Update Career', () => {
    let career;

    beforeEach(async () => {
      career = await Career.create({
        name: 'Junior Developer',
        code: 'JD001',
        category: 'Technology',
        salary: { min: 40000, max: 80000, currency: 'USD' },
      });
    });

    test('should update career salary (admin only)', async () => {
      const response = await request(app)
        .put(`/api/careers/${career._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ salary: { min: 50000, max: 100000, currency: 'USD' } });

      expect(response.status).toBe(200);
      expect(response.body.career.salary.min).toBe(50000);
    });

    test('should update career skills required', async () => {
      const response = await request(app)
        .put(`/api/careers/${career._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ skills: ['JavaScript', 'React', 'Node.js'] });

      expect(response.status).toBe(200);
      expect(response.body.career.skills).toContain('JavaScript');
    });

    test('should not allow non-admin to update career', async () => {
      const response = await request(app)
        .put(`/api/careers/${career._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ salary: { min: 90000, max: 200000, currency: 'USD' } });

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // CAREER SALARY PROJECTION TESTS
  // =========================================================================
  describe('Salary Information by Experience', () => {
    beforeEach(async () => {
      await Career.create({
        name: 'Software Engineer',
        code: 'SE001',
        salary: { min: 60000, max: 150000, currency: 'USD' },
        salaryByExperience: {
          junior: { min: 60000, max: 80000 },
          mid: { min: 80000, max: 120000 },
          senior: { min: 120000, max: 150000 },
        },
      });
    });

    test('should return salary range for junior level', async () => {
      const careers = await Career.find({ name: 'Software Engineer' });
      const response = await request(app)
        .get(`/api/careers/${careers[0]._id}?experienceLevel=junior`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.career.salaryByExperience.junior).toBeDefined();
    });

    test('should show salary growth from junior to senior', async () => {
      const careers = await Career.find({ name: 'Software Engineer' });
      const career = careers[0];

      expect(career.salaryByExperience.junior.max).toBeLessThan(
        career.salaryByExperience.senior.min
      );
    });

    test('should return salary trends over years', async () => {
      const response = await request(app)
        .get('/api/careers/salary-trends?category=Technology')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.trends).toBeDefined();
    });
  });

  // =========================================================================
  // CAREER MATCHING TESTS
  // =========================================================================
  describe('Career Matching', () => {
    beforeEach(async () => {
      await Career.create([
        {
          name: 'Data Analyst',
          hollandCode: { R: 50, I: 85, A: 30, S: 40, E: 50, C: 70 },
          skills: ['SQL', 'Python', 'Statistics'],
        },
        {
          name: 'Artist',
          hollandCode: { R: 20, I: 40, A: 95, S: 60, E: 50, C: 30 },
          skills: ['Drawing', 'Design', 'Creativity'],
        },
      ]);
    });

    test('should find careers matching Holland Code profile', async () => {
      const response = await request(app)
        .post('/api/careers/match')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hollandCode: { R: 45, I: 90, A: 25, S: 35, E: 45, C: 65 },
        });

      expect(response.status).toBe(200);
      expect(response.body.matches).toBeDefined();
    });

    test('should rank matches by score', async () => {
      const response = await request(app)
        .post('/api/careers/match')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hollandCode: { R: 50, I: 85, A: 30, S: 40, E: 50, C: 70 },
        });

      expect(response.status).toBe(200);
      const matches = response.body.matches;
      if (matches.length > 1) {
        expect(matches[0].matchScore).toBeGreaterThanOrEqual(matches[1].matchScore);
      }
    });
  });

  // =========================================================================
  // CAREER DELETION TESTS
  // =========================================================================
  describe('Delete Career', () => {
    let career;

    beforeEach(async () => {
      career = await Career.create({
        name: 'Obsolete Role',
        code: 'OBS001',
        category: 'Deprecated',
      });
    });

    test('should delete career (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/careers/${career._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletedCareer = await Career.findById(career._id);
      expect(deletedCareer).toBeNull();
    });

    test('should not allow non-admin to delete career', async () => {
      const response = await request(app)
        .delete(`/api/careers/${career._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // PAGINATION TESTS
  // =========================================================================
  describe('Pagination', () => {
    beforeEach(async () => {
      const careers = Array.from({ length: 25 }, (_, i) => ({
        name: `Career ${i + 1}`,
        code: `CAREER${i + 1}`,
        category: 'Tech',
      }));
      await Career.create(careers);
    });

    test('should return paginated results', async () => {
      const response = await request(app)
        .get('/api/careers?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.careers.length).toBeLessThanOrEqual(10);
      expect(response.body.pagination.page).toBe(1);
    });

    test('should handle page 2', async () => {
      const response = await request(app)
        .get('/api/careers?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
    });
  });
});
