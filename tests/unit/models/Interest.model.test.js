/**
 * Interest Model Tests
 * Tests for user interests and Holland Code domain tracking
 */

const mongoose = require('mongoose');
const Interest = require('../../../models/Interest');
const { testInterests, generateId } = require('../../fixtures/testData');
const { cleanDatabase, createTestUser } = require('../../helpers/testHelpers');

describe('Interest Model', () => {
  let testUser;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid interest with required fields', async () => {
      const interestData = {
        name: 'Software Development',
        hollandCode: 'I',
      };

      const interest = await Interest.create(interestData);

      expect(interest._id).toBeDefined();
      expect(interest.name).toBe('Software Development');
      expect(interest.hollandCode).toBe('I');
    });

    test('should fail validation when name is missing', async () => {
      const interestData = {
        hollandCode: 'I',
      };

      await expect(Interest.create(interestData)).rejects.toThrow();
    });

    test('should fail validation when hollandCode is missing', async () => {
      const interestData = {
        name: 'Software Development',
      };

      await expect(Interest.create(interestData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // HOLLAND CODE TESTS
  // =========================================================================

  describe('Holland Code Mapping', () => {
    test('should accept all valid Holland Codes', async () => {
      const codes = ['R', 'I', 'A', 'S', 'E', 'C'];

      for (const code of codes) {
        const interest = await Interest.create({
          name: `Interest ${code}`,
          hollandCode: code,
        });

        expect(interest.hollandCode).toBe(code);
        await Interest.deleteOne({ _id: interest._id });
      }
    });

    test('should reject invalid Holland Code', async () => {
      const interestData = {
        name: 'Invalid Interest',
        hollandCode: 'X',
      };

      await expect(Interest.create(interestData)).rejects.toThrow();
    });

    test('should map interest to Holland Code domain', async () => {
      const interest = await Interest.create({
        name: 'Data Analysis',
        hollandCode: 'I', // Investigative
      });

      expect(interest.hollandCode).toBe('I');
    });
  });

  // =========================================================================
  // DESCRIPTION & DETAILS TESTS
  // =========================================================================

  describe('Interest Details', () => {
    test('should store detailed description', async () => {
      const desc = 'Interest in creating software solutions and applications';
      const interest = await Interest.create({
        name: 'Software Development',
        hollandCode: 'I',
        description: desc,
      });

      expect(interest.description).toBe(desc);
    });

    test('should store related interests', async () => {
      const interest = await Interest.create({
        name: 'Machine Learning',
        hollandCode: 'I',
        relatedInterests: ['Data Science', 'Artificial Intelligence', 'Neural Networks'],
      });

      expect(interest.relatedInterests).toHaveLength(3);
      expect(interest.relatedInterests).toContain('Data Science');
    });

    test('should store example activities', async () => {
      const interest = await Interest.create({
        name: 'Web Design',
        hollandCode: 'A',
        exampleActivities: [
          'Creating website layouts',
          'UI/UX design',
          'Prototyping designs',
          'Working with design tools',
        ],
      });

      expect(interest.exampleActivities).toHaveLength(4);
    });
  });

  // =========================================================================
  // CAREER MAPPING TESTS
  // =========================================================================

  describe('Career Mapping', () => {
    test('should link interests to relevant careers', async () => {
      const careerId = generateId();
      const interest = await Interest.create({
        name: 'Business Management',
        hollandCode: 'E',
        relevantCareers: [{ careerId, relevanceScore: 95 }],
      });

      expect(interest.relevantCareers).toHaveLength(1);
      expect(interest.relevantCareers[0].relevanceScore).toBe(95);
    });

    test('should track skill overlap with interest', async () => {
      const interest = await Interest.create({
        name: 'Product Development',
        hollandCode: 'E',
        requiredSkills: [
          'Project Management',
          'Problem Solving',
          'Communication',
          'Technical Knowledge',
        ],
      });

      expect(interest.requiredSkills).toHaveLength(4);
      expect(interest.requiredSkills).toContain('Project Management');
    });
  });

  // =========================================================================
  // ASSESSMENT TRACKING TESTS
  // =========================================================================

  describe('Assessment & Popularity', () => {
    test('should track how many users have this interest', async () => {
      const interest = await Interest.create({
        name: 'Environmental Science',
        hollandCode: 'I',
        userCount: 234,
      });

      expect(interest.userCount).toBe(234);
    });

    test('should track assessment frequency', async () => {
      const interest = await Interest.create({
        name: 'Public Service',
        hollandCode: 'S',
        assessmentFrequency: 156, // Number of times selected in assessments
      });

      expect(interest.assessmentFrequency).toBe(156);
    });

    test('should track performance correlation with interests taken', async () => {
      const interest = await Interest.create({
        name: 'Finance',
        hollandCode: 'C',
        performanceMetrics: {
          averageScore: 78,
          successRate: 0.85,
        },
      });

      expect(interest.performanceMetrics.averageScore).toBe(78);
      expect(interest.performanceMetrics.successRate).toBe(0.85);
    });
  });

  // =========================================================================
  // ASSESSMENT CONTEXT TESTS
  // =========================================================================

  describe('Assessment Context', () => {
    test('should associate with assessment questions', async () => {
      const questionId = generateId();
      const interest = await Interest.create({
        name: 'Entrepreneurship',
        hollandCode: 'E',
        assessmentQuestionIds: [questionId, generateId()],
      });

      expect(interest.assessmentQuestionIds).toHaveLength(2);
    });

    test('should track assessment score contribution', async () => {
      const interest = await Interest.create({
        name: 'Creative Writing',
        hollandCode: 'A',
        scoreWeight: 1.2, // This interest contributes more to the score
      });

      expect(interest.scoreWeight).toBe(1.2);
    });
  });

  // =========================================================================
  // CATEGORY TESTS
  // =========================================================================

  describe('Interest Categories', () => {
    test('should categorize interests by type', async () => {
      const interest = await Interest.create({
        name: 'Game Development',
        hollandCode: 'A',
        category: 'Creative Technology',
      });

      expect(interest.category).toBe('Creative Technology');
    });

    test('should support multiple categorizations', async () => {
      const interest = await Interest.create({
        name: 'Healthcare Technology',
        hollandCode: 'I',
        tags: ['healthcare', 'technology', 'innovation', 'social-good'],
      });

      expect(interest.tags).toHaveLength(4);
    });
  });

  // =========================================================================
  // USER SELECTION & PREFERENCES TESTS
  // =========================================================================

  describe('User Selection Tracking', () => {
    test('should track frequency of user selection', async () => {
      const interest = await Interest.create({
        name: 'Sports Management',
        hollandCode: 'E',
        selectionFrequency: 89,
      });

      expect(interest.selectionFrequency).toBe(89);
    });

    test('should track average interest level when selected', async () => {
      const interest = await Interest.create({
        name: 'Environmental Conservation',
        hollandCode: 'I',
        averageInterestRating: 4.2, // Out of 5
      });

      expect(interest.averageInterestRating).toBe(4.2);
    });

    test('should track user ratings on interest satisfaction', async () => {
      const interest = await Interest.create({
        name: 'Urban Planning',
        hollandCode: 'E',
        userRatings: [{ userId: testUser._id, rating: 5, comment: 'Very interesting field' }],
      });

      expect(interest.userRatings).toHaveLength(1);
      expect(interest.userRatings[0].rating).toBe(5);
    });
  });

  // =========================================================================
  // METADATA & DISPLAY TESTS
  // =========================================================================

  describe('Metadata & Display', () => {
    test('should store icon and banner URLs', async () => {
      const interest = await Interest.create({
        name: 'Artificial Intelligence',
        hollandCode: 'I',
        icon: 'https://example.com/icons/ai.png',
        banner: 'https://example.com/banners/ai-banner.jpg',
      });

      expect(interest.icon).toBe('https://example.com/icons/ai.png');
      expect(interest.banner).toBe('https://example.com/banners/ai-banner.jpg');
    });

    test('should track if interest is active and featured', async () => {
      const interest = await Interest.create({
        name: 'Blockchain',
        hollandCode: 'I',
        isActive: true,
        isFeatured: true,
        featureRank: 5,
      });

      expect(interest.isActive).toBe(true);
      expect(interest.isFeatured).toBe(true);
      expect(interest.featureRank).toBe(5);
    });

    test('should store display color for UI purposes', async () => {
      const interest = await Interest.create({
        name: 'Fashion Design',
        hollandCode: 'A',
        displayColor: '#FF6B9D',
      });

      expect(interest.displayColor).toBe('#FF6B9D');
    });
  });

  // =========================================================================
  // TREND & MARKET ANALYSIS TESTS
  // =========================================================================

  describe('Market Trends', () => {
    test('should track interest trend over time', async () => {
      const interest = await Interest.create({
        name: 'Cybersecurity',
        hollandCode: 'I',
        trendData: [
          { month: 'January', count: 120 },
          { month: 'February', count: 145 },
          { month: 'March', count: 178 },
        ],
      });

      expect(interest.trendData).toHaveLength(3);
      expect(interest.trendData[2].count).toBe(178);
    });

    test('should track market demand level', async () => {
      const interest = await Interest.create({
        name: 'Cloud Computing',
        hollandCode: 'I',
        marketDemand: 'high',
        growthRate: 25, // 25% annual growth
      });

      expect(interest.marketDemand).toBe('high');
      expect(interest.growthRate).toBe(25);
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient search by name', async () => {
      const interest = await Interest.create({
        name: 'Aviation',
        hollandCode: 'R',
      });

      const found = await Interest.findOne({ name: 'Aviation' });

      expect(found._id.toString()).toBe(interest._id.toString());
    });

    test('should support efficient queries by Holland Code', async () => {
      const interest = await Interest.create({
        name: 'Teaching',
        hollandCode: 'S',
      });

      const socialInterests = await Interest.find({ hollandCode: 'S' });

      expect(socialInterests.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const interest = await Interest.create({
        name: 'Renewable Energy',
        hollandCode: 'I',
      });

      expect(interest.createdAt).toBeDefined();
      expect(interest.updatedAt).toBeDefined();
    });
  });
});
