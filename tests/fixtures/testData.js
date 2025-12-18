// tests/fixtures/testData.js
// Test data fixtures for unit and integration tests

const mongoose = require('mongoose');

/**
 * Generate a valid MongoDB ObjectId
 */
const generateId = () => new mongoose.Types.ObjectId();

/**
 * Test user data
 */
const testUsers = {
    admin: {
        _id: generateId(),
        username: 'admin_test',
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'hashedPassword123',
        role: 'Admin',
        isActive: true,
        isVerified: true,
        isLocked: false
    },
    regularUser: {
        _id: generateId(),
        username: 'user_test',
        name: 'Regular User',
        email: 'user@test.com',
        password: 'hashedPassword123',
        role: 'User',
        isActive: true,
        isVerified: true,
        isLocked: false
    },
    unverifiedUser: {
        _id: generateId(),
        username: 'unverified_test',
        name: 'Unverified User',
        email: 'unverified@test.com',
        password: 'hashedPassword123',
        role: 'User',
        isActive: false,
        isVerified: false,
        isLocked: false
    },
    lockedUser: {
        _id: generateId(),
        username: 'locked_test',
        name: 'Locked User',
        email: 'locked@test.com',
        password: 'hashedPassword123',
        role: 'User',
        isActive: true,
        isVerified: true,
        isLocked: true,
        lockUntil: new Date(Date.now() + 3600000) // 1 hour from now
    },
    mentor: {
        _id: generateId(),
        username: 'mentor_test',
        name: 'Mentor User',
        email: 'mentor@test.com',
        password: 'hashedPassword123',
        role: 'Mentor',
        isActive: true,
        isVerified: true,
        isLocked: false
    },
    uniAdmin: {
        _id: generateId(),
        username: 'uniadmin_test',
        name: 'University Admin',
        email: 'uniadmin@test.com',
        password: 'hashedPassword123',
        role: 'UniAdmin',
        isActive: true,
        isVerified: true,
        isLocked: false,
        universityId: generateId()
    }
};

/**
 * Test student data
 */
const testStudents = {
    active: {
        _id: generateId(),
        userId: testUsers.regularUser._id,
        universityId: generateId(),
        createdBy: testUsers.admin._id,
        department: 'Computer Science',
        year: '2024',
        course: 'B.Tech',
        rollNumber: 'CS2024001',
        academicStatus: 'active',
        isSuspended: false,
        portalAccess: {
            canAccessLibrary: true,
            canAccessLabs: true,
            canAccessCourses: true,
            canSubmitAssignments: true,
            canViewGrades: true
        },
        performance: {
            currentGPA: 8.5,
            totalCredits: 120,
            completedCredits: 80,
            attendancePercentage: 92
        }
    },
    suspended: {
        _id: generateId(),
        userId: generateId(),
        universityId: generateId(),
        createdBy: testUsers.admin._id,
        department: 'Mechanical Engineering',
        year: '2023',
        academicStatus: 'active',
        isSuspended: true,
        suspensionDetails: {
            reason: 'Academic misconduct',
            suspendedAt: new Date(),
            suspendedBy: testUsers.admin._id,
            suspendedByName: 'Admin User',
            until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            isActive: true
        }
    }
};

/**
 * Test assessment data
 */
