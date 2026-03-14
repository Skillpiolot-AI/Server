/**
 * Student Model Tests
 * Tests for student-specific fields, academic status, and portal access
 */

const mongoose = require('mongoose');
const Student = require('../../../models/Student');
const User = require('../../models/User');
const {
  testUniversities,
  generateId,
} = require('../../fixtures/testData');
const {
  cleanDatabase,
  createTestStudent,
  createTestUser,
} = require('../../helpers/testHelpers');

describe('Student Model', () => {
  let testStudent, testUniversity, testUser;

  beforeEach(async () => {
    await cleanDatabase();
    testUniversity = testUniversities[0];
    testUser = await createTestUser({ role: 'student' });
    testStudent = await createTestStudent(testUniversity._id);
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid student record with required fields', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      expect(student._id).toBeDefined();
      expect(student.userId.toString()).toBe(testUser._id.toString());
      expect(student.universityId.toString()).toBe(testUniversity._id.toString());
    });

    test('should fail validation when userId is missing', async () => {
      const studentData = {
        universityId: testUniversity._id,
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });

    test('should fail validation when universityId is missing', async () => {
      const studentData = {
        userId: testUser._id,
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // ACADEMIC STATUS TESTS
  // =========================================================================

  describe('Academic Status', () => {
    test('should set default academic status to active', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      expect(student.academicStatus).toBe('active');
    });

    test('should accept all valid academic statuses', async () => {
      const validStatuses = ['active', 'inactive', 'on-leave', 'graduated', 'dropped', 'suspended'];

      for (const status of validStatuses) {
        const student = await Student.create({
          userId: testUser._id,
          universityId: testUniversity._id,
          academicStatus: status,
        });

        expect(student.academicStatus).toBe(status);
        await Student.deleteOne({ _id: student._id });
      }
    });

    test('should reject invalid academic status', async () => {
      const studentData = {
        userId: testUser._id,
        universityId: testUniversity._id,
        academicStatus: 'invalid_status',
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });

    test('should track academic status change date', async () => {
      const now = new Date();
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        academicStatus: 'active',
        academicStatusUpdatedAt: now,
      });

      expect(student.academicStatusUpdatedAt).toBeDefined();
    });
  });

  // =========================================================================
  // ACADEMIC PROFILE TESTS
  // =========================================================================

  describe('Academic Profile', () => {
    test('should store student roll number/enrollment ID', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        rollNumber: 'BT/2022/12345',
        enrollmentId: 'ENR-2022-001',
      });

      expect(student.rollNumber).toBe('BT/2022/12345');
      expect(student.enrollmentId).toBe('ENR-2022-001');
    });

    test('should store admitted year and expected graduation', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        admittedYear: 2022,
        expectedGraduationYear: 2026,
      });

      expect(student.admittedYear).toBe(2022);
      expect(student.expectedGraduationYear).toBe(2026);
    });

    test('should store current semester/year', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        currentSemester: 5,
        totalSemesters: 8,
      });

      expect(student.currentSemester).toBe(5);
      expect(student.totalSemesters).toBe(8);
    });

    test('should store GPA/CGPA metrics', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        gpa: 3.8,
        cgpa: 3.75,
      });

      expect(student.gpa).toBe(3.8);
      expect(student.cgpa).toBe(3.75);
    });

    test('should track branch/specialization', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        branch: 'Computer Science',
        specialization: 'AI/ML',
      });

      expect(student.branch).toBe('Computer Science');
      expect(student.specialization).toBe('AI/ML');
    });
  });

  // =========================================================================
  // PERFORMANCE TRACKING TESTS
  // =========================================================================

  describe('Performance Tracking', () => {
    test('should track attendance percentage', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        attendancePercentage: 85.5,
      });

      expect(student.attendancePercentage).toBe(85.5);
    });

    test('should track backlog courses', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        backlogCourses: ['Database Systems', 'Operating Systems'],
      });

      expect(student.backlogCourses).toHaveLength(2);
      expect(student.backlogCourses).toContain('Database Systems');
    });

    test('should track failed/incomplete courses', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        failedCourses: 1,
        incompleteCourses: 2,
      });

      expect(student.failedCourses).toBe(1);
      expect(student.incompleteCourses).toBe(2);
    });

    test('should track merit/scholarship status', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        hasScholarship: true,
        scholarshipDetails: {
          type: 'merit-based',
          percentage: 50,
        },
      });

      expect(student.hasScholarship).toBe(true);
      expect(student.scholarshipDetails.type).toBe('merit-based');
    });
  });

  // =========================================================================
  // DOCUMENTS & CREDENTIALS TESTS
  // =========================================================================

  describe('Documents & Credentials', () => {
    test('should store academic documents', async () => {
      const docs = {
        transcript: 'url/to/transcript.pdf',
        hallTicket: 'url/to/hallticket.pdf',
        characterCertificate: 'url/to/cert.pdf',
      };

      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        documentUrls: docs,
      });

      expect(student.documentUrls.transcript).toBe('url/to/transcript.pdf');
      expect(student.documentUrls.hallTicket).toBe('url/to/hallticket.pdf');
    });

    test('should track verified document status', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        documentsVerified: true,
        documentsVerifiedAt: new Date(),
        documentsVerifiedBy: generateId(),
      });

      expect(student.documentsVerified).toBe(true);
      expect(student.documentsVerifiedAt).toBeDefined();
    });
  });

  // =========================================================================
  // PORTAL ACCESS TESTS
  // =========================================================================

  describe('Portal Access', () => {
    test('should set default portal access to true', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      expect(student.portalAccess).toBe(true);
    });

    test('should track portal access status and reason', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        portalAccess: false,
        portalAccessReason: 'Dues not cleared',
      });

      expect(student.portalAccess).toBe(false);
      expect(student.portalAccessReason).toBe('Dues not cleared');
    });

    test('should track portal access changes', async () => {
      const now = new Date();
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        portalAccessChangedAt: now,
      });

      expect(student.portalAccessChangedAt).toBeDefined();
    });
  });

  // =========================================================================
  // MENTOR RELATIONSHIP TESTS
  // =========================================================================

  describe('Mentor Relationship', () => {
    test('should link student to assigned mentor', async () => {
      const mentorId = generateId();
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        assignedMentorId: mentorId,
      });

      expect(student.assignedMentorId).toBeDefined();
      expect(student.assignedMentorId.toString()).toBe(mentorId.toString());
    });

    test('should track mentor assignment date', async () => {
      const mentorId = generateId();
      const now = new Date();
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        assignedMentorId: mentorId,
        mentorAssignedAt: now,
      });

      expect(student.mentorAssignedAt).toBeDefined();
    });
  });

  // =========================================================================
  // COURSE & ASSESSMENT TESTS
  // =========================================================================

  describe('Course & Assessment Records', () => {
    test('should track completed assessments', async () => {
      const assessmentIds = [generateId(), generateId()];
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        completedAssessments: assessmentIds,
      });

      expect(student.completedAssessments).toHaveLength(2);
    });

    test('should track enrolled courses', async () => {
      const courses = [
        { courseId: generateId(), name: 'Data Structures', credits: 4 },
        { courseId: generateId(), name: 'Algorithms', credits: 4 },
      ];

      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        enrolledCourses: courses,
      });

      expect(student.enrolledCourses).toHaveLength(2);
    });
  });

  // =========================================================================
  // SUSPENSION/RESTRICTIONS TESTS
  // =========================================================================

  describe('Suspension & Restrictions', () => {
    test('should track suspension status and details', async () => {
      const suspensionData = {
        isSuspended: true,
        suspensionReason: 'Low academic performance',
        suspendedAt: new Date(),
        suspendedBy: generateId(),
        expectedResume: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        ...suspensionData,
      });

      expect(student.isSuspended).toBe(true);
      expect(student.suspensionReason).toBe('Low academic performance');
      expect(student.expectedResume).toBeDefined();
    });

    test('should set default suspension status to false', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      expect(student.isSuspended).toBe(false);
    });
  });

  // =========================================================================
  // PLACEMENT TRACKING TESTS
  // =========================================================================

  describe('Placement Tracking', () => {
    test('should track placement status', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        placementStatus: 'placed',
        placedCompany: 'Google',
        placementDate: new Date(),
      });

      expect(student.placementStatus).toBe('placed');
      expect(student.placedCompany).toBe('Google');
    });

    test('should support multiple placement tracking', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        placements: [
          {
            company: 'Google',
            role: 'SDE',
            package: 50,
            placedAt: new Date(),
          },
          {
            company: 'Microsoft',
            role: 'SDE II',
            package: 55,
            placedAt: new Date(),
          },
        ],
      });

      expect(student.placements).toHaveLength(2);
      expect(student.placements[0].company).toBe('Google');
    });
  });

  // =========================================================================
  // ADDITIONAL FIELDS TESTS
  // =========================================================================

  describe('Additional Fields', () => {
    test('should allow custom notes/remarks', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        remarks: 'Exceptional student, strong technical background',
      });

      expect(student.remarks).toBe('Exceptional student, strong technical background');
    });

    test('should track verification status', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: generateId(),
      });

      expect(student.isVerified).toBe(true);
      expect(student.verifiedAt).toBeDefined();
    });

    test('should set default verification to false', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      expect(student.isVerified).toBe(false);
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient queries by userId', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      const result = await Student.findOne({ userId: testUser._id });

      expect(result._id.toString()).toBe(student._id.toString());
    });

    test('should support efficient queries by universityId', async () => {
      const user2 = await createTestUser();
      const student2 = await Student.create({
        userId: user2._id,
        universityId: testUniversity._id,
      });

      const results = await Student.find({ universityId: testUniversity._id });

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    test('should support efficient queries by academic status', async () => {
      const student1 = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
        academicStatus: 'active',
      });

      const activeStudents = await Student.find({ academicStatus: 'active' });

      expect(activeStudents.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // REFERENCE INTEGRITY TESTS
  // =========================================================================

  describe('Reference Integrity', () => {
    test('should support population of userId reference', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      const populatedStudent = await Student.findById(student._id).populate('userId');

      expect(populatedStudent.userId._id.toString()).toBe(testUser._id.toString());
    });

    test('should support population of universityId reference', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      const populatedStudent = await Student.findById(student._id).populate('universityId');

      expect(populatedStudent.universityId._id).toBeDefined();
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const student = await Student.create({
        userId: testUser._id,
        universityId: testUniversity._id,
      });

      expect(student.createdAt).toBeDefined();
      expect(student.updatedAt).toBeDefined();
    });
  });
});
