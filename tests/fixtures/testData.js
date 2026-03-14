// tests/fixtures/testData.js
// Comprehensive test data fixtures for all 6 user roles and entities

const mongoose = require('mongoose');

/**
 * Generate a valid MongoDB ObjectId
 */
const generateId = () => new mongoose.Types.ObjectId();

// ============================================================================
// USER FIXTURES - 6 ROLES + VARIATIONS
// ============================================================================

const testUsers = {
  // ADMIN ROLE
  admin: {
    _id: generateId(),
    username: 'admin_test',
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'hashed-password',
    role: 'Admin',
    isActive: true,
    isVerified: true,
    isLocked: false,
    createdAt: new Date('2024-01-01'),
  },
  superAdmin: {
    _id: generateId(),
    username: 'superadmin_test',
    name: 'Super Admin User',
    email: 'superadmin@test.com',
    password: 'hashed-password',
    role: 'Admin',
    isActive: true,
    isVerified: true,
    isLocked: false,
    permissions: ['all'],
  },

  // USER ROLE - Multiple variations
  activeUser: {
    _id: generateId(),
    username: 'active_user',
    name: 'Active Regular User',
    email: 'active@test.com',
    password: 'hashed-password',
    role: 'User',
    isActive: true,
    isVerified: true,
    isLocked: false,
  },
  inactiveUser: {
    _id: generateId(),
    username: 'inactive_user',
    name: 'Inactive User',
    email: 'inactive@test.com',
    password: 'hashed-password',
    role: 'User',
    isActive: false,
    isVerified: true,
    isLocked: false,
    deactivatedAt: new Date(),
    deactivationReason: 'Account closure',
  },
  unverifiedUser: {
    _id: generateId(),
    username: 'unverified_user',
    name: 'Unverified User',
    email: 'unverified@test.com',
    password: 'hashed-password',
    role: 'User',
    isActive: true,
    isVerified: false,
    isLocked: false,
  },
  lockedUser: {
    _id: generateId(),
    username: 'locked_user',
    name: 'Locked User',
    email: 'locked@test.com',
    password: 'hashed-password',
    role: 'User',
    isActive: true,
    isVerified: true,
    isLocked: true,
    lockUntil: new Date(Date.now() + 3600000), // 1 hour
    failedLoginCount: 5,
  },
  suspendedUser: {
    _id: generateId(),
    username: 'suspended_user',
    name: 'Suspended User',
    email: 'suspended@test.com',
    password: 'hashed-password',
    role: 'User',
    isActive: true,
    isVerified: true,
    isLocked: false,
    isSuspended: true,
    suspensionReason: 'Policy violation',
    suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  googleOAuthUser: {
    _id: generateId(),
    name: 'Google OAuth User',
    email: 'google-oauth@test.com',
    role: 'User',
    authProvider: 'google',
    googleId: 'mock-google-id-123',
    isActive: true,
    isVerified: true,
    isLocked: false,
  },

  // MENTOR ROLE - Multiple variations
  approvedMentor: {
    _id: generateId(),
    username: 'mentor_approved',
    name: 'Approved Mentor',
    email: 'mentor-approved@test.com',
    password: 'hashed-password',
    role: 'Mentor',
    mentorStatus: 'approved',
    isActive: true,
    isVerified: true,
    isLocked: false,
    mentorProfile: {
      specialization: ['Career Planning', 'Tech Interviews'],
      yearsOfExperience: 5,
      hourlyRate: 500,
      bio: 'Experienced career mentor',
      certifications: ['Career Coach Certified'],
    },
    mentorRating: {
      averageRating: 4.8,
      totalRatings: 25,
      ratingBreakdown: { 5: 22, 4: 3, 3: 0, 2: 0, 1: 0 },
    },
    mentorVerificationStatus: 'verified',
  },
  pendingMentor: {
    _id: generateId(),
    username: 'mentor_pending',
    name: 'Pending Mentor',
    email: 'mentor-pending@test.com',
    password: 'hashed-password',
    role: 'Mentor',
    mentorStatus: 'pending',
    isActive: true,
    isVerified: true,
    isLocked: false,
    mentorProfile: {
      yearsOfExperience: 2,
      hourlyRate: 300,
    },
  },
  rejectedMentor: {
    _id: generateId(),
    username: 'mentor_rejected',
    name: 'Rejected Mentor',
    email: 'mentor-rejected@test.com',
    password: 'hashed-password',
    role: 'Mentor',
    mentorStatus: 'rejected',
    isActive: true,
    isVerified: true,
    mentorProfile: { yearsOfExperience: 1 },
    rejectionReason: 'Insufficient experience',
    rejectedAt: new Date(),
  },
  tempMentor: {
    _id: generateId(),
    username: 'mentor_temp',
    name: 'Temporary Mentor',
    email: 'mentor-temp@test.com',
    password: 'hashed-password',
    role: 'Mentor',
    mentorStatus: 'temp',
    isActive: true,
    isVerified: true,
    mentorProfile: { yearsOfExperience: 3 },
    tempReason: 'Trial period',
  },

  // UNIVERSITY ADMIN ROLE
  universityAdmin: {
    _id: generateId(),
    username: 'uniadmin_test',
    name: 'University Admin',
    email: 'unadmin@test.com',
    password: 'hashed-password',
    role: 'UniAdmin',
    universityId: generateId(),
    isActive: true,
    isVerified: true,
    isLocked: false,
    universityPermissions: {
      canManageTeachers: true,
      canManageStudents: true,
      canViewAnalytics: true,
      canCreateAnnouncements: true,
    },
  },
  universityAdminMultipleUnis: {
    _id: generateId(),
    username: 'uniadmin_multi',
    name: 'Multi-University Admin',
    email: 'multiuni@test.com',
    password: 'hashed-password',
    role: 'UniAdmin',
    universityId: generateId(),
    managedUniversities: [generateId(), generateId()],
    isActive: true,
    isVerified: true,
  },

  // UNIVERSITY TEACHER ROLE
  universityTeacher: {
    _id: generateId(),
    username: 'teacher_test',
    name: 'University Teacher',
    email: 'teacher@test.com',
    password: 'hashed-password',
    role: 'UniTeach',
    universityId: generateId(),
    isActive: true,
    isVerified: true,
    isLocked: false,
    teacherProfile: {
      department: 'Computer Science',
      qualifications: ['B.Tech', 'M.Tech'],
      specialization: 'Artificial Intelligence',
    },
  },

  // STUDENT ROLE
  activeStudent: {
    _id: generateId(),
    username: 'student_active',
    name: 'Active Student',
    email: 'student-active@test.com',
    password: 'hashed-password',
    role: 'Student',
    universityId: generateId(),
    isActive: true,
    isVerified: true,
    isLocked: false,
    studentProfile: {
      rollNumber: 'CS2024001',
      department: 'Computer Science',
      year: 3,
      academicStatus: 'active',
    },
  },
  droppedStudent: {
    _id: generateId(),
    username: 'student_dropped',
    name: 'Dropped Student',
    email: 'student-dropped@test.com',
    password: 'hashed-password',
    role: 'Student',
    universityId: generateId(),
    isActive: false,
    studentProfile: {
      rollNumber: 'CS2023999',
      academicStatus: 'dropped',
      droppedAt: new Date(),
    },
  },
};

// ============================================================================
// UNIVERSITY & COLLEGE FIXTURES
// ============================================================================

const testUniversities = [
  {
    _id: generateId(),
    name: 'Indian Institute of Technology Delhi',
    shortName: 'IITD',
    location: 'New Delhi',
    accessMethod: 'email',
    registrationNumbers: {
      pattern: 'cs2024*',
      format: 'cs*',
    },
    studentEmails: ['student@iitd.ac.in'],
    totalStudents: 8500,
    established: 1961,
  },
  {
    _id: generateId(),
    name: 'Delhi University',
    shortName: 'DU',
    location: 'New Delhi',
    accessMethod: 'domain',
    studentEmails: ['*@du.ac.in'],
  },
];

const testColleges = [
  {
    _id: generateId(),
    instituteId: testUniversities[0]._id,
    instituteName: 'Indian Institute of Technology Delhi',
    courses: ['B.Tech CSE', 'B.Tech EEE', 'M.Tech'],
    placements: {
      averageSalary: 1400000,
      highestSalary: 4500000,
      lowestSalary: 600000,
      placementPercentage: 98,
    },
    rankings: { nirf: 3, jspl: 5 },
  },
];

// ============================================================================
// ASSESSMENT FIXTURES
// ============================================================================

const testAssessments = {
  // High Realistic (R) score
  highR: {
    _id: generateId(),
    userId: generateId(),
    answers: {
      R: [5, 5, 5, 5, 5, 4], // Sum: 29
      I: [2, 2, 2, 2, 1, 1], // Sum: 10
      A: [1, 1, 1, 1, 1, 1], // Sum: 6
      S: [3, 3, 2, 3, 2, 2], // Sum: 15
      E: [2, 2, 2, 1, 2, 1], // Sum: 10
      C: [3, 3, 3, 3, 3, 3], // Sum: 18
    },
    expectedResult: {
      domainScores: { R: 29, I: 10, A: 6, S: 15, E: 10, C: 18 },
      hollandCode: 'RCS',
      topDomains: ['R', 'C', 'S'],
    },
  },
  // Balanced scores
  balanced: {
    _id: generateId(),
    userId: generateId(),
    answers: {
      R: [4, 4, 4, 3, 3, 3], // Sum: 21
      I: [4, 4, 4, 3, 3, 3], // Sum: 21
      A: [3, 3, 3, 3, 3, 3], // Sum: 18
      S: [3, 3, 3, 3, 3, 3], // Sum: 18
      E: [4, 4, 3, 3, 3, 2], // Sum: 19
      C: [3, 3, 3, 3, 3, 3], // Sum: 18
    },
  },
  // Low overall scores
  lowScores: {
    _id: generateId(),
    userId: generateId(),
    answers: {
      R: [1, 1, 1, 1, 1, 1], // Sum: 6
      I: [1, 1, 1, 1, 1, 1], // Sum: 6
      A: [2, 2, 1, 1, 2, 1], // Sum: 9
      S: [1, 1, 1, 1, 1, 1], // Sum: 6
      E: [1, 1, 1, 1, 1, 1], // Sum: 6
      C: [1, 1, 1, 1, 1, 1], // Sum: 6
    },
  },
};

// ============================================================================
// MENTOR BOOKING FIXTURES
// ============================================================================

const testBookings = {
  pending: {
    _id: generateId(),
    mentorId: generateId(),
    userId: generateId(),
    scheduleDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: 60, // minutes
    meetingLink: '',
    status: 'pending',
    amount: 500,
    coupon: null,
    paymentId: null,
    createdAt: new Date(),
  },
  confirmed: {
    _id: generateId(),
    mentorId: generateId(),
    userId: generateId(),
    scheduleDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    duration: 60,
    meetingLink: 'https://meet.google.com/abc-def-ghi',
    status: 'confirmed',
    amount: 300, // After coupon
    totalAmount: 500,
    coupon: 'SAVE20',
    paymentId: 'pay_123456',
    confirmedAt: new Date(),
  },
  completed: {
    _id: generateId(),
    mentorId: generateId(),
    userId: generateId(),
    scheduleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    duration: 60,
    meetingLink: 'https://meet.google.com/xyz-uvw',
    status: 'completed',
    amount: 500,
    paymentId: 'pay_789012',
    completedAt: new Date(),
    feedback: {
      rating: 5,
      comment: 'Excellent mentor!',
      ratedAt: new Date(),
    },
  },
  canceled: {
    _id: generateId(),
    mentorId: generateId(),
    userId: generateId(),
    scheduleDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'canceled',
    canceledAt: new Date(),
    cancelationReason: 'Schedule conflict',
  },
};

// ============================================================================
// MENTOR SERVICE FIXTURES
// ============================================================================

const testMentorServices = {
  careerPlanning: {
    _id: generateId(),
    mentorId: generateId(),
    serviceType: 'Career Planning',
    description: 'Help with career path selection and planning',
    hourlyRate: 500,
    availability: [
      { day: 'Monday', from: '10:00', to: '18:00' },
      { day: 'Wednesday', from: '10:00', to: '18:00' },
      { day: 'Friday', from: '10:00', to: '18:00' },
    ],
    maxBookingsPerWeek: 10,
    currentBookings: 3,
  },
  interviewPrep: {
    _id: generateId(),
    mentorId: generateId(),
    serviceType: 'Interview Preparation',
    description: 'Technical and behavioral interview coaching',
    hourlyRate: 600,
    availability: [
      { day: 'Tuesday', from: '14:00', to: '20:00' },
      { day: 'Thursday', from: '14:00', to: '20:00' },
      { day: 'Saturday', from: '10:00', to: '16:00' },
    ],
    maxBookingsPerWeek: 8,
    currentBookings: 5,
  },
};

// ============================================================================
// COUPON FIXTURES
// ============================================================================

const testCoupons = {
  percentage: {
    _id: generateId(),
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    maxUsage: 100,
    currentUsage: 5,
    applicable: ['Mentor'],
  },
  fixed: {
    _id: generateId(),
    code: 'SAVE100',
    discountType: 'fixed',
    discountValue: 100,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    maxUsage: 50,
    currentUsage: 10,
  },
  expired: {
    _id: generateId(),
    code: 'EXPIRED',
    discountType: 'percentage',
    discountValue: 50,
    expiryDate: new Date(Date.now() - 1000),
    maxUsage: 1000,
    currentUsage: 500,
  },
};

// ============================================================================
// CAREER & SKILLS FIXTURES
// ============================================================================

const testCareers = [
  {
    _id: generateId(),
    jobTitle: 'Software Engineer',
    industry: 'Technology',
    salary: { min: 600000, max: 2000000, currency: 'INR' },
    requiredSkills: ['Programming', 'Problem Solving', 'System Design'],
    hollandCode: ['R', 'I', 'C'],
    jobOutlook: 'Very High',
    description: 'Develop and maintain software applications',
  },
  {
    _id: generateId(),
    jobTitle: 'Data Scientist',
    industry: 'Technology',
    salary: { min: 800000, max: 2500000, currency: 'INR' },
    requiredSkills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    hollandCode: ['I', 'R', 'A'],
    jobOutlook: 'Very High',
  },
  {
    _id: generateId(),
    jobTitle: 'Management Consultant',
    industry: 'Consulting',
    salary: { min: 1000000, max: 3000000, currency: 'INR' },
    requiredSkills: ['Strategic Thinking', 'Communication', 'Analysis'],
    hollandCode: ['E', 'I', 'S'],
    jobOutlook: 'High',
  },
];

const testSkills = [
  { _id: generateId(), name: 'Python Programming', category: 'Technical' },
  { _id: generateId(), name: 'Communication', category: 'Soft Skills' },
  { _id: generateId(), name: 'Project Management', category: 'Soft Skills' },
  { _id: generateId(), name: 'Machine Learning', category: 'Technical' },
];

const testStrengths = [
  { _id: generateId(), name: 'Leadership', category: 'Behavioral' },
  { _id: generateId(), name: 'Problem Solving', category: 'Cognitive' },
  { _id: generateId(), name: 'Creativity', category: 'Behavioral' },
];

const testInterests = [
  { _id: generateId(), name: 'Technology', category: 'Industry' },
  { _id: generateId(), name: 'Business', category: 'Industry' },
  { _id: generateId(), name: 'Education', category: 'Field' },
];

// ============================================================================
// MISCELLANEOUS FIXTURES
// ============================================================================

const testResources = [
  {
    _id: generateId(),
    title: 'How to Crack Technical Interviews',
    url: 'https://example.com/interview-guide',
    resourceType: 'article',
    category: 'Interview Preparation',
    thumbnail: 'https://example.com/thumb.jpg',
  },
  {
    _id: generateId(),
    title: 'Career Growth Strategies',
    url: 'https://youtube.com/career-video',
    resourceType: 'video',
    category: 'Career Development',
  },
];

const testAnnouncements = [
  {
    _id: generateId(),
    title: 'New Mentor Program Launch',
    content: 'We are launching an enhanced mentor program',
    targetRole: ['User', 'Student'],
    createdBy: testUsers.admin._id,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
];

const testWorkshops = [
  {
    _id: generateId(),
    title: 'Resume Writing Masterclass',
    description: 'Learn how to write an effective resume',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    time: '14:00',
    instructor: 'Career Coach',
    capacity: 50,
    enrolledCount: 0,
    link: 'https://meet.google.com/workshop-room',
    status: 'upcoming',
  },
];

// ============================================================================
// VALIDATION TEST CASES
// ============================================================================

const validationCases = {
  validEmails: ['test@example.com', 'user.name@domain.org', 'user+tag@company.co.uk'],
  invalidEmails: ['invalid-email', '@nodomain.com', 'noatsign.com', 'spaces in@email.com'],
  validRoles: ['User', 'Mentor', 'Admin', 'UniAdmin', 'UniTeach', 'Student'],
  invalidRoles: ['InvalidRole', 'SuperAdmin', '', null],
};

// ============================================================================
// EXPORT ALL FIXTURES
// ============================================================================

module.exports = {
  generateId,

  // Users
  testUsers,

  // Academic
  testUniversities,
  testColleges,

  // Assessments
  testAssessments,

  // Bookings
  testBookings,

  // Mentor Services & Coupons
  testMentorServices,
  testCoupons,

  // Career Data
  testCareers,
  testSkills,
  testStrengths,
  testInterests,

  // Miscellaneous
  testResources,
  testAnnouncements,
  testWorkshops,

  // Validation
  validationCases,
};
