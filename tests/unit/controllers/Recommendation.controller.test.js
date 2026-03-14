/**
 * Recommendation Controller Tests
 * Tests for career recommendations based on assessment results
 * Focus: Are recommendations accurate? Do they match Holland Code correctly?
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Recommendation = require('../../../models/Recommendation');
const Assessment = require('../../../models/Assessment');
const Career = require('../../../models/Career');
const User = require('../../../models/User');
const {
  testUsers,
  testCareers,
  generateId,
} = require('../../fixtures/testData');
const {
  cleanDatabase,
  createTestUser,
  getValidJWT,
} = require('../../helpers/testHelpers');

describe('Recommendation Controller', () => {
  let testUser;
  let authToken;
  let testAssessment;

  beforeEach(async () => {
    await cleanDatabase();

    testUser = await createTestUser('User');
    authToken = getValidJWT(testUser._id, 'User');

    // Create test careers with Holland Code profiles
    await Career.create([
      {
        name: 'Software Engineer',
        code: 'SE001',
        hollandCode: {
          realistic: 75,
          investigative: 85,
          artistic: 20,
          social: 30,
          enterprising: 50,
          conventional: 60,
        },
        salaryRange: {
          min: 600000,
          max: 2000000,
        },
        skills: [
          {
            name: 'Java',
            importance: 'essential',
          },
          {
            name: 'Problem Solving',
            importance: 'essential',
          },
        ],
      },
      {
        name: 'Product Manager',
        code: 'PM001',
        hollandCode: {
          realistic: 50,
          investigative: 60,
          artistic: 40,
          social: 80,
          enterprising: 85,
          conventional: 65,
        },
        salaryRange: {
          min: 800000,
          max: 2500000,
        },
        skills: [
          {
            name: 'Leadership',
            importance: 'essential',
          },
          {
            name: 'Communication',
            importance: 'essential',
          },
        ],
      },
      {
        name: 'UX Designer',
        code: 'UX001',
        hollandCode: {
          realistic: 50,
          investigative: 60,
          artistic: 90,
          social: 70,
          enterprising: 60,
          conventional: 40,
        },
        salaryRange: {
          min: 500000,
          max: 1500000,
        },
        skills: [
          {
            name: 'Design Thinking',
            importance: 'essential',
          },
          {
            name: 'Figma',
            importance: 'important',
          },
        ],
      },
      {
        name: 'Data Analyst',
        code: 'DA001',
        hollandCode: {
          realistic: 70,
          investigative: 95,
          artistic: 20,
          social: 40,
          enterprising: 50,
          conventional: 80,
        },
        salaryRange: {
          min: 400000,
          max: 1200000,
        },
        skills: [
          {
            name: 'SQL',
            importance: 'essential',
          },
          {
            name: 'Statistics',
            importance: 'essential',
          },
        ],
      },
    ]);

    // Create reference assessment
    testAssessment = await Assessment.create({
      userId: testUser._id,
      holandCode: {
        realistic: 80,
        investigative: 88,
        artistic: 25,
        social: 35,
        enterprising: 60,
        conventional: 65,
      },
    });
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // RECOMMENDATION GENERATION TESTS
  // =========================================================================
  describe('Recommendation Generation', () => {
    test('should generate recommendations for user assessment', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    test('should include all matched careers', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);
      expect(response.body.recommendations.length).toBeGreaterThan(0);
      expect(response.body.recommendations.length).toBeLessThanOrEqual(4);
    });

    test('should persist recommendations to database', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      const saved = await Recommendation.findOne({ userId: testUser._id });
      expect(saved).toBeDefined();
      expect(saved.userId.toString()).toBe(testUser._id.toString());
    });
  });

  // =========================================================================
  // MATCHING ACCURACY TESTS
  // =========================================================================
  describe('Holland Code Matching Accuracy', () => {
    test('should recommend Software Engineer as best match for I/R profile', async () => {
      // Assessment: High Investigative (88), High Realistic (80)
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      const softwareEngineer = response.body.recommendations.find(
        r => r.careerName === 'Software Engineer'
      );

      expect(softwareEngineer).toBeDefined();
      expect(softwareEngineer.matchScore).toBeGreaterThan(70);
      expect(softwareEngineer.rank).toBe(1);
    });

    test('should rank Data Analyst high for investigative minds', async () => {
      // Create very investigative assessment
      const invAssessment = await Assessment.create({
        userId: generateId(),
        holandCode: {
          investigative: 95, // Very high
          realistic: 75,
          conventional: 80,
          artistic: 20,
          social: 30,
          enterprising: 40,
        },
      });

      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: invAssessment._id,
        });

      const dataAnalyst = response.body.recommendations.find(
        r => r.careerName === 'Data Analyst'
      );

      expect(dataAnalyst).toBeDefined();
      expect(dataAnalyst.matchScore).toBeGreaterThan(75);
    });

    test('should rank Product Manager high for E/S profiles', async () => {
      // Create enterprising & social assessment
      const esAssessment = await Assessment.create({
        userId: generateId(),
        holandCode: {
          enterprising: 90, // Very high
          social: 88, // Very high
          realistic: 50,
          investigative: 60,
          artistic: 40,
          conventional: 70,
        },
      });

      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: esAssessment._id,
        });

      const productManager = response.body.recommendations.find(
        r => r.careerName === 'Product Manager'
      );

      expect(productManager).toBeDefined();
      expect(productManager.matchScore).toBeGreaterThan(75);
    });

    test('should rank UX Designer high for artistic minds', async () => {
      // Create artistic assessment
      const artAssessment = await Assessment.create({
        userId: generateId(),
        holandCode: {
          artistic: 95, // Very high
          realistic: 55,
          investigative: 50,
          social: 70,
          enterprising: 60,
          conventional: 45,
        },
      });

      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: artAssessment._id,
        });

      const uxDesigner = response.body.recommendations.find(
        r => r.careerName === 'UX Designer'
      );

      expect(uxDesigner).toBeDefined();
      expect(uxDesigner.matchScore).toBeGreaterThan(75);
    });

    test('should calculate match score based on domain differences', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.matchScore).toBeGreaterThan(0);
        expect(rec.matchScore).toBeLessThanOrEqual(100);
      });
    });

    test('should not recommend very poor matches', async () => {
      // Create opposite profile
      const oppositeAssessment = await Assessment.create({
        userId: generateId(),
        holandCode: {
          realistic: 10,
          investigative: 15,
          artistic: 10,
          social: 10,
          enterprising: 10,
          conventional: 10,
        },
      });

      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: oppositeAssessment._id,
        });

      expect(response.status).toBe(200);
      
      // All recommendations should be present but with lower scores
      response.body.recommendations.forEach(rec => {
        expect(rec.matchScore).toBeLessThan(50);
      });
    });
  });

  // =========================================================================
  // SKILL MATCHING TESTS
  // =========================================================================
  describe('Skill Matching', () => {
    test('should identify required vs optional skills', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.requiredSkills).toBeDefined();
        expect(rec.optionalSkills).toBeDefined();
      });
    });

    test('should estimate skill match percentage', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.skillMatchPercentage).toBeDefined();
        expect(rec.skillMatchPercentage).toBeGreaterThanOrEqual(0);
        expect(rec.skillMatchPercentage).toBeLessThanOrEqual(100);
      });
    });
  });

  // =========================================================================
  // SALARY & GROWTH PROJECTIONS
  // =========================================================================
  describe('Salary and Growth Information', () => {
    test('should include salary range in recommendations', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.salaryRange).toBeDefined();
        expect(rec.salaryRange.min).toBeGreaterThan(0);
        expect(rec.salaryRange.max).toBeGreaterThan(rec.salaryRange.min);
      });
    });

    test('should provide salary by experience level', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.salaryByExperience).toBeDefined();
        if (rec.salaryByExperience) {
          expect(rec.salaryByExperience.junior).toBeLessThan(rec.salaryByExperience.senior);
        }
      });
    });

    test('should show career growth trajectory', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.growthOutlook).toBeDefined();
        expect(['High', 'Medium', 'Low']).toContain(rec.growthOutlook);
      });
    });
  });

  // =========================================================================
  // LEARNING PATH TESTS
  // =========================================================================
  describe('Learning Paths', () => {
    test('should provide recommended learning path', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.learningPath).toBeDefined();
        expect(Array.isArray(rec.learningPath)).toBe(true);
      });
    });

    test('should include resource recommendations', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        if (rec.resources && rec.resources.length > 0) {
          rec.resources.forEach(resource => {
            expect(resource.title).toBeDefined();
            expect(resource.type).toBeDefined();
            expect(['course', 'book', 'article', 'project']).toContain(resource.type);
          });
        }
      });
    });

    test('should estimate learning timeline', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        if (rec.learningPath && rec.learningPath.length > 0) {
          rec.learningPath.forEach(step => {
            expect(step.estimatedHours).toBeDefined();
            expect(step.estimatedHours).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  // =========================================================================
  // CONFIDENCE & EXPLANATION TESTS
  // =========================================================================
  describe('Confidence and Explanations', () => {
    test('should provide confidence level for each recommendation', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.confidence).toBeDefined();
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
        expect(['High', 'Medium', 'Low']).toContain(rec.confidenceLabel);
      });
    });

    test('should explain why career is recommended', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.explanation).toBeDefined();
        expect(rec.explanation.length).toBeGreaterThan(0);
      });
    });

    test('should explain strengths and gaps', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);

      response.body.recommendations.forEach(rec => {
        expect(rec.alignedStrengths).toBeDefined();
        expect(rec.skillGaps).toBeDefined();
      });
    });
  });

  // =========================================================================
  // COMPARISON & FEEDBACK TESTS
  // =========================================================================
  describe('Recommendation Comparison', () => {
    test('should allow comparing two recommendations', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response.status).toBe(200);
      const recs = response.body.recommendations;

      if (recs.length >= 2) {
        const comparison = await request(app)
          .post('/api/recommendations/compare')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            careerIds: [recs[0].careerId, recs[1].careerId],
          });

        expect(comparison.status).toBe(200);
        expect(comparison.body.comparison).toBeDefined();
      }
    });

    test('should track user sentiment on recommendations', async () => {
      const rec = await Recommendation.create({
        userId: testUser._id,
        assessmentId: testAssessment._id,
        careerName: 'Software Engineer',
        matchScore: 85,
        confidence: 90,
      });

      const response = await request(app)
        .patch(`/api/recommendations/${rec._id}/feedback`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          useful: true,
          accurate: true,
          interested: true,
        });

      expect(response.status).toBe(200);
    });

    test('should allow user to mark action taken', async () => {
      const rec = await Recommendation.create({
        userId: testUser._id,
        assessmentId: testAssessment._id,
        careerName: 'Software Engineer',
        matchScore: 85,
      });

      const response = await request(app)
        .patch(`/api/recommendations/${rec._id}/action`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          actionType: 'internship_applied',
          actionDate: new Date(),
          details: 'Applied to TCS internship',
        });

      expect(response.status).toBe(200);
      expect(response.body.recommendation.actionTaken).toBe(true);
    });
  });

  // =========================================================================
  // RECOMMENDATION VERSIONING
  // =========================================================================
  describe('Recommendation Updates', () => {
    test('should allow user to request new recommendations', async () => {
      const response1 = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      expect(response1.status).toBe(200);
      const rec1Id = response1.body.recommendations[0]?.id;

      // Create new assessment
      const newAssessment = await Assessment.create({
        userId: testUser._id,
        holandCode: {
          realistic: 50,
          investigative: 50,
          artistic: 90,
          social: 80,
          enterprising: 70,
          conventional: 50,
        },
      });

      const response2 = await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: newAssessment._id,
        });

      expect(response2.status).toBe(200);
      const rec2Recs = response2.body.recommendations;

      // New recommendations should reflect updated assessment
      expect(rec2Recs).toBeDefined();
    });

    test('should keep history of recommendations', async () => {
      // Generate first recommendation
      await request(app)
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assessmentId: testAssessment._id,
        });

      // Get recommendation history
      const response = await request(app)
        .get('/api/recommendations/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.history)).toBe(true);
    });
  });

  // =========================================================================
  // ACCESS CONTROL
  // =========================================================================
  describe('Access Control', () => {
    test('should not allow accessing other users recommendations', async () => {
      const otherUser = await createTestUser('User');
      const otherAssessment = await Assessment.create({
        userId: otherUser._id,
        holandCode: { realistic: 50, investigative: 50, artistic: 50, social: 50, enterprising: 50, conventional: 50 },
      });
      const rec = await Recommendation.create({
        userId: otherUser._id,
        assessmentId: otherAssessment._id,
        careerName: 'Test Career',
      });

      const response = await request(app)
        .get(`/api/recommendations/${rec._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });

    test('should allow user to view their own recommendations', async () => {
      const rec = await Recommendation.create({
        userId: testUser._id,
        assessmentId: testAssessment._id,
        careerName: 'Software Engineer',
        matchScore: 85,
      });

      const response = await request(app)
        .get(`/api/recommendations/${rec._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });
});
