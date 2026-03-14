/**
 * College Controller Tests
 * Tests for college management, rankings, placements, and academic programs
 * Focus: Are college rankings accurate? Are statistics correct?
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const College = require('../../../models/College');
const University = require('../../../models/University');
const User = require('../../../models/User');
const { testColleges, generateId } = require('../../fixtures/testData');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('College Controller', () => {
  let testCollege;
  let testUniversity;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();

    testUniversity = await University.create({
      name: 'Test University',
      code: 'TU001',
    });

    testCollege = await College.create({
      name: 'Test Engineering College',
      code: 'TEC001',
      universityId: testUniversity._id,
      location: {
        city: 'Test City',
        state: 'Test State',
        coordinates: {
          lat: 28.1234,
          lng: 77.5678,
        },
      },
      foundingYear: 2005,
    });

    adminUser = await createTestUser('Admin');
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // COLLEGE RETRIEVAL TESTS
  // =========================================================================
  describe('College Retrieval', () => {
    test('should get college profile', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.college).toBeDefined();
      expect(response.body.college.name).toBe('Test Engineering College');
    });

    test('should list all colleges', async () => {
      const response = await request(app)
        .get('/api/colleges')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.colleges)).toBe(true);
      expect(response.body.colleges.length).toBeGreaterThan(0);
    });

    test('should filter colleges by university', async () => {
      const response = await request(app)
        .get('/api/colleges')
        .query({ universityId: testUniversity._id })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.colleges.forEach(college => {
        expect(college.universityId.toString()).toBe(testUniversity._id.toString());
      });
    });

    test('should filter colleges by state/city', async () => {
      const response = await request(app)
        .get('/api/colleges')
        .query({ state: 'Test State' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.colleges.forEach(college => {
        expect(college.location.state).toBe('Test State');
      });
    });

    test('should search colleges by name', async () => {
      const response = await request(app)
        .get('/api/colleges/search')
        .query({ q: 'Engineering' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });

  // =========================================================================
  // COLLEGE RANKING TESTS
  // =========================================================================
  describe('College Rankings', () => {
    test('should retrieve all college rankings', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        ranking: {
          nirf: {
            overall: 25,
            engineering: 15,
            rank: 25,
          },
          qs: {
            rank: 250,
            region: 'Asia',
          },
          timesHigherEd: {
            rank: 350,
            world: true,
          },
        },
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/rankings`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rankings).toBeDefined();
      expect(response.body.rankings.nirf).toBeDefined();
    });

    test('should update college NIRF ranking', async () => {
      const response = await request(app)
        .patch(`/api/colleges/${testCollege._id}/rankings/nirf`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          overall: 30,
          engineering: 20,
          management: 40,
        });

      expect(response.status).toBe(200);
      expect(response.body.college.ranking.nirf).toBeDefined();
    });

    test('should update college category ratings', async () => {
      const response = await request(app)
        .patch(`/api/colleges/${testCollege._id}/category-ratings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          academics: 4.5,
          placements: 4.2,
          infrastructure: 4.0,
          faculty: 4.3,
          studentLife: 3.8,
        });

      expect(response.status).toBe(200);
      expect(response.body.college.categoryRatings).toBeDefined();
    });

    test('should sort colleges by ranking', async () => {
      const response = await request(app)
        .get('/api/colleges')
        .query({ sortBy: 'nirf', order: 'asc' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.colleges.length > 1) {
        for (let i = 0; i < response.body.colleges.length - 1; i++) {
          const curr = response.body.colleges[i].ranking?.nirf?.overall || 999;
          const next = response.body.colleges[i + 1].ranking?.nirf?.overall || 999;
          expect(curr).toBeLessThanOrEqual(next);
        }
      }
    });
  });

  // =========================================================================
  // PLACEMENT STATISTICS TESTS
  // =========================================================================
  describe('Placement Statistics', () => {
    test('should get placement statistics', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        placement: {
          rate: 95,
          averageSalary: 700000,
          highestPackage: 1500000,
          topCompanies: ['Google', 'Microsoft', 'Amazon'],
          placementTrend: [
            { year: 2021, rate: 90 },
            { year: 2022, rate: 93 },
            { year: 2023, rate: 95 },
          ],
        },
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/placements`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.placement).toBeDefined();
      expect(response.body.placement.rate).toBe(95);
      expect(response.body.placement.averageSalary).toBe(700000);
    });

    test('should calculate placement rate accuracy', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/placements/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.analytics) {
        expect(response.body.analytics.totalStudents).toBeDefined();
        expect(response.body.analytics.placedStudents).toBeDefined();
        expect(response.body.analytics.placementRate).toBeGreaterThanOrEqual(0);
        expect(response.body.analytics.placementRate).toBeLessThanOrEqual(100);
      }
    });

    test('should show salary distribution', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/placements/salary-distribution`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.distribution).toBeDefined();
    });

    test('should verify top recruiting companies', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/placements/top-companies`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.companies)).toBe(true);
    });
  });

  // =========================================================================
  // ACADEMIC PROGRAMS TESTS
  // =========================================================================
  describe('Academic Programs', () => {
    test('should list all academic programs', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        academicPrograms: [
          {
            name: 'B.Tech CSE',
            degree: 'BTech',
            duration: 4,
            specialization: 'Computer Science',
            students: 120,
          },
          {
            name: 'B.Tech ECE',
            degree: 'BTech',
            duration: 4,
            specialization: 'Electronics',
            students: 100,
          },
          {
            name: 'MBA',
            degree: 'MBA',
            duration: 2,
            specialization: 'General',
            students: 60,
          },
        ],
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/programs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.programs)).toBe(true);
      expect(response.body.programs.length).toBe(3);
    });

    test('should get program details', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/programs/BTech`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('should add new program', async () => {
      const response = await request(app)
        .post(`/api/colleges/${testCollege._id}/programs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'M.Tech AI',
          degree: 'MTech',
          duration: 2,
          specialization: 'Artificial Intelligence',
          seats: 40,
          fees: 500000,
        });

      expect(response.status).toBe(200);
    });

    test('should update program details', async () => {
      const response = await request(app)
        .patch(`/api/colleges/${testCollege._id}/programs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          programName: 'B.Tech CSE',
          seats: 130,
          fees: 100000,
        });

      expect([200, 404]).toContain(response.status);
    });

    test('should track program statistics', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/programs/statistics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics).toBeDefined();
    });
  });

  // =========================================================================
  // INFRASTRUCTURE & FACILITIES TESTS
  // =========================================================================
  describe('Infrastructure', () => {
    test('should get infrastructure details', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        infrastructure: {
          campusArea: 50,
          labs: 20,
          classrooms: 75,
          auditoriums: 3,
          library: {
            volumes: 100000,
            computerTerminals: 200,
            seatingCapacity: 500,
          },
          hostels: 4,
          sportsFacilities: ['Cricket', 'Football', 'Basketball'],
        },
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/infrastructure`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.infrastructure).toBeDefined();
      expect(response.body.infrastructure.campusArea).toBe(50);
    });

    test('should update infrastructure information', async () => {
      const response = await request(app)
        .patch(`/api/colleges/${testCollege._id}/infrastructure`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          labs: 25,
          classrooms: 80,
          library: {
            volumes: 120000,
            computerTerminals: 250,
          },
        });

      expect(response.status).toBe(200);
    });

    test('should list all facilities', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/facilities`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.facilities)).toBe(true);
    });
  });

  // =========================================================================
  // ADMISSION PROCESS TESTS
  // =========================================================================
  describe('Admission Process', () => {
    test('should get admission details', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        admissionProcess: {
          examRequired: 'JEE Main',
          percentileCutoff: 75,
          applicationDeadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          fees: {
            tuition: 100000,
            total: 150000,
            scholarship: 30,
          },
        },
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/admission`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.admission).toBeDefined();
      expect(response.body.admission.examRequired).toBe('JEE Main');
    });

    test('should update admission requirements', async () => {
      const response = await request(app)
        .patch(`/api/colleges/${testCollege._id}/admission`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examRequired: 'JEE Advanced',
          percentileCutoff: 80,
          fees: {
            tuition: 120000,
            total: 170000,
          },
        });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // FACULTY STATISTICS TESTS
  // =========================================================================
  describe('Faculty Information', () => {
    test('should get faculty statistics', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        faculty: {
          total: 200,
          phd: 100,
          avgExperienceYears: 12,
          studentTeacherRatio: '1:25',
        },
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/faculty`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.faculty).toBeDefined();
      expect(response.body.faculty.total).toBe(200);
      expect(response.body.faculty.phdPercentage).toBe(50);
    });

    test('should update faculty information', async () => {
      const response = await request(app)
        .patch(`/api/colleges/${testCollege._id}/faculty`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          total: 220,
          phd: 120,
          avgExperienceYears: 13,
        });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // ACCREDITATION TESTS
  // =========================================================================
  describe('Accreditation', () => {
    test('should get accreditation status', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        accreditation: {
          naac: {
            grade: 'A+',
            cycle: 3,
            validityFrom: new Date(2020, 0, 1),
            validityTo: new Date(2027, 0, 1),
          },
          nba: {
            certified: true,
            programs: ['CSE', 'ECE'],
          },
          iso: '9001:2015',
        },
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/accreditation`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.accreditation).toBeDefined();
      expect(response.body.accreditation.naac.grade).toBe('A+');
    });

    test('should update accreditation details', async () => {
      const response = await request(app)
        .patch(`/api/colleges/${testCollege._id}/accreditation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nbaPrograms: ['CSE', 'ECE', 'Mechanical'],
          iso: '9001:2015',
        });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // STUDENT LIFE & CULTURE TESTS
  // =========================================================================
  describe('Student Life and Culture', () => {
    test('should get student life information', async () => {
      await College.findByIdAndUpdate(testCollege._id, {
        studentLife: {
          clubs: 50,
          events: '200/year',
          domesticStudents: 3500,
          internationalStudents: 200,
          genderRatio: '65:35',
          avgCGPA: 7.5,
        },
      });

      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/student-life`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.studentLife).toBeDefined();
      expect(response.body.studentLife.clubs).toBe(50);
    });

    test('should list clubs and societies', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/clubs`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.clubs)).toBe(true);
    });
  });

  // =========================================================================
  // ALUMNI NETWORK TESTS
  // =========================================================================
  describe('Alumni Network', () => {
    test('should get alumni statistics', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/alumni`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.alumni).toBeDefined();
    });

    test('should track alumni at top companies', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}/alumni/top-companies`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.companies)).toBe(true);
    });
  });

  // =========================================================================
  // COMPARISON TESTS
  // =========================================================================
  describe('College Comparison', () => {
    test('should compare two colleges', async () => {
      const college2 = await College.create({
        name: 'Another College',
        code: 'AC001',
        universityId: testUniversity._id,
      });

      const response = await request(app)
        .post('/api/colleges/compare')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          collegeIds: [testCollege._id, college2._id],
        });

      expect(response.status).toBe(200);
      expect(response.body.comparison).toBeDefined();
    });

    test('should show key differences in rankings and stats', async () => {
      const college2 = await College.create({
        name: 'Another College',
        code: 'AC001',
        universityId: testUniversity._id,
        ranking: {
          nirf: { overall: 50 },
        },
      });

      const response = await request(app)
        .get('/api/colleges/compare/summary')
        .query({
          colleges: [testCollege._id, college2._id],
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // ACCESS CONTROL TESTS
  // =========================================================================
  describe('Access Control', () => {
    test('Admin should access college data', async () => {
      const response = await request(app)
        .get(`/api/colleges/${testCollege._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Public should view college profile', async () => {
      const response = await request(app).get(`/api/colleges/${testCollege._id}/public`);

      expect(response.status).toBe(200);
    });
  });
});