const testAssessments = {
    complete: {
        _id: generateId(),
        userId: 'test-user-123',
        answers: new Map([
            ['R1', 5], ['R2', 4], ['R3', 3],
            ['I1', 4], ['I2', 5], ['I3', 4],
            ['A1', 2], ['A2', 3], ['A3', 2],
            ['S1', 3], ['S2', 4], ['S3', 3],
            ['E1', 1], ['E2', 2], ['E3', 1],
            ['C1', 2], ['C2', 2], ['C3', 3]
        ]),
        results: {
            domainScores: { R: 12, I: 13, A: 7, S: 10, E: 4, C: 7 },
            percentages: { R: 23, I: 25, A: 13, S: 19, E: 8, C: 13 },
            hollandCode: 'IRS',
            topThreeDomains: ['I', 'R', 'S'],
            recommendedCareers: [
                {
                    careerId: 1,
                    name: 'Software Engineer',
                    cluster: 'Technology',
                    matchScore: 92,
                    career_type: 'Tech',
                    holland_codes: ['R', 'I', 'C']
                }
            ]
        },
        shareableLink: 'http://localhost:3000/results/test-123'
    },
    minimal: {
        _id: generateId(),
        userId: 'minimal-user',
        answers: new Map([['R1', 5]]),
        results: {
            domainScores: { R: 5, I: 0, A: 0, S: 0, E: 0, C: 0 },
            hollandCode: 'R',
            topThreeDomains: ['R']
        }
    }
};

/**
 * Test career data
 */
const testCareers = [
    {
        id: 1,
        name: 'Software Engineer',
        career_cluster_name: 'Technology',
        career_type: 'Professional',
        salary_range: { min: 60000, max: 150000 },
        future_growth: { rate: 'High', percentage: 22 },
        holland_codes: ['R', 'I', 'C'],
        minimum_expense: 15000,
        icon: 'software-icon.png'
    },
    {
        id: 2,
        name: 'Data Scientist',
        career_cluster_name: 'Technology',
        career_type: 'Professional',
        salary_range: { min: 70000, max: 180000 },
        future_growth: { rate: 'Very High', percentage: 35 },
        holland_codes: ['I', 'R', 'C'],
        minimum_expense: 20000,
        icon: 'data-icon.png'
    },
    {
        id: 3,
        name: 'Graphic Designer',
        career_cluster_name: 'Arts & Design',
        career_type: 'Creative',
        salary_range: { min: 40000, max: 80000 },
        future_growth: { rate: 'Medium', percentage: 5 },
        holland_codes: ['A', 'R', 'E'],
        minimum_expense: 5000,
        icon: 'design-icon.png'
    }
];

/**
 * Test JWT tokens
 */
const testTokens = {
    valid: {
        id: testUsers.regularUser._id.toString(),
        role: 'User'
    },
    admin: {
        id: testUsers.admin._id.toString(),
        role: 'Admin'
    },
    expired: {
        id: testUsers.regularUser._id.toString(),
        role: 'User',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    }
};

/**
 * Validation test cases
 */
const validationCases = {
    validEmails: [
        'test@example.com',
        'user.name@domain.org',
        'user+tag@company.co.uk',
        'simple@test.io'
    ],
    invalidEmails: [
        'invalid-email',
        '@nodomain.com',
        'noatsign.com',
        'spaces in@email.com',
        'double@@domain.com'
    ],
    validPasswords: [
        'Password123!',
        'Secure@Pass1',
        'MyP@ssw0rd'
    ],
    invalidPasswords: [
        '123',      // Too short
        'abc',      // Too short
        ''          // Empty
    ],
    validRoles: ['User', 'Mentor', 'Admin', 'UniAdmin', 'UniTeach', 'Student'],
    invalidRoles: ['InvalidRole', 'SuperAdmin', '', null]
};

/**
 * RIASEC Holland Code test cases
 */
const hollandCodeCases = {
    perfectMatch: {
        userCode: 'RIA',
        careerCode: ['R', 'I', 'A'],
        expectedScore: 100 // Capped at 100
    },
    partialMatch: {
        userCode: 'RIA',
        careerCode: ['R', 'S', 'E'],
        expectedScore: 65 // R matches at position 0
    },
    noMatch: {
        userCode: 'RIA',
        careerCode: ['S', 'E', 'C'],
        expectedScore: 0
    }
};

module.exports = {
    generateId,
    testUsers,
    testStudents,
    testAssessments,
    testCareers,
    testTokens,
    validationCases,
    hollandCodeCases
};
