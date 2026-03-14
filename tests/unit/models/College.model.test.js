/**
 * College Model Tests
 * Tests for college/institution information and rankings
 */

const mongoose = require('mongoose');
const College = require('../../../models/College');
const { testColleges, testUniversities, generateId } = require('../../fixtures/testData');
const { cleanDatabase } = require('../../helpers/testHelpers');

describe('College Model', () => {
  let testUniversity;

  beforeEach(async () => {
    await cleanDatabase();
    testUniversity = testUniversities[0];
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid college with required fields', async () => {
      const collegeData = {
        name: 'IIT Delhi',
        universityId: testUniversity._id,
      };

      const college = await College.create(collegeData);

      expect(college._id).toBeDefined();
      expect(college.name).toBe('IIT Delhi');
      expect(college.universityId.toString()).toBe(testUniversity._id.toString());
    });

    test('should fail validation when name is missing', async () => {
      const collegeData = {
        universityId: testUniversity._id,
      };

      await expect(College.create(collegeData)).rejects.toThrow();
    });

    test('should fail validation when universityId is missing', async () => {
      const collegeData = {
        name: 'IIT Delhi',
      };

      await expect(College.create(collegeData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // COLLEGE PROFILE TESTS
  // =========================================================================

  describe('College Profile', () => {
    test('should store college code/abbreviation', async () => {
      const college = await College.create({
        name: 'Indian Institute of Technology Delhi',
        universityId: testUniversity._id,
        code: 'IITD',
      });

      expect(college.code).toBe('IITD');
    });

    test('should store location information', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        location: {
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          campus: 'New Delhi',
          coordinates: { latitude: 28.5465, longitude: 77.1881 },
        },
      });

      expect(college.location.city).toBe('Delhi');
      expect(college.location.coordinates.latitude).toBe(28.5465);
    });

    test('should store founding year and history', async () => {
      const college = await College.create({
        name: 'Oxford University',
        universityId: testUniversity._id,
        foundingYear: 1096,
        description: 'Historic university in UK',
      });

      expect(college.foundingYear).toBe(1096);
      expect(college.description).toBe('Historic university in UK');
    });
  });

  // =========================================================================
  // ACADEMIC PROGRAMS TESTS
  // =========================================================================

  describe('Academic Programs', () => {
    test('should store list of departments', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        departments: [
          'Computer Science Engineering',
          'Electrical Engineering',
          'Mechanical Engineering',
          'Civil Engineering',
        ],
      });

      expect(college.departments).toHaveLength(4);
      expect(college.departments).toContain('Computer Science Engineering');
    });

    test('should track degree programs offered', async () => {
      const college = await College.create({
        name: 'MIT',
        universityId: testUniversity._id,
        degreePrograms: {
          undergraduate: ['BTech', 'BS'],
          postgraduate: ['MTech', 'MS', 'PhD'],
          diploma: ['2-Year Diploma'],
        },
      });

      expect(college.degreePrograms.undergraduate).toContain('BTech');
      expect(college.degreePrograms.postgraduate).toHaveLength(3);
    });

    test('should store specializations and streams', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        specializations: ['AI/ML', 'Cybersecurity', 'Cloud Computing', 'Data Science'],
      });

      expect(college.specializations).toHaveLength(4);
    });
  });

  // =========================================================================
  // RANKING & RATINGS TESTS
  // =========================================================================

  describe('Rankings & Ratings', () => {
    test('should store multiple ranking systems', async () => {
      const college = await College.create({
        name: 'Stanford University',
        universityId: testUniversity._id,
        rankings: {
          nirf: {
            rank: 5,
            overall: true,
          },
          qsRanking: {
            rank: 15,
          },
          timesHigherEd: {
            rank: 8,
          },
        },
      });

      expect(college.rankings.nirf.rank).toBe(5);
      expect(college.rankings.qsRanking.rank).toBe(15);
    });

    test('should track overall college rating', async () => {
      const college = await College.create({
        name: 'Harvard University',
        universityId: testUniversity._id,
        overallRating: 4.8,
        ratingCount: 2500,
      });

      expect(college.overallRating).toBe(4.8);
      expect(college.ratingCount).toBe(2500);
    });

    test('should store category-wise ratings', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        categoryRatings: {
          academics: 4.7,
          placements: 4.6,
          infrastructure: 4.5,
          faculty: 4.8,
          studentLife: 4.4,
        },
      });

      expect(college.categoryRatings.academics).toBe(4.7);
      expect(college.categoryRatings.faculty).toBe(4.8);
    });
  });

  // =========================================================================
  // PLACEMENT STATISTICS TESTS
  // =========================================================================

  describe('Placement Statistics', () => {
    test('should track placement rate and statistics', async () => {
      const college = await College.create({
        name: 'IIT Mumbai',
        universityId: testUniversity._id,
        placementStats: {
          placementRate: 98.5,
          averageSalary: 1500000,
          highestPackage: 8500000,
          lowestPackage: 600000,
          totalStudentsPlaced: 980,
          totalBatchSize: 1000,
        },
      });

      expect(college.placementStats.placementRate).toBe(98.5);
      expect(college.placementStats.averageSalary).toBe(1500000);
    });

    test('should track top recruiting companies', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        topCompanies: [
          { name: 'Google', packageOffered: 2000000 },
          { name: 'Microsoft', packageOffered: 1800000 },
          { name: 'Amazon', packageOffered: 1700000 },
          { name: 'Samsung', packageOffered: 1200000 },
        ],
      });

      expect(college.topCompanies).toHaveLength(4);
      expect(college.topCompanies[0].name).toBe('Google');
    });

    test('should track placement trends by year', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        placementTrendsHistory: [
          { year: 2022, placementRate: 95.5, avgSalary: 1200000 },
          { year: 2023, placementRate: 97.2, avgSalary: 1350000 },
          { year: 2024, placementRate: 98.5, avgSalary: 1500000 },
        ],
      });

      expect(college.placementTrendsHistory).toHaveLength(3);
    });
  });

  // =========================================================================
  // INFRASTRUCTURE & FACILITIES TESTS
  // =========================================================================

  describe('Infrastructure & Facilities', () => {
    test('should list available facilities', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        facilities: [
          'Library',
          'Computer Labs',
          'Auditorium',
          'Sports Complex',
          'Hostel',
          'Cafeteria',
          'Medical Center',
        ],
      });

      expect(college.facilities).toHaveLength(7);
      expect(college.facilities).toContain('Library');
    });

    test('should store campus infrastructure info', async () => {
      const college = await College.create({
        name: 'MIT',
        universityId: testUniversity._id,
        infrastructure: {
          campusArea: 168, // in acres
          labs: 45,
          classrooms: 120,
          libraryVolumes: 250000,
          computerTerminals: 3500,
        },
      });

      expect(college.infrastructure.campusArea).toBe(168);
      expect(college.infrastructure.labs).toBe(45);
    });
  });

  // =========================================================================
  // ADMISSION & ELIGIBILITY TESTS
  // =========================================================================

  describe('Admission & Eligibility', () => {
    test('should track admission process information', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        admission: {
          process: ['JEE Mains', 'JEE Advanced', 'Counseling'],
          minimumPercentile: 99.5,
          cutoffRank: 250,
          applicationDeadline: new Date('2024-12-31'),
        },
      });

      expect(college.admission.process).toContain('JEE Mains');
      expect(college.admission.minimumPercentile).toBe(99.5);
    });

    test('should store fee information', async () => {
      const college = await College.create({
        name: 'Harvard University',
        universityId: testUniversity._id,
        fees: {
          currency: 'USD',
          tuition: 55000,
          totalAnnualCost: 95000,
          scholarshipPercentage: 20,
        },
      });

      expect(college.fees.tuition).toBe(55000);
      expect(college.fees.scholarshipPercentage).toBe(20);
    });
  });

  // =========================================================================
  // FACULTY & RESOURCES TESTS
  // =========================================================================

  describe('Faculty & Resources', () => {
    test('should store faculty statistics', async () => {
      const college = await College.create({
        name: 'Stanford University',
        universityId: testUniversity._id,
        faculty: {
          totalCount: 2300,
          phd: 2100,
          averageExperience: 12,
          studentTeacherRatio: 7,
          withInternationalExperience: 1800,
        },
      });

      expect(college.faculty.totalCount).toBe(2300);
      expect(college.faculty.studentTeacherRatio).toBe(7);
    });
  });

  // =========================================================================
  // ACCREDITATION & CERTIFICATIONS TESTS
  // =========================================================================

  describe('Accreditation & Certifications', () => {
    test('should track accreditations', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        accreditations: [
          { name: 'NAAC', grade: 'A++', year: 2023 },
          { name: 'NBA', category: 'Engineering', status: 'Accredited' },
        ],
      });

      expect(college.accreditations).toHaveLength(2);
      expect(college.accreditations[0].grade).toBe('A++');
    });
  });

  // =========================================================================
  // ALUMNI & NETWORK TESTS
  // =========================================================================

  describe('Alumni & Network', () => {
    test('should track alumni information', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        alumni: {
          totalCount: 45000,
          successfulAlumni: ['Sundar Pichai (Google CEO)', 'Satya Nadella (Microsoft CEO)'],
          averageNetWorth: 'High',
        },
      });

      expect(college.alumni.totalCount).toBe(45000);
      expect(college.alumni.successfulAlumni).toHaveLength(2);
    });
  });

  // =========================================================================
  // CONTACT & METADATA TESTS
  // =========================================================================

  describe('Contact & Metadata', () => {
    test('should store contact information', async () => {
      const college = await College.create({
        name: 'IIT Delhi',
        universityId: testUniversity._id,
        contactInfo: {
          phone: '+91-11-2659-1234',
          email: 'admission@iitd.ac.in',
          website: 'https://www.iitd.ac.in',
          admissionEmail: 'admissions@iitd.ac.in',
        },
      });

      expect(college.contactInfo.phone).toBe('+91-11-2659-1234');
      expect(college.contactInfo.website).toBe('https://www.iitd.ac.in');
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient search by name', async () => {
      const college = await College.create({
        name: 'IIT Bombay',
        universityId: testUniversity._id,
      });

      const found = await College.findOne({ name: 'IIT Bombay' });

      expect(found._id.toString()).toBe(college._id.toString());
    });

    test('should support efficient queries by universityId', async () => {
      const college = await College.create({
        name: 'Engineering College',
        universityId: testUniversity._id,
      });

      const collegesByUni = await College.find({ universityId: testUniversity._id });

      expect(collegesByUni.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const college = await College.create({
        name: 'NIT Delhi',
        universityId: testUniversity._id,
      });

      expect(college.createdAt).toBeDefined();
      expect(college.updatedAt).toBeDefined();
    });
  });
});
