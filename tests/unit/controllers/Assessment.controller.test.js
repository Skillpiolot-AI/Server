/**
 * Assessment Controller Tests
 * Tests for Holland Code assessment calculation and career recommendations
 * Focus: Accuracy of assessment scoring and recommendation generation
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Assessment = require('../../../models/Assessment');
const Career = require('../../../models/Career');
const Recommendation = require('../../../models/Recommendation');
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

describe('Assessment Controller', () => {
  let server;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Server already started by jest.setup
  });

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser('User');
    authToken = getValidJWT(testUser._id, 'User');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // HOLLAND CODE CALCULATION TESTS
  // =========================================================================
  describe('Holland Code Scoring', () => {
    test('should calculate Holland Code correctly for all 6 domains', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 85,
          investigative: 90,
          artistic: 60,
          social: 75,
          enterprising: 88,
          conventional: 70,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      expect(response.body.assessment).toBeDefined();
      expect(response.body.assessment.holandCode).toEqual(assessmentData.holandCode);
    });

    test('should generate correct hollandCode string from domain scores', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 95,
          investigative: 85,
          artistic: 50,
          social: 60,
          enterprising: 75,
          conventional: 70,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      // Holland Code should be top 3 domains: R(95), I(85), E(75)
      expect(response.body.assessment.hollandCode).toMatch(/RIE|IER|ERI/);
    });

    test('should identify top three domains correctly', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 92,
          investigative: 88,
          artistic: 45,
          social: 50,
          enterprising: 90,
          conventional: 60,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      const assessment = response.body.assessment;
      expect(assessment.topThreeDomains).toBeDefined();
      expect(assessment.topThreeDomains.length).toBe(3);
      expect(assessment.topThreeDomains[0]).toBe('E'); // Enterprising (90)
      expect(assessment.topThreeDomains[1]).toBe('R'); // Realistic (92)
      expect(assessment.topThreeDomains[2]).toBe('I'); // Investigative (88)
    });

    test('should normalize scores to percentages', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 80,
          investigative: 80,
          artistic: 80,
          social: 80,
          enterprising: 80,
          conventional: 80,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      const assessment = response.body.assessment;
      expect(assessment.hollandCodePercentages).toBeDefined();
      Object.values(assessment.hollandCodePercentages).forEach(percentage => {
        expect(percentage).toBeGreaterThan(0);
        expect(percentage).toBeLessThanOrEqual(100);
      });
    });

    test('should handle edge case: all scores equal', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 75,
          investigative: 75,
          artistic: 75,
          social: 75,
          enterprising: 75,
          conventional: 75,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      expect(response.body.assessment.topThreeDomains).toBeDefined();
    });

    test('should handle edge case: one very high score', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 100,
          investigative: 10,
          artistic: 10,
          social: 10,
          enterprising: 10,
          conventional: 10,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      expect(response.body.assessment.topThreeDomains[0]).toBe('R');
    });
  });

  // =========================================================================
  // CAREER RECOMMENDATION ACCURACY TESTS
  // =========================================================================
  describe('Career Recommendations', () => {
    beforeEach(async () => {
      // Create test careers with Holland Code mapping
      await Career.create([
        {
          name: 'Software Engineer',
          code: 'SE001',
          hollandCode: {
            realistic: 80,
            investigative: 90,
            artistic: 20,
            social: 30,
            enterprising: 50,
            conventional: 60,
          },
          salaryRange: {
            min: 500000,
            max: 2000000,
          },
        },
        {
          name: 'Accountant',
          code: 'AC001',
          hollandCode: {
            realistic: 40,
            investigative: 60,
            artistic: 20,
            social: 50,
            enterprising: 60,
            conventional: 90,
          },
          salaryRange: {
            min: 300000,
            max: 1000000,
          },
        },
        {
          name: 'Graphic Designer',
          code: 'GD001',
          hollandCode: {
            realistic: 50,
            investigative: 40,
            artistic: 95,
            social: 60,
            enterprising: 50,
            conventional: 30,
          },
          salaryRange: {
            min: 250000,
            max: 800000,
          },
        },
      ]);
    });

    test('should recommend Software Engineer for investigative/realistic profile', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          investigative: 95,
          realistic: 92,
          enterprising: 70,
          artistic: 20,
          social: 30,
          conventional: 50,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      const assessment = response.body.assessment;
      expect(assessment.recommendedCareers).toBeDefined();
      
      // Software Engineer should be top recommendation
      const softwareEngineering = assessment.recommendedCareers.find(
        c => c.name === 'Software Engineer'
      );
      expect(softwareEngineering).toBeDefined();
      expect(softwareEngineering.matchScore).toBeGreaterThan(70);
    });

    test('should recommend Accountant for conventional/enterprising profile', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          conventional: 95,
          enterprising: 88,
          realistic: 60,
          social: 70,
          investigative: 50,
          artistic: 20,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      const assessment = response.body.assessment;
      
      const accountant = assessment.recommendedCareers.find(c => c.name === 'Accountant');
      expect(accountant).toBeDefined();
      expect(accountant.matchScore).toBeGreaterThan(70);
    });

    test('should recommend careers in order of match score', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          artistic: 90,
          investigative: 70,
          realistic: 60,
          enterprising: 50,
          social: 60,
          conventional: 40,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      const careers = response.body.assessment.recommendedCareers;
      
      // Should be sorted by match score (descending)
      for (let i = 0; i < careers.length - 1; i++) {
        expect(careers[i].matchScore).toBeGreaterThanOrEqual(careers[i + 1].matchScore);
      }
    });

    test('should include salary information in recommendations', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          investigative: 95,
          realistic: 90,
          enterprising: 70,
          artistic: 20,
          social: 30,
          conventional: 50,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      const careers = response.body.assessment.recommendedCareers;
      
      careers.forEach(career => {
        expect(career.salaryRange).toBeDefined();
        expect(career.salaryRange.min).toBeGreaterThan(0);
        expect(career.salaryRange.max).toBeGreaterThan(career.salaryRange.min);
      });
    });

    test('should not recommend careers with very low match scores', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 95,
          investigative: 90,
          artistic: 10,
          social: 10,
          enterprising: 10,
          conventional: 10,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);
      const graphicDesigner = response.body.assessment.recommendedCareers.find(
        c => c.name === 'Graphic Designer'
      );
      
      if (graphicDesigner) {
        expect(graphicDesigner.matchScore).toBeLessThan(30);
      }
    });
  });

  // =========================================================================
  // ASSESSMENT PERSISTENCE TESTS
  // =========================================================================
  describe('Assessment Persistence', () => {
    test('should save assessment to database', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 85,
          investigative: 90,
          artistic: 60,
          social: 75,
          enterprising: 88,
          conventional: 70,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(200);

      // Verify in database
      const savedAssessment = await Assessment.findById(response.body.assessment._id);
      expect(savedAssessment).toBeDefined();
      expect(savedAssessment.userId.toString()).toBe(testUser._id.toString());
      expect(savedAssessment.holandCode.investigative).toBe(90);
    });

    test('should update existing assessment for same user', async () => {
      const firstAssessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 70,
          investigative: 70,
          artistic: 70,
          social: 70,
          enterprising: 70,
          conventional: 70,
        },
      };

      const firstResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(firstAssessmentData);

      const secondAssessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 90,
          investigative: 85,
          artistic: 50,
          social: 60,
          enterprising: 80,
          conventional: 75,
        },
      };

      const secondResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAssessmentData);

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.assessment._id.toString())
        .toBe(firstResponse.body.assessment._id.toString());
      
      expect(secondResponse.body.assessment.holandCode.realistic).toBe(90);
    });

    test('should track assessment history', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 85,
          investigative: 90,
          artistic: 60,
          social: 75,
          enterprising: 88,
          conventional: 70,
        },
      };

      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      const getResponse = await request(app)
        .get('/api/assessments/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(Array.isArray(getResponse.body.assessments)).toBe(true);
    });
  });

  // =========================================================================
  // ASSESSMENT VALIDATION TESTS
  // =========================================================================
  describe('Assessment Validation', () => {
    test('should reject assessment with missing Holland Code domains', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 85,
          investigative: 90,
          // Missing artistic, social, enterprising, conventional
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(400);
    });

    test('should reject assessment with invalid scores (not 0-100)', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 150,
          investigative: 90,
          artistic: 60,
          social: 75,
          enterprising: 88,
          conventional: 70,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(400);
    });

    test('should validate minimum and maximum score values', async () => {
      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: -10,
          investigative: 90,
          artistic: 60,
          social: 75,
          enterprising: 88,
          conventional: 70,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      expect(response.status).toBe(400);
    });

    test('should allow only user to access their own assessment', async () => {
      const otherUser = await createTestUser('User');
      const otherToken = getValidJWT(otherUser._id, 'User');

      const assessmentData = {
        userId: testUser._id,
        holandCode: {
          realistic: 85,
          investigative: 90,
          artistic: 60,
          social: 75,
          enterprising: 88,
          conventional: 70,
        },
      };

      await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assessmentData);

      const response = await request(app)
        .get(`/api/assessments/${testUser._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // IMPROVEMENT TRACKING TESTS
  // =========================================================================
  describe('Assessment Improvements', () => {
    test('should track improvement in domains over time', async () => {
      // First assessment
      const first = {
        userId: testUser._id,
        holandCode: {
          realistic: 50,
          investigative: 50,
          artistic: 50,
          social: 50,
          enterprising: 50,
          conventional: 50,
        },
      };

      const firstResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(first);

      // Second assessment (improved)
      const second = {
        userId: testUser._id,
        holandCode: {
          realistic: 80,
          investigative: 85,
          artistic: 60,
          social: 70,
          enterprising: 75,
          conventional: 65,
        },
      };

      const secondResponse = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(second);

      expect(secondResponse.status).toBe(200);
      const assessment = secondResponse.body.assessment;
      
      expect(assessment.improvements).toBeDefined();
      expect(assessment.improvements.realistic).toBe(30); // 80 - 50
      expect(assessment.improvements.investigative).toBe(35); // 85 - 50
    });

    test('should calculate domain growth trends', async () => {
      // Create multiple assessments
      const scores = [
        { realistic: 40, investigative: 40, artistic: 40, social: 40, enterprising: 40, conventional: 40 },
        { realistic: 60, investigative: 70, artistic: 50, social: 50, enterprising: 60, conventional: 50 },
        { realistic: 80, investigative: 90, artistic: 60, social: 60, enterprising: 75, conventional: 60 },
      ];

      for (const holandCode of scores) {
        await request(app)
          .post('/api/assessments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ userId: testUser._id, holandCode });
      }

      const response = await request(app)
        .get('/api/assessments/my/trends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.trends).toBeDefined();
    });
  });
});
