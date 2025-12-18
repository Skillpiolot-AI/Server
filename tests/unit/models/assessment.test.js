// tests/unit/models/assessment.test.js
const mongoose = require('mongoose');
const Assessment = require('../../../models/Assessment');

describe('Assessment Model Tests', () => {
  describe('Assessment Creation', () => {
    it('should create a valid assessment with required fields', async () => {
      const assessmentData = {
        userId: 'user-123',
        answers: new Map([
          ['R1', 5],
          ['I1', 4],
          ['A1', 3],
          ['S1', 4],
          ['E1', 2],
          ['C1', 3],
        ]),
      };

      const assessment = new Assessment(assessmentData);
      const savedAssessment = await assessment.save();

      expect(savedAssessment._id).toBeDefined();
      expect(savedAssessment.userId).toBe('user-123');
      expect(savedAssessment.answers.get('R1')).toBe(5);
      expect(savedAssessment.completedAt).toBeDefined();
    });

    it('should not create assessment without userId', async () => {
      const assessment = new Assessment({
        answers: new Map([['R1', 5]]),
      });

      await expect(assessment.save()).rejects.toThrow();
    });

    it('should not create assessment without answers', async () => {
      const assessment = new Assessment({
        userId: 'user-123',
      });

      await expect(assessment.save()).rejects.toThrow();
    });

    it('should store results with domain scores', async () => {
      const assessment = new Assessment({
        userId: 'user-456',
        answers: new Map([['R1', 5]]),
        results: {
          domainScores: { R: 25, I: 20, A: 15, S: 18, E: 12, C: 10 },
          percentages: { R: 25, I: 20, A: 15, S: 18, E: 12, C: 10 },
          hollandCode: 'RIS',
          topThreeDomains: ['R', 'I', 'S'],
        },
      });

      const saved = await assessment.save();

      expect(saved.results.domainScores.R).toBe(25);
      expect(saved.results.hollandCode).toBe('RIS');
      expect(saved.results.topThreeDomains).toEqual(['R', 'I', 'S']);
    });

    it('should store recommended careers', async () => {
      const assessment = new Assessment({
        userId: 'user-789',
        answers: new Map([['R1', 5]]),
        results: {
          domainScores: { R: 25, I: 20, A: 15, S: 18, E: 12, C: 10 },
          percentages: { R: 25, I: 20, A: 15, S: 18, E: 12, C: 10 },
          hollandCode: 'RIS',
          topThreeDomains: ['R', 'I', 'S'],
          recommendedCareers: [
            {
              careerId: 1,
              name: 'Software Engineer',
              cluster: 'Technology',
              matchScore: 95,
              career_type: 'Tech',
              holland_codes: ['R', 'I', 'C'],
            },
            {
              careerId: 2,
              name: 'Data Scientist',
              cluster: 'Technology',
              matchScore: 88,
              career_type: 'Tech',
              holland_codes: ['I', 'R', 'C'],
            },
          ],
        },
      });

      const saved = await assessment.save();

      expect(saved.results.recommendedCareers).toHaveLength(2);
      expect(saved.results.recommendedCareers[0].name).toBe('Software Engineer');
      expect(saved.results.recommendedCareers[0].matchScore).toBe(95);
    });

    it('should store shareable link', async () => {
      const assessment = new Assessment({
        userId: 'user-share',
        answers: new Map([['R1', 5]]),
        shareableLink: 'http://localhost:3000/results/123456789',
      });

      const saved = await assessment.save();

      expect(saved.shareableLink).toBe('http://localhost:3000/results/123456789');
    });

    it('should set completedAt to current date by default', async () => {
      const beforeCreate = new Date();

      const assessment = await Assessment.create({
        userId: 'user-time',
        answers: new Map([['R1', 5]]),
      });

      const afterCreate = new Date();

      expect(assessment.completedAt).toBeDefined();
      expect(assessment.completedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(assessment.completedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should have timestamps enabled', async () => {
      const assessment = await Assessment.create({
        userId: 'user-timestamps',
        answers: new Map([['R1', 5]]),
      });

      expect(assessment.createdAt).toBeDefined();
      expect(assessment.updatedAt).toBeDefined();
    });
  });

  describe('Assessment Answers Map', () => {
    it('should store multiple domain answers', async () => {
      const answers = new Map([
        ['R1', 5],
        ['R2', 4],
        ['R3', 3],
        ['I1', 4],
        ['I2', 5],
        ['I3', 4],
        ['A1', 2],
        ['A2', 3],
        ['A3', 2],
        ['S1', 4],
        ['S2', 4],
        ['S3', 5],
        ['E1', 1],
        ['E2', 2],
        ['E3', 2],
        ['C1', 3],
        ['C2', 3],
        ['C3', 4],
      ]);

      const assessment = await Assessment.create({
        userId: 'user-full',
        answers,
      });

      expect(assessment.answers.get('R1')).toBe(5);
      expect(assessment.answers.get('I2')).toBe(5);
      expect(assessment.answers.get('E1')).toBe(1);
    });

    it('should handle numeric answer values', async () => {
      const assessment = await Assessment.create({
        userId: 'user-numeric',
        answers: new Map([
          ['R1', 0],
          ['R2', 5],
          ['R3', 10],
        ]),
      });

      expect(assessment.answers.get('R1')).toBe(0);
      expect(assessment.answers.get('R2')).toBe(5);
      expect(assessment.answers.get('R3')).toBe(10);
    });
  });

  describe('Assessment Querying', () => {
    beforeEach(async () => {
      // Create multiple assessments for the same user
      await Assessment.create([
        {
          userId: 'user-query',
          answers: new Map([['R1', 5]]),
          results: { hollandCode: 'RIA' },
        },
        {
          userId: 'user-query',
          answers: new Map([['R1', 4]]),
          results: { hollandCode: 'RIS' },
        },
        {
          userId: 'user-other',
          answers: new Map([['R1', 3]]),
          results: { hollandCode: 'SIA' },
        },
      ]);
    });

    it('should find assessments by userId', async () => {
      const assessments = await Assessment.find({ userId: 'user-query' });
      expect(assessments).toHaveLength(2);
    });

    it('should find most recent assessment', async () => {
      const assessment = await Assessment.findOne({ userId: 'user-query' }).sort({
        completedAt: -1,
      });

      expect(assessment).toBeDefined();
      expect(assessment.userId).toBe('user-query');
    });

    it('should count assessments per user', async () => {
      const count = await Assessment.countDocuments({ userId: 'user-query' });
      expect(count).toBe(2);
    });
  });

  describe('Assessment Update', () => {
    it('should update results after creation', async () => {
      const assessment = await Assessment.create({
        userId: 'user-update',
        answers: new Map([['R1', 5]]),
      });

      assessment.results = {
        domainScores: { R: 30, I: 25, A: 20, S: 15, E: 10, C: 5 },
        hollandCode: 'RIA',
        topThreeDomains: ['R', 'I', 'A'],
      };

      await assessment.save();

      const updated = await Assessment.findById(assessment._id);
      expect(updated.results.hollandCode).toBe('RIA');
    });

    it('should update shareable link', async () => {
      const assessment = await Assessment.create({
        userId: 'user-link',
        answers: new Map([['R1', 5]]),
      });

      assessment.shareableLink = 'http://newlink.com/results/abc';
      await assessment.save();

      const updated = await Assessment.findById(assessment._id);
      expect(updated.shareableLink).toBe('http://newlink.com/results/abc');
    });
  });

  describe('Assessment Edge Cases', () => {
    it('should handle empty recommended careers array', async () => {
      const assessment = await Assessment.create({
        userId: 'user-empty-careers',
        answers: new Map([['R1', 1]]),
        results: {
          domainScores: { R: 1, I: 0, A: 0, S: 0, E: 0, C: 0 },
          hollandCode: 'R',
          topThreeDomains: ['R'],
          recommendedCareers: [],
        },
      });

      expect(assessment.results.recommendedCareers).toEqual([]);
    });

    it('should handle very long userId', async () => {
      const longUserId = 'a'.repeat(500);

      const assessment = await Assessment.create({
        userId: longUserId,
        answers: new Map([['R1', 5]]),
      });

      expect(assessment.userId).toBe(longUserId);
    });
  });
});
