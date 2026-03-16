/**
 * Career Model Tests
 * Tests for career information, salaries, and Holland Code matching
 */

const mongoose = require('mongoose');
const Career = require('../../../models/Career');
const { testCareers, generateId } = require('../../fixtures/testData');
const { cleanDatabase } = require('../../helpers/testHelpers');

// Required fields for Career model
let _careerIdCounter = 1000;
const careerRequiredBase = () => ({
  id: _careerIdCounter++,
  slug: `career-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  career_cluster_name: 'Technology',
});

describe('Career Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid career with required fields', async () => {
      const careerData = {
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops and maintains software applications',
      };

      const career = await Career.create(careerData);

      expect(career._id).toBeDefined();
      expect(career.name).toBe('Software Engineer');
      expect(career.description).toBe('Develops and maintains software applications');
    });

    test('should fail validation when name is missing', async () => {
      const careerData = {
        ...careerRequiredBase(),
        description: 'Develops software',
      };

      await expect(Career.create(careerData)).rejects.toThrow();
    });

    test('should fail validation when career_cluster_name is missing', async () => {
      const careerData = {
        id: 9999,
        slug: 'test-career',
        name: 'Software Engineer',
      };

      await expect(Career.create(careerData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // CAREER DETAILS TESTS
  // =========================================================================

  describe('Career Details', () => {
    test('should store career category', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Data Scientist',
        description: 'Analyzes data and builds ML models',
        category: 'Technology',
      });

      expect(career.category).toBe('Technology');
    });

    test('should store job title variants', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        jobTitles: ['SDE', 'Software Developer', 'Programmer', 'Full Stack Engineer'],
      });

      expect(career.jobTitles).toHaveLength(4);
      expect(career.jobTitles).toContain('SDE');
    });

    test('should store workplace information', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Consultant',
        description: 'Provides consulting services',
        workEnvironment: ['Corporate Office', 'Remote', 'Hybrid'],
        industryFocus: ['Technology', 'Finance', 'Healthcare'],
      });

      expect(career.workEnvironment).toHaveLength(3);
      expect(career.industryFocus).toContain('Finance');
    });

    test('should track required education level', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        requiredEducation: "Bachelor's in Computer Science",
        minimumExperience: 0,
        preferredExperience: 2,
      });

      expect(career.requiredEducation).toBe("Bachelor's in Computer Science");
      expect(career.minimumExperience).toBe(0);
      expect(career.preferredExperience).toBe(2);
    });
  });

  // =========================================================================
  // HOLLAND CODE MATCHING TESTS
  // =========================================================================

  describe('Holland Code Matching', () => {
    test('should store Holland Code domains matching', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        hollandCodes: {
          realistic: 15,
          investigative: 25,
          artistic: 5,
          social: 10,
          enterprising: 20,
          conventional: 15,
        },
      });

      expect(career.hollandCodes.investigative).toBe(25);
      expect(career.hollandCodes.realistic).toBe(15);
    });

    test('should store primary Holland Code match', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Data Scientist',
        description: 'Analyzes data',
        primaryHollandCode: 'I', // Investigative
        secondaryHollandCodes: ['R', 'A'], // Realistic, Artistic
      });

      expect(career.primaryHollandCode).toBe('I');
      expect(career.secondaryHollandCodes).toContain('R');
    });

    test('should accept all valid Holland Code combinations', async () => {
      const codes = ['R', 'I', 'A', 'S', 'E', 'C'];

      for (const code of codes) {
        const career = await Career.create({
          ...careerRequiredBase(),
          name: `Career ${code}`,
          description: 'Test',
          primaryHollandCode: code,
        });

        expect(career.primaryHollandCode).toBe(code);
        await Career.deleteOne({ _id: career._id });
      }
    });
  });

  // =========================================================================
  // SALARY INFORMATION TESTS
  // =========================================================================

  describe('Salary Information', () => {
    test('should store salary range with median', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        salary: {
          currency: 'INR',
          median: 750000,
          minimum: 400000,
          maximum: 2000000,
        },
      });

      expect(career.salary.median).toBe(750000);
      expect(career.salary.minimum).toBe(400000);
      expect(career.salary.currency).toBe('INR');
    });

    test('should track salary based on experience level', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Senior Software Engineer',
        description: 'Leads development',
        salaryByExperience: [
          { yearsOfExperience: 0, salary: 400000 },
          { yearsOfExperience: 3, salary: 800000 },
          { yearsOfExperience: 5, salary: 1500000 },
          { yearsOfExperience: 10, salary: 2500000 },
        ],
      });

      expect(career.salaryByExperience).toHaveLength(4);
      expect(career.salaryByExperience[2].salary).toBe(1500000);
    });

    test('should track salary growth potential', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Manager',
        description: 'Manages teams',
        salary: {
          currency: 'INR',
          median: 1000000,
        },
        salaryGrowthRate: 8, // 8% per year
        salaryGrowthOutlook: 'strong',
      });

      expect(career.salaryGrowthRate).toBe(8);
      expect(career.salaryGrowthOutlook).toBe('strong');
    });
  });

  // =========================================================================
  // SKILLS TESTS
  // =========================================================================

  describe('Required & Preferred Skills', () => {
    test('should store required technical skills', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Data Scientist',
        description: 'Analyzes data',
        requiredTechnicalSkills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
      });

      expect(career.requiredTechnicalSkills).toHaveLength(5);
      expect(career.requiredTechnicalSkills).toContain('Python');
    });

    test('should store soft skills', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Project Manager',
        description: 'Manages projects',
        softSkills: ['Leadership', 'Communication', 'Problem Solving', 'Time Management'],
      });

      expect(career.softSkills).toHaveLength(4);
      expect(career.softSkills).toContain('Leadership');
    });

    test('should store preferred skills (nice-to-have)', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        preferredSkills: ['Cloud Computing', 'DevOps', 'Kubernetes', 'Docker'],
      });

      expect(career.preferredSkills).toHaveLength(4);
    });
  });

  // =========================================================================
  // CAREER GROWTH TESTS
  // =========================================================================

  describe('Career Growth & Outlook', () => {
    test('should track job market demand', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'AI Engineer',
        description: 'Develops AI solutions',
        demandLevel: 'high',
        demandOutlook: 'growing',
        growthRate: 15, // 15% annual growth
      });

      expect(career.demandLevel).toBe('high');
      expect(career.growthRate).toBe(15);
    });

    test('should store career progression paths', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        progressionPaths: [
          { position: 'Senior Software Engineer', yearsRequired: 3 },
          { position: 'Team Lead', yearsRequired: 5 },
          { position: 'Engineering Manager', yearsRequired: 8 },
          { position: 'Director of Engineering', yearsRequired: 12 },
        ],
      });

      expect(career.progressionPaths).toHaveLength(4);
      expect(career.progressionPaths[1].position).toBe('Team Lead');
    });

    test('should track alternative career paths', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Consultant',
        description: 'Provides consulting',
        alternativeCareers: ['Project Manager', 'Product Manager', 'Entrepreneur'],
      });

      expect(career.alternativeCareers).toHaveLength(3);
    });
  });

  // =========================================================================
  // INDUSTRY & WORK STYLE TESTS
  // =========================================================================

  describe('Industry & Work Style', () => {
    test('should store relevant industries', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Financial Analyst',
        description: 'Analyzes financial data',
        relevantIndustries: ['Banking', 'Insurance', 'Investment', 'Healthcare'],
      });

      expect(career.relevantIndustries).toHaveLength(4);
    });

    test('should track typical work schedule and lifestyle', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Consultant',
        description: 'Provides consulting',
        workLifeBalance: 'moderate',
        typicalHoursPerWeek: 50,
        travelRequirement: 'frequent',
      });

      expect(career.workLifeBalance).toBe('moderate');
      expect(career.typicalHoursPerWeek).toBe(50);
    });
  });

  // =========================================================================
  // DESCRIPTION & DETAILS TESTS
  // =========================================================================

  describe('Career Description', () => {
    test('should store detailed role description', async () => {
      const longDesc = 'A comprehensive description of what software engineers do...';
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        detailedDescription: longDesc,
      });

      expect(career.detailedDescription).toBe(longDesc);
    });

    test('should store typical responsibilities', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Project Manager',
        description: 'Manages projects',
        responsibilities: [
          'Plan and schedule project activities',
          'Allocate resources',
          'Monitor project progress',
          'Manage stakeholder communication',
        ],
      });

      expect(career.responsibilities).toHaveLength(4);
    });

    test('should store typical challenges', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Entrepreneur',
        description: 'Starts ventures',
        challenges: ['High financial risk', 'Long working hours', 'Uncertain income'],
      });

      expect(career.challenges).toHaveLength(3);
    });
  });

  // =========================================================================
  // ADDITIONAL INFORMATION TESTS
  // =========================================================================

  describe('Additional Information', () => {
    test('should store icon/image URLs', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        icon: 'https://example.com/icons/engineer.png',
        imageUrl: 'https://example.com/images/engineer.jpg',
      });

      expect(career.icon).toBe('https://example.com/icons/engineer.png');
      expect(career.imageUrl).toBe('https://example.com/images/engineer.jpg');
    });

    test('should track if career is active/featured', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'AI Engineer',
        description: 'Develops AI',
        isActive: true,
        isFeatured: true,
      });

      expect(career.isActive).toBe(true);
      expect(career.isFeatured).toBe(true);
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient search by name', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Data Scientist',
        description: 'Analyzes data',
      });

      const found = await Career.findOne({ name: 'Data Scientist' });

      expect(found._id.toString()).toBe(career._id.toString());
    });

    test('should support efficient queries by Holland Code', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
        primaryHollandCode: 'I',
      });

      const findings = await Career.find({ primaryHollandCode: 'I' });

      expect(findings.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const career = await Career.create({
        ...careerRequiredBase(),
        name: 'Software Engineer',
        description: 'Develops software',
      });

      expect(career.createdAt).toBeDefined();
      expect(career.updatedAt).toBeDefined();
    });
  });
});
