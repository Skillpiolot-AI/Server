/**
 * Strength Model Tests
 * Tests for personal strengths and competencies
 */

const mongoose = require('mongoose');
const Strength = require('../../../models/Strength');
const { testStrengths, generateId } = require('../../fixtures/testData');
const { cleanDatabase, createTestUser } = require('../../helpers/testHelpers');

describe('Strength Model', () => {
  let testUser;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid strength with required fields', async () => {
      const strengthData = {
        name: 'Leadership',
        category: 'Personal Quality',
      };

      const strength = await Strength.create(strengthData);

      expect(strength._id).toBeDefined();
      expect(strength.name).toBe('Leadership');
      expect(strength.category).toBe('Personal Quality');
    });

    test('should fail validation when name is missing', async () => {
      const strengthData = {
        category: 'Personal Quality',
      };

      await expect(Strength.create(strengthData)).rejects.toThrow();
    });

    test('should fail validation when category is missing', async () => {
      const strengthData = {
        name: 'Leadership',
      };

      await expect(Strength.create(strengthData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // STRENGTH CATEGORY TESTS
  // =========================================================================

  describe('Strength Categories', () => {
    test('should accept valid strength categories', async () => {
      const categories = [
        'Personal Quality',
        'Communication',
        'Technical',
        'Cognitive',
        'Emotional Intelligence',
        'Creative',
      ];

      for (const category of categories) {
        const strength = await Strength.create({
          name: `Strength ${category}`,
          category,
        });

        expect(strength.category).toBe(category);
        await Strength.deleteOne({ _id: strength._id });
      }
    });
  });

  // =========================================================================
  // STRENGTH DETAILS TESTS
  // =========================================================================

  describe('Strength Details', () => {
    test('should store detailed description', async () => {
      const desc = 'Ability to inspire and motivate a team towards common goals';
      const strength = await Strength.create({
        name: 'Leadership',
        category: 'Personal Quality',
        description: desc,
      });

      expect(strength.description).toBe(desc);
    });

    test('should store supporting skills', async () => {
      const strength = await Strength.create({
        name: 'Problem Solving',
        category: 'Cognitive',
        supportingSkills: ['Analytical Thinking', 'Creativity', 'Persistence', 'Research'],
      });

      expect(strength.supportingSkills).toHaveLength(4);
      expect(strength.supportingSkills).toContain('Analytical Thinking');
    });

    test('should store manifestations/examples', async () => {
      const strength = await Strength.create({
        name: 'Teamwork',
        category: 'Communication',
        manifestations: [
          'Collaborates effectively in group projects',
          'Communicates ideas clearly to team members',
          'Accepts feedback constructively',
          'Supports teammates in achieving goals',
        ],
      });

      expect(strength.manifestations).toHaveLength(4);
    });
  });

  // =========================================================================
  // ASSESSMENT TRACKING TESTS
  // =========================================================================

  describe('Assessment Tracking', () => {
    test('should track strength scores and ratings', async () => {
      const strength = await Strength.create({
        name: 'Adaptability',
        category: 'Personal Quality',
        scoreRange: {
          minimum: 0,
          maximum: 100,
        },
        averageScore: 75,
      });

      expect(strength.scoreRange.maximum).toBe(100);
      expect(strength.averageScore).toBe(75);
    });

    test('should track user proficiency levels', async () => {
      const strength = await Strength.create({
        name: 'Communication',
        category: 'Communication',
        proficiencyLevels: {
          beginner: 'Can express basic ideas',
          intermediate: 'Can communicate clearly in most situations',
          advanced: 'Expert communicator in all contexts',
        },
      });

      expect(strength.proficiencyLevels.intermediate).toBeDefined();
    });

    test('should store assessment questions related to strength', async () => {
      const strength = await Strength.create({
        name: 'Leadership',
        category: 'Personal Quality',
        assessmentQuestions: [
          'Do others look to you for direction?',
          'Can you motivate a team?',
          'Do you take initiative in group settings?',
        ],
      });

      expect(strength.assessmentQuestions).toHaveLength(3);
    });
  });

  // =========================================================================
  // CAREER RELEVANCE TESTS
  // =========================================================================

  describe('Career Relevance', () => {
    test('should map strengths to relevant careers', async () => {
      const careerId = generateId();
      const strength = await Strength.create({
        name: 'Leadership',
        category: 'Personal Quality',
        relevantCareers: [{ careerId, importance: 'critical' }],
      });

      expect(strength.relevantCareers).toHaveLength(1);
      expect(strength.relevantCareers[0].importance).toBe('critical');
    });

    test('should track complementary strengths for careers', async () => {
      const strength = await Strength.create({
        name: 'Teamwork',
        category: 'Communication',
        complementaryStrengths: ['Communication', 'Empathy', 'Active Listening'],
      });

      expect(strength.complementaryStrengths).toHaveLength(3);
    });
  });

  // =========================================================================
  // DEVELOPMENT TRACKING TESTS
  // =========================================================================

  describe('Development Tracking', () => {
    test('should track development tips for strength improvement', async () => {
      const strength = await Strength.create({
        name: 'Critical Thinking',
        category: 'Cognitive',
        developmentTips: [
          'Read diverse sources of information',
          'Ask questions to understand different perspectives',
          'Practice analyzing arguments and evidence',
          'Engage in debates and discussions',
        ],
      });

      expect(strength.developmentTips).toHaveLength(4);
    });

    test('should suggest related resources', async () => {
      const strength = await Strength.create({
        name: 'Public Speaking',
        category: 'Communication',
        resources: [
          {
            title: 'Toastmasters International',
            type: 'Organization',
            url: 'https://toastmasters.org',
          },
          {
            title: 'TED Talks',
            type: 'Video Content',
            url: 'https://ted.com',
          },
        ],
      });

      expect(strength.resources).toHaveLength(2);
      expect(strength.resources[0].type).toBe('Organization');
    });
  });

  // =========================================================================
  // HOLLAND CODE MAPPING TESTS
  // =========================================================================

  describe('Holland Code Mapping', () => {
    test('should map strengths to Holland Code domains', async () => {
      const strength = await Strength.create({
        name: 'Problem Solving',
        category: 'Cognitive',
        hollandCodeMapping: {
          realistic: 20,
          investigative: 35,
          artistic: 10,
          social: 15,
          enterprising: 20,
          conventional: 10,
        },
      });

      expect(strength.hollandCodeMapping.investigative).toBe(35);
    });

    test('should track primary Holland Code match', async () => {
      const strength = await Strength.create({
        name: 'Leadership',
        category: 'Personal Quality',
        primaryHollandCode: 'E', // Enterprising
        secondaryHollandCodes: ['S'], // Social
      });

      expect(strength.primaryHollandCode).toBe('E');
      expect(strength.secondaryHollandCodes).toContain('S');
    });
  });

  // =========================================================================
  // ENDORSEMENT TESTS
  // =========================================================================

  describe('Endorsements', () => {
    test('should track endorsements from other users', async () => {
      const user2 = await createTestUser();
      const user3 = await createTestUser();

      const strength = await Strength.create({
        name: 'Reliability',
        category: 'Personal Quality',
        endorsements: [
          {
            userId: testUser._id,
            endorsedAt: new Date(),
          },
          {
            userId: user2._id,
            endorsedAt: new Date(),
          },
          {
            userId: user3._id,
            endorsedAt: new Date(),
          },
        ],
      });

      expect(strength.endorsements).toHaveLength(3);
    });

    test('should track total endorsement count', async () => {
      const strength = await Strength.create({
        name: 'Communication Skills',
        category: 'Communication',
        endorsementCount: 42,
      });

      expect(strength.endorsementCount).toBe(42);
    });
  });

  // =========================================================================
  // METADATA & STATUS TESTS
  // =========================================================================

  describe('Metadata & Status', () => {
    test('should store icon and badge URLs', async () => {
      const strength = await Strength.create({
        name: 'Innovation',
        category: 'Creative',
        icon: 'https://example.com/icons/innovation.png',
        badge: 'https://example.com/badges/innovator.png',
      });

      expect(strength.icon).toBe('https://example.com/icons/innovation.png');
      expect(strength.badge).toBe('https://example.com/badges/innovator.png');
    });

    test('should track if strength is active and featured', async () => {
      const strength = await Strength.create({
        name: 'Adaptability',
        category: 'Personal Quality',
        isActive: true,
        isFeatured: true,
        featureRank: 3,
      });

      expect(strength.isActive).toBe(true);
      expect(strength.isFeatured).toBe(true);
      expect(strength.featureRank).toBe(3);
    });

    test('should allow custom tags', async () => {
      const strength = await Strength.create({
        name: 'Creativity',
        category: 'Creative',
        tags: ['innovation', 'design', 'problem-solving', 'artistic'],
      });

      expect(strength.tags).toHaveLength(4);
      expect(strength.tags).toContain('innovation');
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient search by name', async () => {
      const strength = await Strength.create({
        name: 'Patience',
        category: 'Personal Quality',
      });

      const found = await Strength.findOne({ name: 'Patience' });

      expect(found._id.toString()).toBe(strength._id.toString());
    });

    test('should support efficient queries by category', async () => {
      const strength = await Strength.create({
        name: 'Empathy',
        category: 'Emotional Intelligence',
      });

      const emotionalStrengths = await Strength.find({ category: 'Emotional Intelligence' });

      expect(emotionalStrengths.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const strength = await Strength.create({
        name: 'Perseverance',
        category: 'Personal Quality',
      });

      expect(strength.createdAt).toBeDefined();
      expect(strength.updatedAt).toBeDefined();
    });
  });
});
