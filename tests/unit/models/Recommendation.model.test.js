/**
 * Recommendation Model Tests
 * Tests for career recommendations based on assessments
 */

const mongoose = require('mongoose');
const Recommendation = require('../../../models/Recommendation');
const {
  testCareers,
  generateId,
} = require('../../fixtures/testData');
const {
  cleanDatabase,
  createTestUser,
} = require('../../helpers/testHelpers');

describe('Recommendation Model', () => {
  let testUser;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid recommendation with required fields', async () => {
      const recommendationData = {
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
      };

      const recommendation = await Recommendation.create(recommendationData);

      expect(recommendation._id).toBeDefined();
      expect(recommendation.userId.toString()).toBe(testUser._id.toString());
      expect(recommendation.score).toBe(85);
    });

    test('should fail validation when userId is missing', async () => {
      const recommendationData = {
        careerId: generateId(),
        score: 85,
      };

      await expect(Recommendation.create(recommendationData)).rejects.toThrow();
    });

    test('should fail validation when careerId is missing', async () => {
      const recommendationData = {
        userId: testUser._id,
        score: 85,
      };

      await expect(Recommendation.create(recommendationData)).rejects.toThrow();
    });

    test('should fail validation when score is missing', async () => {
      const recommendationData = {
        userId: testUser._id,
        careerId: generateId(),
      };

      await expect(Recommendation.create(recommendationData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // RECOMMENDATION SCORE TESTS
  // =========================================================================

  describe('Recommendation Scoring', () => {
    test('should store recommendation score (0-100)', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 92,
      });

      expect(recommendation.score).toBe(92);
      expect(recommendation.score).toBeGreaterThanOrEqual(0);
      expect(recommendation.score).toBeLessThanOrEqual(100);
    });

    test('should set default confidence level', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 75,
      });

      expect(recommendation.confidenceScore).toBeDefined();
    });

    test('should track recommendation rank among other careers', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        rank: 2, // Second recommendation for this user
      });

      expect(recommendation.rank).toBe(2);
    });
  });

  // =========================================================================
  // MATCHING DETAILS TESTS
  // =========================================================================

  describe('Matching Details', () => {
    test('should store Holland Code matching score', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 88,
        hollandCodeMatch: {
          realistic: 18,
          investigative: 22,
          artistic: 8,
          social: 14,
          enterprising: 20,
          conventional: 18,
        },
      });

      expect(recommendation.hollandCodeMatch.investigative).toBe(22);
    });

    test('should store skill match information', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 80,
        skillMatch: {
          matchedSkills: ['Python', 'Problem Solving', 'Communication'],
          missingSkills: ['Cloud Computing', 'Kubernetes'],
          skillMatchPercentage: 75,
        },
      });

      expect(recommendation.skillMatch.matchedSkills).toHaveLength(3);
      expect(recommendation.skillMatch.missingSkills).toHaveLength(2);
    });

    test('should track strength alignment', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 87,
        strengthMatch: {
          alignedStrengths: ['Leadership', 'Problem Solving', 'Communication'],
          alignmentPercentage: 80,
        },
      });

      expect(recommendation.strengthMatch.alignedStrengths).toHaveLength(3);
    });

    test('should track interest alignment', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 84,
        interestMatch: {
          alignedInterests: ['Technology', 'Innovation'],
          mismatchedInterests: ['Art'],
          alignmentPercentage: 90,
        },
      });

      expect(recommendation.interestMatch.alignedInterests).toHaveLength(2);
      expect(recommendation.interestMatch.mismatchedInterests).toHaveLength(1);
    });
  });

  // =========================================================================
  // ASSESSMENT BASIS TESTS
  // =========================================================================

  describe('Assessment Basis', () => {
    test('should link recommendation to source assessment', async () => {
      const assessmentId = generateId();
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        assessmentId,
      });

      expect(recommendation.assessmentId.toString()).toBe(assessmentId.toString());
    });

    test('should track assessment responses that led to recommendation', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 82,
        basedOnQuestions: [
          { questionId: generateId(), answerId: 'option_3' },
          { questionId: generateId(), answerId: 'option_1' },
        ],
      });

      expect(recommendation.basedOnQuestions).toHaveLength(2);
    });
  });

  // =========================================================================
  // RECOMMENDATION CONFIDENCE TESTS
  // =========================================================================

  describe('Confidence & Certainty', () => {
    test('should calculate confidence level based on data', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 88,
        confidenceLevel: 'high', // high, medium, low based on score variance
      });

      expect(recommendation.confidenceLevel).toBe('high');
    });

    test('should track factors contributing to recommendation', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        contributingFactors: [
          { factor: 'Holland Code Match', weight: 40, contribution: 90 },
          { factor: 'Skill Match', weight: 30, contribution: 75 },
          { factor: 'Strength Alignment', weight: 20, contribution: 85 },
          { factor: 'Interest Match', weight: 10, contribution: 80 },
        ],
      });

      expect(recommendation.contributingFactors).toHaveLength(4);
      expect(recommendation.contributingFactors[0].weight).toBe(40);
    });
  });

  // =========================================================================
  // REASONING & EXPLANATION TESTS
  // =========================================================================

  describe('Recommendation Reasoning', () => {
    test('should provide explanation for recommendation', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 86,
        explanation: 'This career matches your investigative interests and technical skills',
      });

      expect(recommendation.explanation).toBeDefined();
    });

    test('should provide detailed analysis', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 83,
        detailedAnalysis: {
          strengths: [
            'Strong investigative orientation',
            'Excellent technical aptitude',
          ],
          areas_for_improvement: [
            'Develop teamwork skills more',
            'Work on communication',
          ],
          recommendations: [
            'Consider AI/ML specialization',
            'Take team projects',
          ],
        },
      });

      expect(recommendation.detailedAnalysis.strengths).toHaveLength(2);
      expect(recommendation.detailedAnalysis.areas_for_improvement).toHaveLength(2);
    });
  });

  // =========================================================================
  // PATHWAY & NEXT STEPS TESTS
  // =========================================================================

  describe('Pathway & Guidance', () => {
    test('should provide recommended learning path', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        learningPath: [
          { skill: 'Python', priority: 'high', timeframe: '3 months' },
          { skill: 'Data Science', priority: 'high', timeframe: '6 months' },
          { skill: 'Machine Learning', priority: 'medium', timeframe: '12 months' },
        ],
      });

      expect(recommendation.learningPath).toHaveLength(3);
      expect(recommendation.learningPath[0].priority).toBe('high');
    });

    test('should suggest next career steps', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 84,
        nextSteps: [
          'Explore internship opportunities in this field',
          'Complete online courses in core skills',
          'Connect with mentors in this industry',
          'Build a portfolio project',
        ],
      });

      expect(recommendation.nextSteps).toHaveLength(4);
    });

    test('should provide resources for career exploration', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 86,
        resources: [
          { title: 'Career Overview', url: 'https://example.com/career', type: 'guide' },
          { title: 'Industry Report', url: 'https://example.com/report', type: 'report' },
          { title: 'Mentor Connect', url: 'https://example.com/mentor', type: 'service' },
        ],
      });

      expect(recommendation.resources).toHaveLength(3);
    });
  });

  // =========================================================================
  // COMPARISON & BENCHMARKING TESTS
  // =========================================================================

  describe('Comparison & Benchmarking', () => {
    test('should compare with other recommendations for user', async () => {
      const careerId1 = generateId();
      const careerId2 = generateId();

      const rec1 = await Recommendation.create({
        userId: testUser._id,
        careerId: careerId1,
        score: 88,
      });

      const rec2 = await Recommendation.create({
        userId: testUser._id,
        careerId: careerId2,
        score: 75,
      });

      const recommendations = await Recommendation.find({ userId: testUser._id });

      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].score).toBeGreaterThan(recommendations[1].score);
    });

    test('should provide percentile ranking', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        percentileRank: 78, // Better than 78% of all recommendations
      });

      expect(recommendation.percentileRank).toBe(78);
    });
  });

  // =========================================================================
  // FEEDBACK & ACCURACY TRACKING TESTS
  // =========================================================================

  describe('Feedback & Accuracy', () => {
    test('should track user feedback on recommendation', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        userFeedback: {
          helpful: true,
          accurate: true,
          relevance: 4.5, // Out of 5
          comment: 'Very accurate recommendation',
        },
      });

      expect(recommendation.userFeedback.helpful).toBe(true);
      expect(recommendation.userFeedback.relevance).toBe(4.5);
    });

    test('should track if user followed recommendation', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 86,
        actionTaken: true,
        actionType: 'internship',
        actionDate: new Date(),
      });

      expect(recommendation.actionTaken).toBe(true);
      expect(recommendation.actionType).toBe('internship');
    });
  });

  // =========================================================================
  // RECOMMENDATION STATUS TESTS
  // =========================================================================

  describe('Recommendation Status', () => {
    test('should track if recommendation is active', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        isActive: true,
        status: 'primary',
      });

      expect(recommendation.isActive).toBe(true);
      expect(recommendation.status).toBe('primary');
    });

    test('should set default recommendation status', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 80,
      });

      expect(recommendation.isActive).toBe(true);
    });
  });

  // =========================================================================
  // RECALCULATION & VERSION TESTS
  // =========================================================================

  describe('Recalculation & Versioning', () => {
    test('should track recommendation version/iteration', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        version: 2, // Recalculated once
        previousScores: [75], // First calculation was 75
      });

      expect(recommendation.version).toBe(2);
      expect(recommendation.previousScores).toContain(75);
    });

    test('should track when recommendation was last updated', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
        lastRecalculatedAt: new Date(),
      });

      expect(recommendation.lastRecalculatedAt).toBeDefined();
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient queries by userId', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
      });

      const userRecs = await Recommendation.find({ userId: testUser._id });

      expect(userRecs.length).toBeGreaterThanOrEqual(1);
    });

    test('should support efficient sorting by score', async () => {
      const career1 = generateId();
      const career2 = generateId();
      const career3 = generateId();

      await Recommendation.create({
        userId: testUser._id,
        careerId: career1,
        score: 90,
      });

      await Recommendation.create({
        userId: testUser._id,
        careerId: career2,
        score: 75,
      });

      await Recommendation.create({
        userId: testUser._id,
        careerId: career3,
        score: 85,
      });

      const sortedRecs = await Recommendation.find({ userId: testUser._id }).sort(
        { score: -1 }
      );

      expect(sortedRecs[0].score).toBe(90);
      expect(sortedRecs[1].score).toBe(85);
      expect(sortedRecs[2].score).toBe(75);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const recommendation = await Recommendation.create({
        userId: testUser._id,
        careerId: generateId(),
        score: 85,
      });

      expect(recommendation.createdAt).toBeDefined();
      expect(recommendation.updatedAt).toBeDefined();
    });
  });
});
