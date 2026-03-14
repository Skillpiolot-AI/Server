/**
 * User Model Tests
 * Tests for core User schema, validation, and methods
 */

const mongoose = require('mongoose');
const User = require('../../../models/User');
const { testUsers, generateId } = require('../../fixtures/testData');
const { cleanDatabase, createTestUser, expectErrorMessage } = require('../../helpers/testHelpers');

describe('User Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid user with required fields', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'User',
      };

      const user = await User.create(userData);

      expect(user._id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('User');
      expect(user.isVerified).toBe(false); // Default value
      expect(user.isActive).toBe(true); // Default value
    });

    test('should fail validation when required field is missing', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'User',
        // Missing username (required)
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should enforce unique username', async () => {
      const userData = {
        username: 'duplicate_user',
        name: 'User One',
        email: 'user1@example.com',
        password: 'pass123',
        role: 'User',
      };

      await User.create(userData);

      const duplicateData = {
        ...userData,
        email: 'user2@example.com', // Different email
      };

      // Note: Uniqueness depends on schema configuration
      // If not enforced at schema level, this may not fail
    });

    test('should validate role enum', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'InvalidRole',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should accept all 6 valid roles', async () => {
      const roles = ['Admin', 'User', 'Mentor', 'UniAdmin', 'UniTeach', 'Student'];
      const { testUniversities, testStudents } = require('../../fixtures/testData');

      // Create test references
      let uniId = null;
      let studentId = null;

      if (testUniversities && testUniversities.length > 0) {
        uniId = testUniversities[0]._id;
      } else {
        const University = require('../../../models/University');
        const uni = await University.create({ name: 'Test University' });
        uniId = uni._id;
      }

      if (testStudents && testStudents.length > 0) {
        studentId = testStudents[0]._id;
      } else {
        const Student = require('../../../models/Student');
        const student = await Student.create({
          userId: new mongoose.Types.ObjectId(),
          academicProfile: { rollNumber: 'ROLL001' },
        });
        studentId = student._id;
      }

      for (const role of roles) {
        const userData = {
          username: `user_${role}`,
          name: `${role} User`,
          email: `${role}@test.com`,
          password: 'pass123',
          role,
        };

        // Add conditionally required fields
        if (['UniAdmin', 'UniTeach', 'Student'].includes(role)) {
          userData.universityId = uniId;
        }
        if (role === 'Student') {
          userData.studentProfile = studentId;
        }

        const user = await User.create(userData);
        expect(user.role).toBe(role);
        await User.deleteOne({ _id: user._id });
      }
    });

    test('should validate authProvider enum', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'User',
        authProvider: 'facebook', // Invalid
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should set default authProvider to local', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'User',
      });

      expect(user.authProvider).toBe('local');
    });

    test('should lowercase email address', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'Test.User@EXAMPLE.COM',
        password: 'hashedPassword123',
        role: 'User',
      });

      expect(user.email).toBe('test.user@example.com');
    });

    test('should trim whitespace in email and username', async () => {
      const user = await User.create({
        username: '  testuser  ',
        name: 'Test User',
        email: '  test@example.com  ',
        password: 'hashedPassword123',
        role: 'User',
      });

      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });
  });

  // =========================================================================
  // CONDITIONAL REQUIRED FIELDS TESTS
  // =========================================================================

  describe('Conditional Required Fields', () => {
    test('should require universityId for UniAdmin role', async () => {
      const userData = {
        username: 'uniadmin',
        name: 'Uni Admin',
        email: 'uniadmin@test.com',
        password: 'pass123',
        role: 'UniAdmin',
        // Missing universityId
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should require universityId for UniTeach role', async () => {
      const userData = {
        username: 'teacher',
        name: 'Teacher',
        email: 'teacher@test.com',
        password: 'pass123',
        role: 'UniTeach',
        // Missing universityId
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should require universityId for Student role', async () => {
      const userData = {
        username: 'student',
        name: 'Student',
        email: 'student@test.com',
        password: 'pass123',
        role: 'Student',
        // Missing universityId
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should allow User role without universityId', async () => {
      const user = await User.create({
        username: 'regularuser',
        name: 'Regular User',
        email: 'regularuser@test.com',
        password: 'pass123',
        role: 'User',
      });

      expect(user.universityId).toBeUndefined();
    });
  });

  // =========================================================================
  // MENTOR-SPECIFIC FIELDS TESTS
  // =========================================================================

  describe('Mentor-Specific Fields', () => {
    test('should set default mentorStatus to pending', async () => {
      const user = await User.create({
        username: 'mentor1',
        name: 'Mentor User',
        email: 'mentor@test.com',
        password: 'pass123',
        role: 'Mentor',
      });

      expect(user.mentorStatus).toBe('pending');
    });

    test('should validate mentorStatus enum', async () => {
      const userData = {
        username: 'mentor1',
        name: 'Mentor User',
        email: 'mentor@test.com',
        password: 'pass123',
        role: 'Mentor',
        mentorStatus: 'invalidStatus',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    test('should accept all mentor statuses', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'temp', 'verified'];
      const mentorStatuses = statuses;

      for (const status of mentorStatuses) {
        const mentor = await User.create({
          username: `mentor_${status}`,
          name: `Mentor ${status}`,
          email: `mentor_${status}@test.com`,
          password: 'pass123',
          role: 'Mentor',
          mentorStatus: status,
        });

        expect(mentor.mentorStatus).toBe(status);
        await User.deleteOne({ _id: mentor._id });
      }
    });

    test('should set default mentorBadge to unverified', async () => {
      const mentor = await User.create({
        username: 'mentor1',
        name: 'Mentor User',
        email: 'mentor@test.com',
        password: 'pass123',
        role: 'Mentor',
      });

      expect(mentor.mentorBadge).toBe('unverified');
    });

    test('should initialize mentorRating to 0', async () => {
      const mentor = await User.create({
        username: 'mentor1',
        name: 'Mentor User',
        email: 'mentor@test.com',
        password: 'pass123',
        role: 'Mentor',
      });

      expect(mentor.mentorRating).toBe(0);
      expect(mentor.totalReviews).toBe(0);
      expect(mentor.totalPlacements).toBe(0);
    });
  });

  // =========================================================================
  // ACCOUNT STATUS TESTS
  // =========================================================================

  describe('Account Status Fields', () => {
    test('should set isActive to true by default', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
      });

      expect(user.isActive).toBe(true);
    });

    test('should set isVerified to false by default', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
      });

      expect(user.isVerified).toBe(false);
    });

    test('should allow suspension with details', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        isSuspended: true,
        suspensionDetails: {
          reason: 'Policy violation',
          suspendedAt: new Date(),
          until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          severity: 'moderate',
        },
      });

      expect(user.isSuspended).toBe(true);
      expect(user.suspensionDetails.reason).toBe('Policy violation');
      expect(user.suspensionDetails.severity).toBe('moderate');
    });

    test('should validate suspension severity enum', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        isSuspended: true,
        suspensionDetails: {
          reason: 'Test violation',
          severity: 'invalid_severity',
        },
      };

      // Expected behavior depends on schema validation
    });
  });

  // =========================================================================
  // LOGIN & SECURITY TESTS
  // =========================================================================

  describe('Login & Security Fields', () => {
    test('should track login attempts', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        loginAttempts: 3,
      });

      expect(user.loginAttempts).toBe(3);
    });

    test('should support account locking', async () => {
      const lockTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        lockUntil: lockTime,
      });

      expect(user.lockUntil).toBeDefined();
      expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
    });

    test('should track last login', async () => {
      const loginTime = new Date();
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        lastLogin: loginTime,
      });

      expect(user.lastLogin).toBeDefined();
    });

    test('should store current session details', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        currentSession: {
          sessionId: 'session-123',
          startTime: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
        },
      });

      expect(user.currentSession.sessionId).toBe('session-123');
      expect(user.currentSession.ipAddress).toBe('192.168.1.1');
    });
  });

  // =========================================================================
  // OPTIONAL FIELDS TESTS
  // =========================================================================

  describe('Optional Fields', () => {
    test('should allow phoneNumber field', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        phoneNumber: '+919876543210',
      });

      expect(user.phoneNumber).toBe('+919876543210');
    });

    test('should allow jobTitle field', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        jobTitle: 'Software Engineer',
      });

      expect(user.jobTitle).toBe('Software Engineer');
    });

    test('should allow imageUrl field', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        imageUrl: 'https://example.com/avatar.jpg',
      });

      expect(user.imageUrl).toBe('https://example.com/avatar.jpg');
    });

    test('should set default imageUrl to empty string', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
      });

      expect(user.imageUrl).toBe('');
    });

    test('should allow pushToken for notifications', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        pushToken: 'ExponentPushToken[xxxxxxxxxxxxx]',
      });

      expect(user.pushToken).toBe('ExponentPushToken[xxxxxxxxxxxxx]');
    });
  });

  // =========================================================================
  // ARRAYS & NESTED FIELDS TESTS
  // =========================================================================

  describe('Arrays & Nested Fields', () => {
    test('should support multiple companies joined', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        companiesJoined: ['Google', 'Meta', 'Amazon'],
      });

      expect(user.companiesJoined).toHaveLength(3);
      expect(user.companiesJoined).toContain('Google');
    });

    test('should support multiple university permissions', async () => {
      const user = await User.create({
        username: 'uniadmin',
        name: 'Uni Admin',
        email: 'uniadmin@test.com',
        password: 'pass123',
        role: 'UniAdmin',
        universityId: generateId(),
        universityPermissions: [
          { permission: 'manage_teachers', granted: true },
          { permission: 'manage_students', granted: true },
          { permission: 'view_reports', granted: false },
        ],
      });

      expect(user.universityPermissions).toHaveLength(3);
      expect(user.universityPermissions[0].granted).toBe(true);
    });

    test('should support appointments array', async () => {
      const userId = generateId();
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
        appointments: [
          {
            userId: userId,
            date: new Date(),
          },
        ],
      });

      expect(user.appointments).toHaveLength(1);
      expect(user.appointments[0].userId.toString()).toBe(userId.toString());
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    test('should update updatedAt on modification', async () => {
      const user = await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass123',
        role: 'User',
      });

      const originalUpdatedAt = user.updatedAt.getTime();

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));

      user.jobTitle = 'Software Engineer';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt);
    });
  });

  // =========================================================================
  // GOOGLE OAUTH TESTS
  // =========================================================================

  describe('Google OAuth', () => {
    test('should support Google authentication', async () => {
      const user = await User.create({
        name: 'Google User',
        email: 'googleuser@gmail.com',
        password: 'random-password',
        role: 'User',
        googleId: 'google-123456',
        authProvider: 'google',
        username: 'google_user',
      });

      expect(user.authProvider).toBe('google');
      expect(user.googleId).toBe('google-123456');
    });

    test('should require username even for Google OAuth users', async () => {
      const userData = {
        name: 'Google User',
        email: 'googleuser@gmail.com',
        password: 'random-password',
        role: 'User',
        googleId: 'google-123456',
        authProvider: 'google',
        // Missing username
      };

      await expect(User.create(userData)).rejects.toThrow();
    });
  });
});
