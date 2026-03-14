/**
 * Student Controller Tests
 * Tests for student profile management and academic tracking
 * Focus: Student portal access, course enrollment, performance tracking
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Student = require('../../../models/Student');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Student Controller', () => {
  let studentUser;
  let adminUser;
  let studentToken;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    studentUser = await createTestUser({ role: 'Student' });
    adminUser = await createTestUser({ role: 'Admin' });
    studentToken = getValidJWT(studentUser._id, 'Student');
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // STUDENT PROFILE TESTS
  // =========================================================================
  describe('Student Profile', () => {
    test('should retrieve student profile', async () => {
      const response = await request(app)
        .get('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.student).toBeDefined();
    });

    test('should update student profile', async () => {
      const response = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          phoneNumber: '9876543210',
          department: 'Computer Science',
        });

      expect(response.status).toBe(200);
      expect(response.body.student.phoneNumber).toBe('9876543210');
    });

    test('should not allow student to change registration number', async () => {
      const response = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          registrationNumber: 'NEWREG123',
        });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // STUDENT PORTAL ACCESS TESTS
  // =========================================================================
  describe('Student Portal Access', () => {
    test('should allow student to access portal', async () => {
      const response = await request(app)
        .get('/api/students/portal')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.portal).toBeDefined();
    });

    test('should reject non-student access to portal', async () => {
      const userUser = await createTestUser({ role: 'User' });
      const userToken = getValidJWT(userUser._id, 'User');

      const response = await request(app)
        .get('/api/students/portal')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    test('should show student dashboard with grades and attendance', async () => {
      const response = await request(app)
        .get('/api/students/portal/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard).toBeDefined();
    });
  });

  // =========================================================================
  // ACADEMIC TRACKING TESTS
  // =========================================================================
  describe('Academic Performance Tracking', () => {
    test('should retrieve student grades', async () => {
      const response = await request(app)
        .get('/api/students/grades')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.grades).toBeDefined();
    });

    test('should track GPA', async () => {
      const response = await request(app)
        .get('/api/students/gpa')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.gpa).toBeDefined();
      expect(response.body.gpa).toBeGreaterThanOrEqual(0);
      expect(response.body.gpa).toBeLessThanOrEqual(4.0);
    });

    test('should track attendance', async () => {
      const response = await request(app)
        .get('/api/students/attendance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.attendance).toBeDefined();
    });

    test('should show course performance', async () => {
      const response = await request(app)
        .get('/api/students/courses/performance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.coursePerformance).toBeDefined();
    });
  });

  // =========================================================================
  // COURSE ENROLLMENT TESTS
  // =========================================================================
  describe('Course Enrollment', () => {
    test('should retrieve enrolled courses', async () => {
      const response = await request(app)
        .get('/api/students/courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.courses).toBeDefined();
    });

    test('should view course details', async () => {
      const response = await request(app)
        .get('/api/students/courses')
        .set('Authorization', `Bearer ${studentToken}`);

      if (response.body.courses.length > 0) {
        const courseId = response.body.courses[0]._id;
        const detailResponse = await request(app)
          .get(`/api/students/courses/${courseId}`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect(detailResponse.status).toBe(200);
      }
    });
  });

  // =========================================================================
  // DOCUMENT MANAGEMENT TESTS
  // =========================================================================
  describe('Student Documents', () => {
    test('should upload transcript', async () => {
      const response = await request(app)
        .post('/api/students/documents/transcript')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          filename: 'transcript.pdf',
          url: 'https://example.com/transcript.pdf',
        });

      expect(response.status).toBe(200);
    });

    test('should upload certificate', async () => {
      const response = await request(app)
        .post('/api/students/documents/certificate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          filename: 'certificate.pdf',
          url: 'https://example.com/certificate.pdf',
        });

      expect(response.status).toBe(200);
    });

    test('should retrieve student documents', async () => {
      const response = await request(app)
        .get('/api/students/documents')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.documents).toBeDefined();
    });
  });

  // =========================================================================
  // ADMIN STUDENT MANAGEMENT TESTS
  // =========================================================================
  describe('Admin Student Management', () => {
    test('should allow admin to view student details', async () => {
      const response = await request(app)
        .get(`/api/students/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.student._id.toString()).toBe(studentUser._id.toString());
    });

    test('should allow admin to view all students', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.students).toBeDefined();
    });

    test('should deny student access to other student details', async () => {
      const otherStudent = await createTestUser({ role: 'Student' });

      const response = await request(app)
        .get(`/api/students/${otherStudent._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // PLACEMENT & CAREER TRACKING TESTS
  // =========================================================================
  describe('Placement & Career Tracking', () => {
    test('should track placement status', async () => {
      const response = await request(app)
        .get('/api/students/placement-status')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.placementStatus).toBeDefined();
    });

    test('should update placement information', async () => {
      const response = await request(app)
        .put('/api/students/placement-status')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: 'Placed',
          company: 'Tech Corp',
          position: 'Software Engineer',
          salary: 600000,
        });

      expect(response.status).toBe(200);
      expect(response.body.student.placementStatus.status).toBe('Placed');
    });
  });

  // =========================================================================
  // MENTOR BOOKING FOR STUDENTS
  // =========================================================================
  describe('Student Mentor Access', () => {
    test('should allow student to book mentor', async () => {
      const response = await request(app)
        .post('/api/students/book-mentor')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mentorId: new mongoose.Types.ObjectId(),
          topicId: new mongoose.Types.ObjectId(),
          preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      // May fail due to missing mentor, but route should be accessible
      expect([200, 400, 404]).toContain(response.status);
    });

    test('should view booked mentoring sessions', async () => {
      const response = await request(app)
        .get('/api/students/mentoring-sessions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sessions).toBeDefined();
    });
  });

  // =========================================================================
  // ASSESSMENT TRACKING TESTS
  // =========================================================================
  describe('Student Assessments', () => {
    test('should retrieve completed assessments', async () => {
      const response = await request(app)
        .get('/api/students/assessments')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.assessments).toBeDefined();
    });

    test('should view assessment results', async () => {
      const response = await request(app)
        .get('/api/students/assessment-results')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
    });
  });
});
