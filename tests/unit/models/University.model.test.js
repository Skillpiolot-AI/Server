/**
 * University Model Tests
 * Tests for university/institution information and settings
 */

const mongoose = require('mongoose');
const University = require('../../../models/University');
const {
  testUniversities,
  generateId,
} = require('../../fixtures/testData');
const {
  cleanDatabase,
} = require('../../helpers/testHelpers');

describe('University Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid university with required fields', async () => {
      const universityData = {
        name: 'Delhi University',
      };

      const university = await University.create(universityData);

      expect(university._id).toBeDefined();
      expect(university.name).toBe('Delhi University');
    });

    test('should fail validation when name is missing', async () => {
      const universityData = {};

      await expect(University.create(universityData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // UNIVERSITY PROFILE TESTS
  // =========================================================================

  describe('University Profile', () => {
    test('should store university code/abbreviation', async () => {
      const university = await University.create({
        name: 'Indian Institute of Technology Delhi',
        code: 'IITD',
      });

      expect(university.code).toBe('IITD');
    });

    test('should store location information', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        location: {
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          campusType: 'Urban',
          coordinates: { latitude: 28.5465, longitude: 77.1881 },
        },
      });

      expect(university.location.city).toBe('Delhi');
      expect(university.location.country).toBe('India');
    });

    test('should store type/classification of university', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        type: 'Central Government University',
        category: 'Research Institution',
      });

      expect(university.type).toBe('Central Government University');
      expect(university.category).toBe('Research Institution');
    });

    test('should store founding year and history', async () => {
      const university = await University.create({
        name: 'Oxford University',
        foundingYear: 1096,
        description: 'Historic university in UK',
        establishedYear: 1096,
      });

      expect(university.foundingYear).toBe(1096);
      expect(university.description).toBe('Historic university in UK');
    });
  });

  // =========================================================================
  // AFFILIATED COLLEGES TESTS
  // =========================================================================

  describe('Affiliated Colleges', () => {
    test('should track affiliated colleges', async () => {
      const collegeIds = [generateId(), generateId(), generateId()];
      const university = await University.create({
        name: 'Delhi University',
        affiliatedColleges: collegeIds,
      });

      expect(university.affiliatedColleges).toHaveLength(3);
    });

    test('should track number of affiliated colleges', async () => {
      const university = await University.create({
        name: 'Delhi University',
        affiliatedCollegeCount: 77,
      });

      expect(university.affiliatedCollegeCount).toBe(77);
    });
  });

  // =========================================================================
  // ACADEMIC & PROGRAMS TESTS
  // =========================================================================

  describe('Academic Programs', () => {
    test('should list degree programs offered', async () => {
      const university = await University.create({
        name: 'MIT',
        degreePrograms: {
          undergraduate: ['BS in AI', 'BS in CS'],
          postgraduate: ['MS', 'PhD in Computer Science'],
          diploma: ['2-Year Diploma'],
        },
      });

      expect(university.degreePrograms.undergraduate).toHaveLength(2);
      expect(university.degreePrograms.postgraduate).toHaveLength(2);
    });

    test('should track total number of programs', async () => {
      const university = await University.create({
        name: 'Harvard University',
        totalPrograms: 51,
        faculties: [
          'Arts & Sciences',
          'Engineering & Applied Sciences',
          'Business School',
          'Law School',
          'Medical School',
        ],
      });

      expect(university.totalPrograms).toBe(51);
      expect(university.faculties).toHaveLength(5);
    });
  });

  // =========================================================================
  // RANKING & RATINGS TESTS
  // =========================================================================

  describe('Rankings & Ratings', () => {
    test('should store multiple ranking systems', async () => {
      const university = await University.create({
        name: 'Stanford University',
        rankings: {
          nirf: {
            rank: 3,
            category: 'Overall',
          },
          qsRanking: {
            rank: 5,
            year: 2024,
          },
          timesHigherEd: {
            rank: 8,
          },
        },
      });

      expect(university.rankings.nirf.rank).toBe(3);
      expect(university.rankings.qsRanking.rank).toBe(5);
    });

    test('should track overall university rating', async () => {
      const university = await University.create({
        name: 'Harvard University',
        overallRating: 4.9,
        ratingCount: 5000,
        averageReview: 'Excellent institution',
      });

      expect(university.overallRating).toBe(4.9);
      expect(university.ratingCount).toBe(5000);
    });
  });

  // =========================================================================
  // PLACEMENT & EMPLOYMENT TESTS
  // =========================================================================

  describe('Placement Statistics', () => {
    test('should track placement statistics', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        placementStats: {
          averageSalary: 1500000,
          highestPackage: 8500000,
          lowestPackage: 300000,
          placementRate: 98.5,
          totalPlacements: 5500,
        },
      });

      expect(university.placementStats.averageSalary).toBe(1500000);
      expect(university.placementStats.placementRate).toBe(98.5);
    });

    test('should track top recruiting companies', async () => {
      const university = await University.create({
        name: 'IIT Bombay',
        topCompanies: [
          { name: 'Google', packageOffered: 2200000, yearsRecruiting: 15 },
          { name: 'Microsoft', packageOffered: 2000000, yearsRecruiting: 12 },
        ],
      });

      expect(university.topCompanies).toHaveLength(2);
      expect(university.topCompanies[0].name).toBe('Google');
    });

    test('should track alumni employed at top companies', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        alumniAtTopCompanies: {
          Google: 450,
          Microsoft: 350,
          Amazon: 300,
          Apple: 200,
        },
      });

      expect(university.alumniAtTopCompanies.Google).toBe(450);
    });
  });

  // =========================================================================
  // STUDENT & FACULTY STATISTICS TESTS
  // =========================================================================

  describe('Student & Faculty Statistics', () => {
    test('should store student enrollment figures', async () => {
      const university = await University.create({
        name: 'MIT',
        students: {
          totalCount: 11500,
          undergraduate: 4600,
          postgraduate: 6900,
          domesticStudents: 9500,
          internationalStudents: 2000,
        },
      });

      expect(university.students.totalCount).toBe(11500);
      expect(university.students.internationalStudents).toBe(2000);
    });

    test('should store faculty information', async () => {
      const university = await University.create({
        name: 'Stanford University',
        faculty: {
          totalCount: 2300,
          fullTime: 2100,
          partTime: 200,
          phd: 2200,
          averageExperience: 15,
          studentTeacherRatio: 7,
        },
      });

      expect(university.faculty.totalCount).toBe(2300);
      expect(university.faculty.studentTeacherRatio).toBe(7);
    });
  });

  // =========================================================================
  // INFRASTRUCTURE & FACILITIES TESTS
  // =========================================================================

  describe('Infrastructure & Facilities', () => {
    test('should list available facilities', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        facilities: [
          'Library',
          'Computer Labs',
          'Auditorium',
          'Sports Complex',
          'Hostel',
          'Medical Center',
          'Research Centers',
        ],
      });

      expect(university.facilities).toHaveLength(7);
      expect(university.facilities).toContain('Library');
    });

    test('should store campus infrastructure details', async () => {
      const university = await University.create({
        name: 'Harvard University',
        infrastructure: {
          campusAreaSquareMiles: 209,
          buildings: 450,
          libraries: 17,
          libraryVolumes: 17000000,
          labsAndStudios: 300,
          computingFacilities: 5000,
        },
      });

      expect(university.infrastructure.campusAreaSquareMiles).toBe(209);
      expect(university.infrastructure.buildings).toBe(450);
    });
  });

  // =========================================================================
  // ACCREDITATION & CREDENTIALS TESTS
  // =========================================================================

  describe('Accreditation & Credentials', () => {
    test('should track accreditations and recognitions', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        accreditations: [
          { name: 'NAAC', grade: 'A++', year: 2023 },
          { name: 'NBA', status: 'Accredited', year: 2024 },
          { name: 'NIRF Ranking', rank: 15, category: 'Overall', year: 2024 },
        ],
      });

      expect(university.accreditations).toHaveLength(3);
      expect(university.accreditations[0].grade).toBe('A++');
    });

    test('should track international recognitions', async () => {
      const university = await University.create({
        name: 'Oxford University',
        internationalRecognitions: [
          'QS World Rankings',
          'Times Higher Education',
          'Shanghai Ranking',
        ],
      });

      expect(university.internationalRecognitions).toHaveLength(3);
    });
  });

  // =========================================================================
  // RESEARCH & INNOVATION TESTS
  // =========================================================================

  describe('Research & Innovation', () => {
    test('should track research output and citations', async () => {
      const university = await University.create({
        name: 'Stanford University',
        research: {
          annualResearchFunding: 1800000000,
          researchCenters: 120,
          publishedPapers: 8500,
          citedPublications: 45000,
          patents: 650,
        },
      });

      expect(university.research.annualResearchFunding).toBe(1800000000);
      expect(university.research.patents).toBe(650);
    });
  });

  // =========================================================================
  // INNOVATION & STARTUP ECOSYSTEMS TESTS
  // =========================================================================

  describe('Startup Ecosystem', () => {
    test('should track incubation and startup data', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        incubationProgram: {
          name: 'Startup Incubation Center',
          startups: 150,
          fundsAllocated: 50000000,
          successfulExits: 12,
        },
      });

      expect(university.incubationProgram.startups).toBe(150);
      expect(university.incubationProgram.successfulExits).toBe(12);
    });
  });

  // =========================================================================
  // ADMISSION & ENROLLMENT TESTS
  // =========================================================================

  describe('Admission & Enrollment', () => {
    test('should track admission statistics', async () => {
      const university = await University.create({
        name: 'MIT',
        admission: {
          admissionProcess: 'Holistic Review',
          acceptanceRate: 3.5,
          averageSAT: 1550,
          averageACT: 35,
          applicationDeadline: new Date('2024-12-31'),
        },
      });

      expect(university.admission.acceptanceRate).toBe(3.5);
      expect(university.admission.averageSAT).toBe(1550);
    });

    test('should track fee structure', async () => {
      const university = await University.create({
        name: 'Harvard University',
        fees: {
          currency: 'USD',
          tuitionFee: 60000,
          totalAnnualCost: 95000,
          scholarshipPercentage: 25,
          debtAverage: 10000,
        },
      });

      expect(university.fees.tuitionFee).toBe(60000);
      expect(university.fees.scholarshipPercentage).toBe(25);
    });
  });

  // =========================================================================
  // ALUMNI NETWORK TESTS
  // =========================================================================

  describe('Alumni Network', () => {
    test('should track alumni information', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        alumni: {
          totalAlumni: 50000,
          notableAlumni: [
            'Sundar Pichai',
            'Satya Nadella',
            'Naval Ravikant',
          ],
          alumniInLeadership: 500,
          averageAlumniSalary: 2000000,
        },
      });

      expect(university.alumni.totalAlumni).toBe(50000);
      expect(university.alumni.notableAlumni).toHaveLength(3);
    });
  });

  // =========================================================================
  // CONTACT & METADATA TESTS
  // =========================================================================

  describe('Contact & Metadata', () => {
    test('should store contact information', async () => {
      const university = await University.create({
        name: 'IIT Delhi',
        contactInfo: {
          phone: '+91-11-2659-1234',
          email: 'info@iitd.ac.in',
          website: 'https://www.iitd.ac.in',
          admissionEmail: 'admission@iitd.ac.in',
          address: 'Hauz Khas, New Delhi, India',
        },
      });

      expect(university.contactInfo.website).toBe('https://www.iitd.ac.in');
      expect(university.contactInfo.phone).toBe('+91-11-2659-1234');
    });

    test('should track university status and activity', async () => {
      const university = await University.create({
        name: 'Stanford University',
        isActive: true,
        isFeatured: true,
      });

      expect(university.isActive).toBe(true);
      expect(university.isFeatured).toBe(true);
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient search by name', async () => {
      const university = await University.create({
        name: 'MIT',
      });

      const found = await University.findOne({ name: 'MIT' });

      expect(found._id.toString()).toBe(university._id.toString());
    });

    test('should support efficient queries by location', async () => {
      const university = await University.create({
        name: 'College A',
        location: { city: 'Delhi' },
      });

      const delhiUniversities = await University.find({
        'location.city': 'Delhi',
      });

      expect(delhiUniversities.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const university = await University.create({
        name: 'Test University',
      });

      expect(university.createdAt).toBeDefined();
      expect(university.updatedAt).toBeDefined();
    });
  });
});
