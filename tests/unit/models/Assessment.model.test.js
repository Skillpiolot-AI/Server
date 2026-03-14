/**
 * Assessment Model Tests
 * Tests for career assessment schema and Holland Code scoring
 */

const mongoose = require('mongoose');
const Assessment = require('../../../models/Assessment');
const User = require('../../../models/User');
const { testAssessments, generateId } = require('../../fixtures/testData');
const { cleanDatabase, createTestUser } = require('../../helpers/testHelpers');

describe('Assessment Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid assessment with required fields', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([
          ['R1', 5],
          ['R2', 4],
          ['I1', 4],
          ['I2', 3],
        ]),
      });

      expect(assessment._id).toBeDefined();
      expect(assessment.userId).toBe('test-user-123');
      expect(assessment.answers).toBeDefined();
    });

    test('should fail validation when userId is missing', async () => {
      const assessmentData = {
        answers: new Map([['R1', 5]]),
        // Missing userId
      };

      await expect(Assessment.create(assessmentData)).rejects.toThrow();
    });

    test('should fail validation when answers are missing', async () => {
      const assessmentData = {
        userId: 'test-user-123',
        // Missing answers
      };

      await expect(Assessment.create(assessmentData)).rejects.toThrow();
    });

    test('should set default completedAt to current date', async () => {
      const beforeCreate = Date.now();
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
      });
      const afterCreate = Date.now();

      expect(assessment.completedAt).toBeDefined();
      expect(assessment.completedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(assessment.completedAt.getTime()).toBeLessThanOrEqual(afterCreate + 1000);
    });
  });

  // =========================================================================
  // HOLLAND CODE DOMAIN SCORES TESTS
  // =========================================================================

  describe('Holland Code Domain Scores', () => {
    test('should store domainScores with all 6 domains', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          domainScores: {
            R: 25,
            I: 20,
            A: 15,
            S: 18,
            E: 12,
            C: 20,
          },
        },
      });

      expect(assessment.results.domainScores.R).toBe(25);
      expect(assessment.results.domainScores.I).toBe(20);
      expect(assessment.results.domainScores.A).toBe(15);
      expect(assessment.results.domainScores.S).toBe(18);
      expect(assessment.results.domainScores.E).toBe(12);
      expect(assessment.results.domainScores.C).toBe(20);
    });

    test('should store domain percentages', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          domainScores: {
            R: 25,
            I: 20,
            A: 15,
            S: 18,
            E: 12,
            C: 20,
          },
          percentages: {
            R: 22,
            I: 18,
            A: 14,
            S: 16,
            E: 11,
            C: 18,
          },
        },
      });

      expect(assessment.results.percentages.R).toBe(22);
      expect(assessment.results.percentages.I).toBe(18);
    });

    test('should store hollandCode (top 3 letters)', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          hollandCode: 'RIA',
          topThreeDomains: ['R', 'I', 'A'],
        },
      });

      expect(assessment.results.hollandCode).toBe('RIA');
      expect(assessment.results.topThreeDomains).toEqual(['R', 'I', 'A']);
    });

    test('should accept valid holland codes', async () => {
      const validCodes = ['RIA', 'IRA', 'REC', 'SEC', 'ASE', 'IAC'];

      for (const code of validCodes) {
        const assessment = await Assessment.create({
          userId: `test-user-${code}`,
          answers: new Map([['R1', 5]]),
          results: {
            hollandCode: code,
          },
        });

        expect(assessment.results.hollandCode).toBe(code);
        await Assessment.deleteOne({ _id: assessment._id });
      }
    });
  });

  // =========================================================================
  // RECOMMENDED CAREERS TESTS
  // =========================================================================

  describe('Recommended Careers', () => {
    test('should store recommended careers with match scores', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          recommendedCareers: [
            {
              careerId: 1,
              name: 'Software Engineer',
              cluster: 'Technology',
              matchScore: 92,
              career_type: 'Tech',
              holland_codes: ['R', 'I', 'C'],
            },
            {
              careerId: 2,
              name: 'Data Scientist',
              cluster: 'Technology',
              matchScore: 87,
              career_type: 'Tech',
              holland_codes: ['I', 'R', 'C'],
            },
          ],
        },
      });

      expect(assessment.results.recommendedCareers).toHaveLength(2);
      expect(assessment.results.recommendedCareers[0].matchScore).toBe(92);
      expect(assessment.results.recommendedCareers[1].matchScore).toBe(87);
    });

    test('should store career salary ranges', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          recommendedCareers: [
            {
              careerId: 1,
              name: 'Software Engineer',
              salary_range: {
                min: 600000,
                max: 2000000,
                currency: 'INR',
              },
              holland_codes: ['R', 'I', 'C'],
            },
          ],
        },
      });

      expect(assessment.results.recommendedCareers[0].salary_range.min).toBe(600000);
      expect(assessment.results.recommendedCareers[0].salary_range.max).toBe(2000000);
    });

    test('should store career growth and icon information', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          recommendedCareers: [
            {
              careerId: 1,
              name: 'Data Scientist',
              future_growth: {
                rate: 'Very High',
                percentage: 35,
              },
              minimum_expense: 25000,
              icon: 'ds-icon.png',
              holland_codes: ['I', 'R', 'C'],
            },
          ],
        },
      });

      expect(assessment.results.recommendedCareers[0].future_growth.percentage).toBe(35);
      expect(assessment.results.recommendedCareers[0].minimum_expense).toBe(25000);
    });
  });

  // =========================================================================
  // ASSESSMENT IMPROVEMENT TRACKING TESTS
  // =========================================================================

  describe('Assessment Improvement Tracking', () => {
    test('should track previous assessment', async () => {
      const firstAssessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          hollandCode: 'RIA',
        },
      });

      const secondAssessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([
          ['R1', 5],
          ['I1', 4],
        ]),
        results: {
          hollandCode: 'RIA',
        },
        previousAssessmentId: firstAssessment._id,
      });

      expect(secondAssessment.previousAssessmentId).toBeDefined();
      expect(secondAssessment.previousAssessmentId.toString()).toBe(firstAssessment._id.toString());
    });

    test('should track improvement metrics', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          hollandCode: 'RIA',
        },
        improvement: {
          hasImproved: true,
          percentageChange: 15,
          dominantTraitChange: 'R -> I',
        },
      });

      expect(assessment.improvement.hasImproved).toBe(true);
      expect(assessment.improvement.percentageChange).toBe(15);
      expect(assessment.improvement.dominantTraitChange).toBe('R -> I');
    });
  });

  // =========================================================================
  // SHAREABLE LINK TESTS
  // =========================================================================

  describe('Shareable Link', () => {
    test('should store shareable link for results', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          hollandCode: 'RIA',
        },
        shareableLink: 'https://example.com/results/abc-def-123',
      });

      expect(assessment.shareableLink).toBe('https://example.com/results/abc-def-123');
    });
  });

  // =========================================================================
  // USER REFERENCE TESTS
  // =========================================================================

  describe('User Reference (Backwards Compatibility)', () => {
    test('should support user object reference', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
      });

      const assessment = await Assessment.create({
        userId: user._id.toString(),
        user: user._id,
        answers: new Map([['R1', 5]]),
      });

      expect(assessment.user).toBeDefined();
      expect(assessment.user.toString()).toBe(user._id.toString());
    });

    test('should allow string userId for backwards compatibility', async () => {
      const assessment = await Assessment.create({
        userId: 'legacy-user-string-id',
        answers: new Map([['R1', 5]]),
      });

      expect(assessment.userId).toBe('legacy-user-string-id');
      expect(typeof assessment.userId).toBe('string');
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
      });

      expect(assessment.createdAt).toBeDefined();
      expect(assessment.updatedAt).toBeDefined();
    });
  });

  // =========================================================================
  // INDEX TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should have index on user and completedAt', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
      });

      const assessment1 = await Assessment.create({
        userId: user._id.toString(),
        user: user._id,
        answers: new Map([['R1', 5]]),
      });

      const assessment2 = await Assessment.create({
        userId: user._id.toString(),
        user: user._id,
        answers: new Map([['R1', 4]]),
      });

      // Query using index should work efficiently
      const results = await Assessment.find({ user: user._id }).sort({
        completedAt: -1,
      });

      expect(results).toHaveLength(2);
      expect(results[0].completedAt.getTime()).toBeGreaterThanOrEqual(
        results[1].completedAt.getTime()
      );
    });
  });

  // =========================================================================
  // EMPTY/MINIMAL DATA TESTS
  // =========================================================================

  describe('Minimal Assessment Data', () => {
    test('should work with minimal required data', async () => {
      const assessment = await Assessment.create({
        userId: 'minimal-user',
        answers: new Map([['R1', 1]]),
      });

      expect(assessment._id).toBeDefined();
      expect(assessment.answers.get('R1')).toBe(1);
      expect(assessment.results).toBeUndefined();
    });

    test('should handle empty recommended careers array', async () => {
      const assessment = await Assessment.create({
        userId: 'test-user-123',
        answers: new Map([['R1', 5]]),
        results: {
          recommendedCareers: [],
        },
      });

      expect(assessment.results.recommendedCareers).toHaveLength(0);
    });
  });
});
