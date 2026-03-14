/**
 * Skill Model Tests
 * Tests for skills, competencies, and proficiency levels
 */

const mongoose = require('mongoose');
const Skill = require('../../../models/Skill');
const {
  testSkills,
  generateId,
} = require('../../fixtures/testData');
const {
  cleanDatabase,
  createTestUser,
} = require('../../helpers/testHelpers');

describe('Skill Model', () => {
  let testUser;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid skill with required fields', async () => {
      const skillData = {
        name: 'JavaScript',
        category: 'Programming Language',
      };

      const skill = await Skill.create(skillData);

      expect(skill._id).toBeDefined();
      expect(skill.name).toBe('JavaScript');
      expect(skill.category).toBe('Programming Language');
    });

    test('should fail validation when name is missing', async () => {
      const skillData = {
        category: 'Programming Language',
      };

      await expect(Skill.create(skillData)).rejects.toThrow();
    });

    test('should fail validation when category is missing', async () => {
      const skillData = {
        name: 'JavaScript',
      };

      await expect(Skill.create(skillData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // SKILL CATEGORY TESTS
  // =========================================================================

  describe('Skill Categories', () => {
    test('should accept all valid skill categories', async () => {
      const categories = [
        'Programming Language',
        'Framework',
        'Database',
        'Tool',
        'Methodology',
        'Soft Skill',
        'Cloud Platform',
      ];

      for (const category of categories) {
        const skill = await Skill.create({
          name: `Skill ${category}`,
          category,
        });

        expect(skill.category).toBe(category);
        await Skill.deleteOne({ _id: skill._id });
      }
    });

    test('should reject invalid category', async () => {
      const skillData = {
        name: 'Test Skill',
        category: 'Invalid Category',
      };

      await expect(Skill.create(skillData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // PROFICIENCY LEVEL TESTS
  // =========================================================================

  describe('Proficiency Levels', () => {
    test('should set default proficiency level', async () => {
      const skill = await Skill.create({
        name: 'Python',
        category: 'Programming Language',
      });

      expect(skill.proficiencyLevel).toBeDefined();
    });

    test('should support proficiency level tracking per user', async () => {
      const skill = await Skill.create({
        name: 'React',
        category: 'Framework',
        endorsements: [
          {
            userId: testUser._id,
            proficiencyLevel: 'advanced',
            endorsedAt: new Date(),
          },
        ],
      });

      expect(skill.endorsements).toHaveLength(1);
      expect(skill.endorsements[0].proficiencyLevel).toBe('advanced');
    });
  });

  // =========================================================================
  // DESCRIPTION & DETAILS TESTS
  // =========================================================================

  describe('Skill Details', () => {
    test('should store description', async () => {
      const desc = 'A programming language used for web development';
      const skill = await Skill.create({
        name: 'JavaScript',
        category: 'Programming Language',
        description: desc,
      });

      expect(skill.description).toBe(desc);
    });

    test('should store related skills', async () => {
      const skill = await Skill.create({
        name: 'React',
        category: 'Framework',
        relatedSkills: ['JavaScript', 'HTML', 'CSS', 'Redux'],
      });

      expect(skill.relatedSkills).toHaveLength(4);
      expect(skill.relatedSkills).toContain('JavaScript');
    });

    test('should store prerequisites', async () => {
      const skill = await Skill.create({
        name: 'React',
        category: 'Framework',
        prerequisites: ['JavaScript', 'HTML', 'CSS'],
      });

      expect(skill.prerequisites).toHaveLength(3);
    });
  });

  // =========================================================================
  // ENDORSEMENT & VERIFICATION TESTS
  // =========================================================================

  describe('Endorsements & Verification', () => {
    test('should track multiple endorsements from different users', async () => {
      const user2 = await createTestUser();
      const user3 = await createTestUser();

      const skill = await Skill.create({
        name: 'Python',
        category: 'Programming Language',
        endorsements: [
          {
            userId: testUser._id,
            proficiencyLevel: 'expert',
            endorsedAt: new Date(),
          },
          {
            userId: user2._id,
            proficiencyLevel: 'advanced',
            endorsedAt: new Date(),
          },
          {
            userId: user3._id,
            proficiencyLevel: 'intermediate',
            endorsedAt: new Date(),
          },
        ],
      });

      expect(skill.endorsements).toHaveLength(3);
    });

    test('should track total number of endorsements', async () => {
      const skill = await Skill.create({
        name: 'Java',
        category: 'Programming Language',
        endorsementCount: 25,
      });

      expect(skill.endorsementCount).toBe(25);
    });

    test('should track if skill is verified/certified', async () => {
      const skill = await Skill.create({
        name: 'AWS',
        category: 'Cloud Platform',
        isVerified: true,
        verificationDetails: {
          certificationName: 'AWS Solutions Architect',
          issuedBy: 'Amazon Web Services',
        },
      });

      expect(skill.isVerified).toBe(true);
      expect(skill.verificationDetails.certificationName).toBe('AWS Solutions Architect');
    });
  });

  // =========================================================================
  // DIFFICULTY LEVEL TESTS
  // =========================================================================

  describe('Difficulty Level', () => {
    test('should track skill difficulty level', async () => {
      const skill = await Skill.create({
        name: 'Advanced System Design',
        category: 'Methodology',
        difficultyLevel: 5, // 1-5 scale
      });

      expect(skill.difficultyLevel).toBe(5);
    });

    test('should support learning resources and materials', async () => {
      const skill = await Skill.create({
        name: 'React',
        category: 'Framework',
        learningResources: [
          {
            title: 'Official React Documentation',
            url: 'https://react.dev',
            type: 'documentation',
          },
          {
            title: 'React Course on Udemy',
            url: 'https://udemy.com/course/react',
            type: 'course',
          },
        ],
      });

      expect(skill.learningResources).toHaveLength(2);
      expect(skill.learningResources[0].type).toBe('documentation');
    });
  });

  // =========================================================================
  // CAREER MAPPING TESTS
  // =========================================================================

  describe('Career Mapping', () => {
    test('should map skills to relevant careers', async () => {
      const careerId = generateId();
      const skill = await Skill.create({
        name: 'JavaScript',
        category: 'Programming Language',
        relevantCareers: [
          { careerId, importance: 'essential' },
        ],
      });

      expect(skill.relevantCareers).toHaveLength(1);
      expect(skill.relevantCareers[0].importance).toBe('essential');
    });

    test('should track skill market demand', async () => {
      const skill = await Skill.create({
        name: 'Kubernetes',
        category: 'Tool',
        marketDemand: 'high',
        demandTrend: 'increasing',
      });

      expect(skill.marketDemand).toBe('high');
      expect(skill.demandTrend).toBe('increasing');
    });
  });

  // =========================================================================
  // METADATA TESTS
  // =========================================================================

  describe('Metadata', () => {
    test('should store icon/badge URL', async () => {
      const skill = await Skill.create({
        name: 'Python',
        category: 'Programming Language',
        icon: 'https://example.com/icons/python.png',
        badge: 'https://example.com/badges/python-expert.png',
      });

      expect(skill.icon).toBe('https://example.com/icons/python.png');
      expect(skill.badge).toBe('https://example.com/badges/python-expert.png');
    });

    test('should track if skill is active/featured', async () => {
      const skill = await Skill.create({
        name: 'AI/ML',
        category: 'Methodology',
        isActive: true,
        isFeatured: true,
        featureRank: 1,
      });

      expect(skill.isActive).toBe(true);
      expect(skill.isFeatured).toBe(true);
      expect(skill.featureRank).toBe(1);
    });

    test('should store version history', async () => {
      const skill = await Skill.create({
        name: 'Kubernetes',
        category: 'Tool',
        version: '1.28',
        updateHistory: [
          { date: new Date(), change: 'Added new features' },
        ],
      });

      expect(skill.version).toBe('1.28');
      expect(skill.updateHistory).toHaveLength(1);
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient search by name', async () => {
      const skill = await Skill.create({
        name: 'TypeScript',
        category: 'Programming Language',
      });

      const found = await Skill.findOne({ name: 'TypeScript' });

      expect(found._id.toString()).toBe(skill._id.toString());
    });

    test('should support efficient queries by category', async () => {
      const skill = await Skill.create({
        name: 'Django',
        category: 'Framework',
      });

      const frameworks = await Skill.find({ category: 'Framework' });

      expect(frameworks.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const skill = await Skill.create({
        name: 'Go',
        category: 'Programming Language',
      });

      expect(skill.createdAt).toBeDefined();
      expect(skill.updatedAt).toBeDefined();
    });
  });
});
