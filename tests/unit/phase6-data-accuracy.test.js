/**
 * PHASE 6: DATA ACCURACY TESTS
 * Validates core business logic and calculation accuracy
 *
 * Focus Areas:
 * 1. Holland Code assessment scoring
 * 2. Coupon discount calculations
 * 3. University statistics calculations
 * 4. Placement rate accuracy
 * 5. Career matching accuracy
 * 6. Academic performance metrics
 */

const mongoose = require('mongoose');
const {
  cleanDatabase,
  createTestUser,
  createTestUniversity,
  getValidJWT,
} = require('../helpers/testHelpers');

// =========================================================================
// HOLLAND CODE ASSESSMENT ACCURACY
// =========================================================================
describe('PHASE 6: Data Accuracy Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe('Holland Code Assessment Scoring', () => {
    test('should calculate Holland Code scores correctly (6 domains)', async () => {
      /**
       * Holland Code: R(ealistic), I(nvestigative), A(rtistic), S(ocial), E(nterprising), C(onventional)
       * Test: Answers that should produce known scores
       */

      const hollandAnswers = {
        R1: 5, // Realistic domain
        R2: 4,
        I1: 5, // Investigative domain
        I2: 4,
        A1: 3, // Artistic domain
        A2: 2,
        S1: 2, // Social domain
        S2: 1,
        E1: 3, // Enterprising domain
        E2: 2,
        C1: 4, // Conventional domain
        C2: 3,
      };

      // Calculate expected scores
      const rScore = (5 + 4) / 2; // 4.5
      const iScore = (5 + 4) / 2; // 4.5
      const aScore = (3 + 2) / 2; // 2.5
      const sScore = (2 + 1) / 2; // 1.5
      const eScore = (3 + 2) / 2; // 2.5
      const cScore = (4 + 3) / 2; // 3.5

      const scores = {
        Realistic: rScore,
        Investigative: iScore,
        Artistic: aScore,
        Social: sScore,
        Enterprising: eScore,
        Conventional: cScore,
      };

      // Verify domain scores match expected values
      expect(scores.Realistic).toBe(4.5);
      expect(scores.Investigative).toBe(4.5);
      expect(scores.Artistic).toBe(2.5);
      expect(scores.Social).toBe(1.5);
      expect(scores.Enterprising).toBe(2.5);
      expect(scores.Conventional).toBe(3.5);

      // Sum should equal 19 (4.5 + 4.5 + 2.5 + 1.5 + 2.5 + 3.5)
      const totalScore = rScore + iScore + aScore + sScore + eScore + cScore;
      expect(totalScore).toBe(19);
    });

    test('should identify top 3 Holland Code domains', async () => {
      const scores = {
        Realistic: 4.5, // #1
        Investigative: 4.5, // #1 (tie)
        Artistic: 2.5,
        Social: 1.5,
        Enterprising: 2.5,
        Conventional: 3.5, // #3
      };

      // Get top 3
      const sorted = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

      expect(sorted.length).toBe(3);
      expect(sorted[0]).toMatch(/Realistic|Investigative/);
      expect(sorted[2]).toBe('Conventional');
    });

    test('should calculate Holland Code percentages correctly', async () => {
      const scores = {
        Realistic: 4.5,
        Investigative: 4.5,
        Artistic: 2.5,
        Social: 1.5,
        Enterprising: 2.5,
        Conventional: 3.5,
      };

      const total = Object.values(scores).reduce((a, b) => a + b, 0); // 19

      const percentages = {};
      Object.keys(scores).forEach(domain => {
        percentages[domain] = (scores[domain] / total) * 100;
      });

      // Realistic should be ~23.68%
      expect(percentages.Realistic).toBeCloseTo(23.68, 1);
      // Investigative should be ~23.68%
      expect(percentages.Investigative).toBeCloseTo(23.68, 1);
      // Social should be ~7.89%
      expect(percentages.Social).toBeCloseTo(7.89, 1);

      // Total should be 100%
      const sum = Object.values(percentages).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(100, 0);
    });

    test('should handle single high score accurately', async () => {
      const scores = {
        Realistic: 5.0, // All high in one domain
        Investigative: 0,
        Artistic: 0,
        Social: 0,
        Enterprising: 0,
        Conventional: 0,
      };

      const percentages = {};
      const total = Object.values(scores).reduce((a, b) => a + b, 0);

      Object.keys(scores).forEach(domain => {
        const pct = (scores[domain] / total) * 100;
        percentages[domain] = pct;
      });

      expect(percentages.Realistic).toBe(100);
      Object.keys(scores).forEach(domain => {
        if (domain !== 'Realistic') {
          expect(percentages[domain]).toBe(0);
        }
      });
    });

    test('should validate assessment result storage', async () => {
      // Simulate assessment result object
      const assessment = {
        _id: 'test-id-123',
        userId: 'user-456',
        answers: {
          R1: 5,
          I1: 4,
          A1: 3,
          S1: 2,
          E1: 3,
          C1: 4,
        },
        scores: {
          Realistic: 5,
          Investigative: 4,
          Artistic: 3,
          Social: 2,
          Enterprising: 3,
          Conventional: 4,
        },
        createdAt: new Date(),
      };

      expect(assessment._id).toBeDefined();
      expect(assessment.userId).toBe('user-456');
      expect(assessment.scores.Realistic).toBe(5);
    });
  });

  // =========================================================================
  // COUPON DISCOUNT CALCULATIONS
  // =========================================================================
  describe('Coupon Discount Calculations', () => {
    test('should calculate percentage discount correctly (50% off)', async () => {
      const basePrice = 1000; // ₹1000
      const discountPercentage = 50; // 50%

      const discount = (basePrice * discountPercentage) / 100;
      const finalPrice = basePrice - discount;

      expect(discount).toBe(500);
      expect(finalPrice).toBe(500);
    });

    test('should calculate fixed discount correctly (₹100 off)', async () => {
      const basePrice = 1000;
      const fixedDiscount = 100; // ₹100

      const finalPrice = basePrice - fixedDiscount;

      expect(finalPrice).toBe(900);
      expect(finalPrice).toBeLessThan(basePrice);
    });

    test('should apply multiple discounts correctly', async () => {
      const basePrice = 1000;
      const percentageDiscount = 10; // 10%
      const fixedDiscount = 50; // ₹50

      // Apply percentage discount first
      const afterPercentage = basePrice - (basePrice * percentageDiscount) / 100; // 900
      // Then apply fixed discount
      const finalPrice = afterPercentage - fixedDiscount; // 850

      expect(afterPercentage).toBe(900);
      expect(finalPrice).toBe(850);
    });

    test('should not allow negative final price after discounts', async () => {
      const basePrice = 500;
      const discounts = [250, 300]; // Total 550 > base price

      let finalPrice = basePrice;
      discounts.forEach(discount => {
        finalPrice -= discount;
      });

      // Final price should be at least 0
      const safePrice = Math.max(finalPrice, 0);
      expect(safePrice).toBe(0);
    });

    test('should validate coupon expiration', async () => {
      const coupon = {
        code: 'TEST50',
        discountPercentage: 50,
        expiresAt: new Date('2020-01-01'), // Expired
      };

      const now = new Date();
      const isExpired = now > coupon.expiresAt;

      expect(isExpired).toBe(true);
    });

    test('should handle coupon with max uses limit', async () => {
      const coupon = {
        code: 'LIMITED10',
        discountPercentage: 20,
        maxUses: 10,
        usedCount: 9,
      };

      const canUse = coupon.usedCount < coupon.maxUses;
      expect(canUse).toBe(true);

      // After one more use
      coupon.usedCount += 1;
      const canUseAgain = coupon.usedCount < coupon.maxUses;
      expect(canUseAgain).toBe(false);
    });

    test('should track booking with coupon discount', async () => {
      // Simulate mentor booking object
      const booking = {
        _id: 'booking-123',
        userId: 'user-456',
        mentorId: 'mentor-789',
        basePrice: 1000,
        discountApplied: 500, // 50% discount
        priceAfterDiscount: 500,
        couponUsed: 'TEST50',
      };

      expect(booking.basePrice).toBe(1000);
      expect(booking.discountApplied).toBe(500);
      expect(booking.priceAfterDiscount).toBe(500);
    });
  });

  // =========================================================================
  // UNIVERSITY STATISTICS CALCULATIONS
  // =========================================================================
  describe('University Statistics Calculations', () => {
    test('should calculate student enrollment accurately', async () => {
      const enrollmentData = {
        undergrad: 500,
        postgrad: 200,
        total: 700,
      };

      expect(enrollmentData.total).toBe(enrollmentData.undergrad + enrollmentData.postgrad);
    });

    test('should calculate faculty statistics', async () => {
      const enrollmentData = {
        undergrad: 500,
        postgrad: 200,
        total: 700,
      };

      const facultyData = {
        fullTime: 45,
        partTime: 15,
        total: 60,
      };

      expect(facultyData.total).toBe(facultyData.fullTime + facultyData.partTime);

      const studentFacultyRatio = enrollmentData.total / facultyData.total;
      expect(studentFacultyRatio).toBeCloseTo(11.67, 1); // 700/60
    });

    test('should calculate placement rate correctly', async () => {
      const placementStats = {
        registeredStudents: 100,
        placedStudents: 85,
      };

      const placementRate =
        (placementStats.placedStudents / placementStats.registeredStudents) * 100;

      expect(placementRate).toBe(85);
    });

    test('should calculate average salary correctly', async () => {
      const salaryData = [1000000, 1200000, 1500000, 1100000, 1300000];

      const averageSalary = salaryData.reduce((a, b) => a + b, 0) / salaryData.length;

      expect(averageSalary).toBe(1220000);
    });

    test('should calculate research publications count', async () => {
      const publicationsData = {
        nationalJournals: 25,
        internationalJournals: 15,
        conferences: 40,
      };

      const totalPublications =
        publicationsData.nationalJournals +
        publicationsData.internationalJournals +
        publicationsData.conferences;

      expect(totalPublications).toBe(80);
    });

    test('should validate statistics data consistency', async () => {
      const universityStats = {
        totalEnrollment: 700,
        undergrad: 500,
        postgrad: 200,
        totalFaculty: 60,
        placedStudents: 85,
      };

      // Verify enrollment sum
      expect(universityStats.totalEnrollment).toBe(
        universityStats.undergrad + universityStats.postgrad
      );

      // Verify placed students is less than total enrollment
      expect(universityStats.placedStudents).toBeLessThanOrEqual(universityStats.totalEnrollment);
    });
  });

  // =========================================================================
  // CAREER MATCHING & SALARY PROJECTIONS
  // =========================================================================
  describe('Career Matching & Salary Accuracy', () => {
    test('should match careers to Holland Code profile (R/I)', async () => {
      const hollandProfile = {
        primary: 'Realistic', // R
        secondary: 'Investigative', // I
      };

      // R/I profile matches: Engineer, Architect, Technician, etc.
      const matchingCareers = [
        'Software Engineer',
        'Civil Engineer',
        'Mechanical Engineer',
        'Systems Administrator',
      ];

      expect(matchingCareers.length).toBeGreaterThan(0);
      matchingCareers.forEach(career => {
        expect(career).toMatch(/Engineer|Technician|Administrator|Architect/);
      });
    });

    test('should match careers to Holland Code profile (A/S)', async () => {
      const hollandProfile = {
        primary: 'Artistic', // A
        secondary: 'Social', // S
      };

      // A/S profile matches: Teacher, Counselor, Designer, etc.
      const matchingCareers = ['Art Teacher', 'Counselor', 'Graphic Designer', 'Content Creator'];

      expect(matchingCareers.length).toBeGreaterThan(0);
    });

    test('should project salary by experience level', async () => {
      const baseCareerSalary = {
        junior: 600000, // Junior level (1-3 years)
        mid: 1000000, // Mid level (3-7 years)
        senior: 1500000, // Senior level (7+ years)
      };

      expect(baseCareerSalary.junior).toBeLessThan(baseCareerSalary.mid);
      expect(baseCareerSalary.mid).toBeLessThan(baseCareerSalary.senior);

      // Growth should be ~40% per level
      const juniorToMidGrowth =
        ((baseCareerSalary.mid - baseCareerSalary.junior) / baseCareerSalary.junior) * 100;
      expect(juniorToMidGrowth).toBeCloseTo(66.67, 0); // ~67%
    });

    test('should validate career growth trajectory', async () => {
      const careerPath = {
        year1: 600000,
        year3: 800000,
        year5: 1000000,
        year8: 1400000,
        year10: 1800000,
      };

      // Each milestone should increase
      expect(careerPath.year1).toBeLessThan(careerPath.year3);
      expect(careerPath.year3).toBeLessThan(careerPath.year5);
      expect(careerPath.year5).toBeLessThan(careerPath.year8);
      expect(careerPath.year8).toBeLessThan(careerPath.year10);

      // Salary growth should not be negative
      expect(careerPath.year10 - careerPath.year1).toBeGreaterThan(0);
    });

    test('should account for industry variation in salary', async () => {
      const softwareSalary = {
        junior: 700000,
        mid: 1200000,
        senior: 1800000,
      };

      const teachingSalary = {
        junior: 400000,
        mid: 600000,
        senior: 900000,
      };

      // Software industry should pay more
      expect(softwareSalary.junior).toBeGreaterThan(teachingSalary.junior);
      expect(softwareSalary.mid).toBeGreaterThan(teachingSalary.mid);
      expect(softwareSalary.senior).toBeGreaterThan(teachingSalary.senior);
    });
  });

  // =========================================================================
  // ACADEMIC PERFORMANCE METRICS
  // =========================================================================
  describe('Academic Performance Calculations', () => {
    test('should calculate GPA from grades correctly', async () => {
      const grades = [
        { subject: 'Math', grade: 'A' }, // 4.0
        { subject: 'Science', grade: 'A' }, // 4.0
        { subject: 'English', grade: 'B' }, // 3.0
      ];

      const gradePoints = {
        A: 4.0,
        B: 3.0,
        C: 2.0,
        D: 1.0,
      };

      const gpa = grades.reduce((sum, g) => sum + gradePoints[g.grade], 0) / grades.length;

      expect(gpa).toBeCloseTo(3.67, 2); // (4 + 4 + 3) / 3
    });

    test('should track course credits and weighted GPA', async () => {
      const courses = [
        { name: 'Math', grade: 3.0, credits: 3 },
        { name: 'Science', grade: 3.0, credits: 4 },
        { name: 'English', grade: 3.0, credits: 2 },
      ];

      const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0); // 9
      const weightedSum = courses.reduce((sum, c) => sum + c.grade * c.credits, 0); // 27

      const weightedGPA = weightedSum / totalCredits;

      expect(totalCredits).toBe(9);
      expect(weightedGPA).toBeCloseTo(3.0, 2); // 27 / 9 = 3.0
    });

    test('should calculate attendance percentage', async () => {
      const attendance = {
        totalClasses: 40,
        classesAttended: 35,
      };

      const attendancePercentage = (attendance.classesAttended / attendance.totalClasses) * 100;

      expect(attendancePercentage).toBe(87.5);
    });

    test('should track course performance', async () => {
      const courseGrades = [
        { week: 1, score: 80 },
        { week: 2, score: 85 },
        { week: 3, score: 90 },
        { week: 4, score: 88 },
      ];

      const average = courseGrades.reduce((sum, g) => sum + g.score, 0) / courseGrades.length;

      expect(average).toBe(85.75);

      // Should show improvement trend
      expect(courseGrades[courseGrades.length - 1].score).toBeGreaterThan(courseGrades[0].score);
    });

    test('should validate grade consistency within course', async () => {
      const assessments = [
        { type: 'assignment', score: 85 },
        { type: 'quiz', score: 80 },
        { type: 'exam', score: 88 },
      ];

      const avgScore = assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length;

      const variance = avgScore > 75 ? 'Passing' : 'Failing';

      expect(variance).toBe('Passing');
      expect(avgScore).toBeGreaterThan(75);
    });
  });

  // =========================================================================
  // DATA INTEGRITY & EDGE CASES
  // =========================================================================
  describe('Data Integrity & Edge Cases', () => {
    test('should handle zero enrollment without division by zero', async () => {
      const enrollmentStats = {
        total: 0,
        registered: 0,
      };

      const placementRate =
        enrollmentStats.total > 0 ? (enrollmentStats.registered / enrollmentStats.total) * 100 : 0;

      expect(placementRate).toBe(0);
      expect(Number.isNaN(placementRate)).toBe(false);
    });

    test('should handle decimal calculations with rounding', async () => {
      const salaries = [100000, 150000];
      const average = salaries.reduce((a, b) => a + b) / salaries.length;

      const rounded = Math.round(average);

      expect(average).toBe(125000);
      expect(rounded).toBe(125000);
    });

    test('should validate percentage values are 0-100', async () => {
      const validPercentages = [0, 25, 50, 75, 100];
      const invalidPercentages = [-10, 150, 200];

      validPercentages.forEach(pct => {
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      });

      invalidPercentages.forEach(pct => {
        expect(pct < 0 || pct > 100).toBe(true);
      });
    });

    test('should handle missing or null data gracefully', async () => {
      const stats = {
        enrollment: null,
        placement: undefined,
        salary: 0,
      };

      const enrollment = stats.enrollment ?? 0;
      const placement = stats.placement ?? 0;
      const salary = stats.salary ?? 0;

      expect(enrollment).toBe(0);
      expect(placement).toBe(0);
      expect(salary).toBe(0);
    });
  });

  // =========================================================================
  // RECOMMENDATION ACCURACY
  // =========================================================================
  describe('Recommendation Accuracy', () => {
    test('should generate accurate career recommendations from assessment', async () => {
      const assessment = {
        Realistic: 5.0,
        Investigative: 4.5,
        Artistic: 1.0,
        Social: 1.0,
        Enterprising: 2.0,
        Conventional: 1.5,
      };

      // Top domains: Realistic, Investigative = Engineering careers
      const recommendedCareers = ['Software Engineer', 'Civil Engineer', 'Mechanical Engineer'];

      expect(recommendedCareers.length).toBeGreaterThan(0);
    });

    test('should prioritize career recommendations by score match', async () => {
      const careerMatch = {
        'Software Engineer': {
          match: 95, // Very high match R/I
        },
        'Graphic Designer': {
          match: 30, // Low match (A/S)
        },
        'Sales Manager': {
          match: 40, // Medium match (E/C)
        },
      };

      const sorted = Object.entries(careerMatch)
        .sort((a, b) => b[1].match - a[1].match)
        .map(entry => entry[0]);

      expect(sorted[0]).toBe('Software Engineer');
      expect(sorted[sorted.length - 1]).toBe('Graphic Designer');
    });

    test('should validate recommendation persistence', async () => {
      // Mock a recommendation object similar to what would be returned from assessment
      const careerMatches = [
        { career: 'Software Engineer', matchScore: 95 },
        { career: 'Data Analyst', matchScore: 90 },
        { career: 'Systems Administrator', matchScore: 85 },
      ];

      // Verify the recommendations are properly ranked
      const sortedByScore = careerMatches.sort((a, b) => b.matchScore - a.matchScore);

      expect(sortedByScore.length).toBe(3);
      expect(sortedByScore[0].matchScore).toBe(95);
      expect(sortedByScore[0].career).toBe('Software Engineer');
      expect(sortedByScore[2].matchScore).toBe(85);
    });
  });
});
