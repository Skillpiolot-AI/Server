/**
 * University Controller Tests
 * Tests for university management, college affiliation, and university statistics
 * Focus: Can universities manage their colleges? Are stats accurate?
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const University = require('../../../models/University');
const College = require('../../../models/College');
const User = require('../../../models/User');
const {
  testUniversities,
  generateId,
} = require('../../fixtures/testData');
const {
  cleanDatabase,
  createTestUser,
  getValidJWT,
} = require('../../helpers/testHelpers');

describe('University Controller', () => {
  let testUniversity;
  let uniAdminUser;
  let uniAdminToken;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();

    // Create university
    testUniversity = await University.create({
      name: 'Test University',
      code: 'TU001',
      location: {
        city: 'Test City',
        state: 'Test State',
      },
      foundingYear: 2000,
      affiliatedColleges: [],
    });

    // Create users
    uniAdminUser = await User.create({
      username: 'uniadmin1',
      name: 'University Admin',
      email: 'uniadmin@test.com',
      password: 'pass123',
      role: 'UniAdmin',
      universityId: testUniversity._id,
    });

    adminUser = await createTestUser('Admin');

    uniAdminToken = getValidJWT(uniAdminUser._id, 'UniAdmin');
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // UNIVERSITY RETRIEVAL TESTS
  // =========================================================================
  describe('University Retrieval', () => {
    test('should get university profile', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.university).toBeDefined();
      expect(response.body.university.name).toBe('Test University');
    });

    test('should list all universities', async () => {
      const response = await request(app)
        .get('/api/universities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.universities)).toBe(true);
      expect(response.body.universities.length).toBeGreaterThan(0);
    });

    test('should include affiliated colleges in university profile', async () => {
      // Create and affilate college
      const college = await College.create({
        name: 'Test College',
        code: 'TC001',
        universityId: testUniversity._id,
      });

      await University.findByIdAndUpdate(testUniversity._id, {
        $push: { affiliatedColleges: college._id },
      });

      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.university.affiliatedColleges).toBeDefined();
      expect(response.body.university.affiliatedColleges.length).toBeGreaterThan(0);
    });

    test('should filter universities by location', async () => {
      const response = await request(app)
        .get('/api/universities')
        .query({ state: 'Test State' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.universities.forEach(uni => {
        expect(uni.location.state).toBe('Test State');
      });
    });
  });

  // =========================================================================
  // UNIVERSITY UPDATE TESTS
  // =========================================================================
  describe('University Profile Updates', () => {
    test('UniAdmin should update university profile', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          description: 'A top-tier university',
          website: 'https://testuniversity.edu',
        });

      expect(response.status).toBe(200);
      expect(response.body.university.description).toBe('A top-tier university');
    });

    test('UniAdmin should NOT update other universities', async () => {
      const otherUni = await University.create({
        name: 'Other University',
        code: 'OU001',
      });

      const response = await request(app)
        .patch(`/api/universities/${otherUni._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          description: 'Hacked',
        });

      expect(response.status).toBe(403);
    });

    test('should update university rankings', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}/rankings`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          nirf: { rank: 5, category: 'Overall' },
          qs: { rank: 150, region: 'Asia' },
          times: { rank: 250, world: true },
        });

      expect(response.status).toBe(200);
      expect(response.body.university.rankings).toBeDefined();
    });

    test('should track accreditation details', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          accreditation: {
            naac: { grade: 'A+', cycle: 3 },
            nba: { certified: true, programs: ['CSE'] },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.university.accreditation).toBeDefined();
    });
  });

  // =========================================================================
  // COLLEGE AFFILIATION TESTS
  // =========================================================================
  describe('College Affiliation', () => {
    test('UniAdmin should affiliate new college', async () => {
      const college = await College.create({
        name: 'New College',
        code: 'NC001',
      });

      const response = await request(app)
        .post(`/api/universities/${testUniversity._id}/colleges`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          collegeId: college._id,
        });

      expect(response.status).toBe(200);
    });

    test('should remove college affiliation', async () => {
      const college = await College.create({
        name: 'Affiliated College',
        code: 'AC001',
        universityId: testUniversity._id,
      });

      await University.findByIdAndUpdate(testUniversity._id, {
        $push: { affiliatedColleges: college._id },
      });

      const response = await request(app)
        .delete(`/api/universities/${testUniversity._id}/colleges/${college._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
    });

    test('should list all affiliated colleges with their stats', async () => {
      const college1 = await College.create({
        name: 'College 1',
        code: 'C1001',
        universityId: testUniversity._id,
      });

      const college2 = await College.create({
        name: 'College 2',
        code: 'C2001',
        universityId: testUniversity._id,
      });

      await University.findByIdAndUpdate(testUniversity._id, {
        affiliatedColleges: [college1._id, college2._id],
      });

      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/colleges`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.colleges.length).toBe(2);
    });
  });

  // =========================================================================
  // STATISTICS & ANALYTICS TESTS
  // =========================================================================
  describe('University Statistics', () => {
    beforeEach(async () => {
      // Create test colleges
      await College.create([
        {
          name: 'Engineering College',
          code: 'EC001',
          universityId: testUniversity._id,
          academicPrograms: [
            { name: 'B.Tech CSE', degree: 'BTech', students: 100 },
            { name: 'B.Tech ECE', degree: 'BTech', students: 80 },
          ],
          ranking: { nirf: 25 },
        },
        {
          name: 'Arts College',
          code: 'AC001',
          universityId: testUniversity._id,
          academicPrograms: [
            { name: 'BA English', degree: 'BA', students: 60 },
          ],
          ranking: { nirf: 50 },
        },
      ]);
    });

    test('should calculate total student enrollment', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/statistics`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics.totalStudents).toBeDefined();
      expect(response.body.statistics.totalStudents).toBeGreaterThan(0);
    });

    test('should calculate student distribution by program', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/statistics`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics.studentsByProgram).toBeDefined();
    });

    test('should aggregate college rankings', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/statistics`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics.averageNirfRank).toBeDefined();
      expect(response.body.statistics.averageNirfRank).toBeLessThan(200);
    });

    test('should track faculty statistics', async () => {
      await University.findByIdAndUpdate(testUniversity._id, {
        faculty: {
          total: 500,
          phd: 250,
          avgExperienceYears: 10,
          facultyStudentRatio: '1:20',
        },
      });

      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/statistics`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics.faculty).toBeDefined();
    });

    test('should show placement statistics', async () => {
      await University.findByIdAndUpdate(testUniversity._id, {
        placement: {
          averageSalary: 800000,
          highestPackage: 2000000,
          topCompanies: ['Google', 'Amazon', 'Microsoft'],
        },
      });

      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/statistics`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics.placement).toBeDefined();
    });

    test('should provide research output statistics', async () => {
      await University.findByIdAndUpdate(testUniversity._id, {
        research: {
          annualFunding: 5000000,
          centers: 10,
          publishedPapers: 1500,
          citations: 25000,
          patents: 50,
        },
      });

      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/statistics`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics.research).toBeDefined();
    });
  });

  // =========================================================================
  // PROGRAM MANAGEMENT TESTS
  // =========================================================================
  describe('Academic Programs', () => {
    test('should list all academic programs', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/programs`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.programs)).toBe(true);
    });

    test('UniAdmin should add new program', async () => {
      const response = await request(app)
        .post(`/api/universities/${testUniversity._id}/programs`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          name: 'M.Tech AI',
          degree: 'MTech',
          duration: 2,
          specialization: 'Artificial Intelligence',
        });

      expect(response.status).toBe(200);
    });

    test('should update program details', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}/programs`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          programId: new mongoose.Types.ObjectId(),
          seats: 60,
          fees: 500000,
        });

      expect([200, 404]).toContain(response.status);
    });

    test('should deactivate program', async () => {
      const response = await request(app)
        .delete(`/api/universities/${testUniversity._id}/programs`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          programId: new mongoose.Types.ObjectId(),
        });

      expect([200, 404]).toContain(response.status);
    });
  });

  // =========================================================================
  // STUDENT MANAGEMENT TESTS
  // =========================================================================
  describe('Student Management', () => {
    test('UniAdmin should view university students', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/students`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.students)).toBe(true);
    });

    test('should filter students by college and program', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/students`)
        .query({ collegeId: new mongoose.Types.ObjectId(), program: 'BTech CSE' })
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
    });

    test('UniAdmin should send bulk message to students', async () => {
      const response = await request(app)
        .post(`/api/universities/${testUniversity._id}/notify-students`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          message: 'Important announcement',
          filters: { program: 'BTech CSE' },
        });

      expect(response.status).toBe(200);
    });

    test('should track student performance metrics', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/students/analytics`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analytics).toBeDefined();
    });
  });

  // =========================================================================
  // INFRASTRUCTURE & FACILITIES TESTS
  // =========================================================================
  describe('Infrastructure and Facilities', () => {
    test('UniAdmin should update infrastructure details', async () => {
      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}/infrastructure`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          campuses: 2,
          libraries: 3,
          labs: 25,
          computerTerminals: 500,
          auditoriums: 5,
          hostels: 4,
        });

      expect(response.status).toBe(200);
      expect(response.body.university.infrastructure).toBeDefined();
    });

    test('should list all facilities', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/facilities`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.facilities)).toBe(true);
    });

    test('UniAdmin should add new facility', async () => {
      const response = await request(app)
        .post(`/api/universities/${testUniversity._id}/facilities`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          name: 'New Lab',
          type: 'laboratory',
          capacity: 50,
        });

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // PERMISSIONS & DELEGATION TESTS
  // =========================================================================
  describe('Permissions and Delegation', () => {
    test('UniAdmin should grant permissions to teachers', async () => {
      const teacher = await User.create({
        username: 'teacher1',
        name: 'Teacher',
        email: 'teacher@test.com',
        password: 'pass123',
        role: 'UniTeach',
        universityId: testUniversity._id,
      });

      const response = await request(app)
        .post(`/api/universities/${testUniversity._id}/permissions`)
        .set('Authorization', `Bearer ${uniAdminToken}`)
        .send({
          userId: teacher._id,
          permissions: ['grade_students', 'create_assignments'],
        });

      expect(response.status).toBe(200);
    });

    test('UniAdmin should revoke permissions', async () => {
      const teacherId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/universities/${testUniversity._id}/permissions/${teacherId}`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  // =========================================================================
  // AUDIT & REPORTING TESTS
  // =========================================================================
  describe('Audit and Reporting', () => {
    test('should access university audit log', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/audit-log`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    test('should generate university compliance report', async () => {
      const response = await request(app)
        .get(`/api/universities/${testUniversity._id}/compliance-report`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.report).toBeDefined();
    });

    test('Admin should view all universities compliance', async () => {
      const response = await request(app)
        .get('/api/admin/universities/compliance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // ACCESS CONTROL TESTS
  // =========================================================================
  describe('Access Control', () => {
    test('UniTeach should NOT manage university', async () => {
      const teacher = await User.create({
        username: 'teacher1',
        name: 'Teacher',
        email: 'teacher@test.com',
        password: 'pass123',
        role: 'UniTeach',
        universityId: testUniversity._id,
      });

      const teacherToken = getValidJWT(teacher._id, 'UniTeach');

      const response = await request(app)
        .patch(`/api/universities/${testUniversity._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          description: 'Hacked',
        });

      expect(response.status).toBe(403);
    });

    test('Student should only view own university info', async () => {
      const otherUni = await University.create({
        name: 'Other University',
        code: 'OU001',
      });

      const response = await request(app)
        .get(`/api/universities/${otherUni._id}`)
        .set('Authorization', `Bearer ${uniAdminToken}`);

      expect(response.status).toBe(403);
    });
  });
});
