/**
 * Strength Controller Tests
 * Tests for strength assessment and development tracking
 * Focus: Strength categories, manifestations, and career relevance
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Strength = require('../../../models/Strength');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Strength Controller', () => {
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
  // STRENGTH RETRIEVAL TESTS
  // =========================================================================
  describe('Get Strengths', () => {
    beforeEach(async () => {
      await Strength.create([
        {
          name: 'Leadership',
          category: 'Interpersonal',
          manifestations: ['Influencing', 'Taking charge', 'Motivating'],
        },
        {
          name: 'Problem Solving',
          category: 'Cognitive',
          manifestations: ['Analyzing', 'Creating solutions', 'Critical thinking'],
        },
      ]);
    });

    test('should retrieve all strengths', async () => {
      const response = await request(app)
        .get('/api/strengths')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.strengths.length).toBeGreaterThan(0);
    });

    test('should get single strength by ID', async () => {
      const strengths = await Strength.find();
      const response = await request(app)
        .get(`/api/strengths/${strengths[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.strength.name).toBe(strengths[0].name);
    });

    test('should include manifestations of strength', async () => {
      const response = await request(app)
        .get('/api/strengths')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.strengths[0].manifestations).toBeDefined();
      expect(Array.isArray(response.body.strengths[0].manifestations)).toBe(true);
    });
  });

  // =========================================================================
  // USER STRENGTH ASSESSMENT TESTS
  // =========================================================================
  describe('User Strength Assessment', () => {
    let strength;

    beforeEach(async () => {
      strength = await Strength.create({
        name: 'Creativity',
        category: 'Creative',
        manifestations: ['Imagination', 'Innovation', 'Artistic thinking'],
      });
    });

    test('should add strength to user profile', async () => {
      const response = await request(app)
        .post('/api/users/strengths')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          strengthId: strength._id,
          level: 'Advanced',
          evidence: 'Has led 3 successful design projects',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.strengths.length).toBeGreaterThan(0);
    });

    test('should track strength development level', async () => {
      await request(app)
        .post('/api/users/strengths')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          strengthId: strength._id,
          level: 'Beginner',
          evidence: 'Recent training completed',
        });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const userStrength = response.body.user.strengths.find(
        s => s.strengthId?.toString() === strength._id.toString()
      );
      expect(userStrength.level).toBe('Beginner');
    });

    test('should update strength development level', async () => {
      await request(app)
        .post('/api/users/strengths')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          strengthId: strength._id,
          level: 'Intermediate',
        });

      const response = await request(app)
        .put(`/api/users/strengths/${strength._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ level: 'Advanced' });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // STRENGTH-CAREER MATCHING TESTS
  // =========================================================================
  describe('Strength to Career Mapping', () => {
    beforeEach(async () => {
      await Strength.create([
        {
          name: 'Analytical Thinking',
          category: 'Cognitive',
          relatedCareers: ['Data Scientist', 'Business Analyst', 'Researcher'],
        },
        {
          name: 'Empathy',
          category: 'Interpersonal',
          relatedCareers: ['Counselor', 'Nurse', 'Teacher', 'HR Manager'],
        },
      ]);
    });

    test('should return careers related to strength', async () => {
      const strengths = await Strength.find({ name: 'Analytical Thinking' });
      const response = await request(app)
        .get(`/api/strengths/${strengths[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.strength.relatedCareers).toBeDefined();
      expect(response.body.strength.relatedCareers.length).toBeGreaterThan(0);
    });

    test('should suggest careers based on user strengths', async () => {
      const strengths = await Strength.find();
      await request(app)
        .post('/api/users/strengths')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          strengthId: strengths[0]._id,
          level: 'Advanced',
        });

      const response = await request(app)
        .get('/api/recommendations/by-strengths')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.careerSuggestions).toBeDefined();
    });
  });

  // =========================================================================
  // STRENGTH DEVELOPMENT TESTS
  // =========================================================================
  describe('Strength Development Tracking', () => {
    let strength;

    beforeEach(async () => {
      strength = await Strength.create({
        name: 'Communication',
        category: 'Interpersonal',
        developmentTips: ['Public speaking practice', 'Toastmasters', 'Writing workshops'],
      });

      testUser.strengths = [
        {
          strengthId: strength._id,
          level: 'Beginner',
          addedAt: new Date('2024-01-01'),
          developmentLog: [],
        },
      ];
      await testUser.save();
    });

    test('should log strength development progress', async () => {
      const response = await request(app)
        .post(`/api/users/strengths/${strength._id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          activity: 'Completed Toastmasters course',
          date: new Date(),
          impact: 'Intermediate',
        });

      expect(response.status).toBe(200);
      expect(response.body.user.strengths[0].developmentLog.length).toBeGreaterThan(0);
    });

    test('should show development recommendations for strength', async () => {
      const response = await request(app)
        .get(`/api/strengths/${strength._id}/development`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.recommendations).toBeDefined();
    });

    test('should track improvement over time', async () => {
      const response = await request(app)
        .get('/api/users/strength-progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.progressData).toBeDefined();
    });
  });

  // =========================================================================
  // STRENGTH CATEGORY TESTS
  // =========================================================================
  describe('Strength Categories', () => {
    beforeEach(async () => {
      await Strength.create([
        { name: 'Teamwork', category: 'Interpersonal', manifestations: ['Collaboration'] },
        { name: 'Data Analysis', category: 'Technical', manifestations: ['Statistics'] },
        { name: 'Resilience', category: 'Behavioral', manifestations: ['Perseverance'] },
      ]);
    });

    test('should filter strengths by category', async () => {
      const response = await request(app)
        .get('/api/strengths?category=Technical')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.strengths.forEach(strength => {
        expect(strength.category).toBe('Technical');
      });
    });

    test('should return strengths in each category', async () => {
      const response = await request(app)
        .get('/api/strengths/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.categories).toBeDefined();
    });
  });

  // =========================================================================
  // STRENGTH REMOVAL TESTS
  // =========================================================================
  describe('Remove Strength', () => {
    let strength;

    beforeEach(async () => {
      strength = await Strength.create({
        name: 'Old Strength',
        category: 'Deprecated',
      });

      testUser.strengths = [
        {
          strengthId: strength._id,
          level: 'Intermediate',
          addedAt: new Date(),
        },
      ];
      await testUser.save();
    });

    test('should remove strength from user profile', async () => {
      const response = await request(app)
        .delete(`/api/users/strengths/${strength._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.strengths.length).toBe(0);
    });
  });
});
