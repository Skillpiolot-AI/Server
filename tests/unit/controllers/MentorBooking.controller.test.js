/**
 * Mentor Booking Controller Tests
 * Tests for booking creation, status management, and pricing calculations with coupons
 * Focus: Accurate pricing, status transitions, and coupon application
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const MentorBooking = require('../../../models/MentorBooking');
const MentorCoupon = require('../../../models/MentorCoupon');
const User = require('../../../models/User');
const MentorProfile = require('../../../models/MentorProfile');
const { testUsers, generateId } = require('../../fixtures/testData');
const {
  cleanDatabase,
  createTestUser,
  createTestMentor,
  getValidJWT,
} = require('../../helpers/testHelpers');

describe('Mentor Booking Controller', () => {
  let server;
  let mentorUser;
  let studentUser;
  let mentorToken;
  let studentToken;
  let mentorProfile;

  beforeEach(async () => {
    await cleanDatabase();

    mentorUser = await createTestMentor('Mentor');
    studentUser = await createTestUser('User');

    mentorToken = getValidJWT(mentorUser._id, 'Mentor');
    studentToken = getValidJWT(studentUser._id, 'User');

    // Create mentor profile
    mentorProfile = await MentorProfile.create({
      userId: mentorUser._id,
      expertise: ['JavaScript', 'React'],
      hourlyRate: 500,
      availability: [
        {
          dayOfWeek: 'Monday',
          startTime: '09:00',
          endTime: '17:00',
        },
      ],
    });
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // BOOKING CREATION TESTS
  // =========================================================================
  describe('Booking Creation', () => {
    test('should create booking with valid data', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        sessionDuration: 60, // 1 hour
        topic: 'React Fundamentals',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.mentorId.toString()).toBe(mentorUser._id.toString());
      expect(response.body.booking.studentId.toString()).toBe(studentUser._id.toString());
    });

    test('should generate unique booking ID with BK prefix', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        topic: 'JavaScript Patterns',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.booking.bookingId).toMatch(/^BK-/);
    });

    test('should set initial status to pending', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        topic: 'Career Guidance',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.booking.status).toBe('pending');
    });

    test('should reject booking in the past', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        sessionDuration: 60,
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
    });

    test('should reject booking without minimum notification period', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        sessionDuration: 60,
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
    });

    test('should calculate original price based on hourly rate', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 90, // 1.5 hours
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      const expectedPrice = (mentorProfile.hourlyRate * 90) / 60; // 500 * 1.5 = 750
      expect(response.body.booking.originalPrice).toBe(expectedPrice);
    });
  });

  // =========================================================================
  // COUPON & PRICING TESTS
  // =========================================================================
  describe('Coupon Application', () => {
    beforeEach(async () => {
      // Create coupons for testing
      await MentorCoupon.create([
        {
          code: 'SAVE50',
          discountType: 'percentage',
          discountValue: 50,
          maxUses: 10,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          mentorId: mentorUser._id,
        },
        {
          code: 'FLAT100',
          discountType: 'fixed',
          discountValue: 100,
          maxUses: 5,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          mentorId: mentorUser._id,
        },
        {
          code: 'EXPIRED',
          discountType: 'percentage',
          discountValue: 25,
          maxUses: 10,
          expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
          mentorId: mentorUser._id,
        },
      ]);
    });

    test('should apply percentage discount correctly', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60, // 500 base price
        couponCode: 'SAVE50', // 50% off
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.booking.couponCode).toBe('SAVE50');
      expect(response.body.booking.paidPrice).toBe(250); // 500 * 0.5
    });

    test('should apply fixed discount correctly', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60, // 500 base price
        couponCode: 'FLAT100', // 100 off
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.booking.paidPrice).toBe(400); // 500 - 100
    });

    test('should not allow price to go below zero with discount', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDuration: 30, // 250 base price
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        couponCode: 'FLAT100', // 100 off
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.booking.paidPrice).toBeGreaterThanOrEqual(0);
    });

    test('should reject expired coupon', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        couponCode: 'EXPIRED',
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
    });

    test('should reject invalid coupon code', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        couponCode: 'INVALID',
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
    });

    test('should decrement coupon uses after application', async () => {
      const coupon = await MentorCoupon.findOne({ code: 'SAVE50' });
      const initialUses = coupon.uses || 0;

      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        couponCode: 'SAVE50',
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);

      const updatedCoupon = await MentorCoupon.findOne({ code: 'SAVE50' });
      expect(updatedCoupon.uses).toBe(initialUses + 1);
    });

    test('should reject coupon when max uses reached', async () => {
      // Update coupon to have reached max uses
      await MentorCoupon.updateOne(
        { code: 'FLAT100' },
        { uses: 5 } // maxUses is 5
      );

      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        couponCode: 'FLAT100',
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // STATUS TRANSITION TESTS
  // =========================================================================
  describe('Booking Status Management', () => {
    let booking;

    beforeEach(async () => {
      booking = await MentorBooking.create({
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        originalPrice: 500,
        paidPrice: 500,
        status: 'pending',
      });
    });

    test('should transition from pending to confirmed', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/confirm`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('confirmed');
    });

    test('should transition from confirmed to in-progress', async () => {
      await MentorBooking.findByIdAndUpdate(booking._id, { status: 'confirmed' });

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/start`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('in-progress');
    });

    test('should mark booking as completed', async () => {
      await MentorBooking.findByIdAndUpdate(booking._id, {
        status: 'in-progress',
        sessionStarted: new Date(),
      });

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          sessionCompleted: new Date(),
          completedBy: mentorUser._id,
        });

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('completed');
      expect(response.body.booking.sessionCompleted).toBeDefined();
    });

    test('should allow cancellation from pending status', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('cancelled');
    });

    test('should prevent invalid status transitions', async () => {
      // Try to move directly from pending to completed
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(400);
    });

    test('should track no-show status', async () => {
      await MentorBooking.findByIdAndUpdate(booking._id, { status: 'confirmed' });

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/no-show`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('no-show');
    });
  });

  // =========================================================================
  // MEETING LINK & REMINDER TESTS
  // =========================================================================
  describe('Meeting Links and Reminders', () => {
    test('should generate meeting link with token', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        meetingProvider: 'zoom',
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.booking.meetingLink).toBeDefined();
      expect(response.body.booking.meetingToken).toBeDefined();
      expect(response.body.booking.tokenExpiry).toBeDefined();
    });

    test('should schedule reminders at correct times', async () => {
      const bookingData = {
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        sessionDuration: 60,
        topic: 'React',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      const booking = response.body.booking;

      // Check reminders are scheduled
      expect(booking.reminders.oneHour).toBeDefined();
      expect(booking.reminders.oneHour.scheduled).toBe(true);
      expect(booking.reminders.thirtyMin).toBeDefined();
      expect(booking.reminders.tenMin).toBeDefined();
    });

    test('should mark reminder as sent after notification', async () => {
      const booking = await MentorBooking.create({
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        sessionDuration: 60,
        originalPrice: 500,
        paidPrice: 500,
        reminders: {
          oneHour: { scheduled: true, sent: false },
          thirtyMin: { scheduled: true, sent: false },
          tenMin: { scheduled: true, sent: false },
        },
      });

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/reminder-sent`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ reminderType: 'oneHour' });

      expect(response.status).toBe(200);
      expect(response.body.booking.reminders.oneHour.sent).toBe(true);
    });
  });

  // =========================================================================
  // RATING & FEEDBACK TESTS
  // =========================================================================
  describe('Rating and Feedback', () => {
    let completedBooking;

    beforeEach(async () => {
      completedBooking = await MentorBooking.create({
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Past
        sessionDuration: 60,
        originalPrice: 500,
        paidPrice: 500,
        status: 'completed',
        sessionCompleted: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      });
    });

    test('should allow rating only after completion', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${completedBooking._id}/rate`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 5,
          feedback: 'Excellent session!',
        });

      expect(response.status).toBe(200);
      expect(response.body.booking.studentRating).toBe(5);
    });

    test('should validate rating between 1-5', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${completedBooking._id}/rate`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 10, // Invalid
          feedback: 'Excellent session!',
        });

      expect(response.status).toBe(400);
    });

    test('should calculate mentor average rating', async () => {
      // Create multiple rated bookings
      const ratings = [5, 4, 5, 3];

      for (const rating of ratings) {
        const booking = await MentorBooking.create({
          mentorId: mentorUser._id,
          studentId: generateId(),
          sessionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          sessionDuration: 60,
          originalPrice: 500,
          paidPrice: 500,
          status: 'completed',
          studentRating: rating,
        });
      }

      const response = await request(app)
        .get(`/api/mentors/${mentorUser._id}/rating`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      const averageRating = ratings.reduce((a, b) => a + b) / ratings.length;
      expect(response.body.averageRating).toBeCloseTo(averageRating, 1);
    });
  });

  // =========================================================================
  // AUTHORIZATION TESTS
  // =========================================================================
  describe('Authorization', () => {
    test('should prevent student from confirming mentor booking', async () => {
      const booking = await MentorBooking.create({
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        originalPrice: 500,
        paidPrice: 500,
        status: 'pending',
      });

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/confirm`)
        .set('Authorization', `Bearer ${studentToken}`); // Student token

      expect(response.status).toBe(403);
    });

    test('should prevent mentor from rating their own booking', async () => {
      const booking = await MentorBooking.create({
        mentorId: mentorUser._id,
        studentId: studentUser._id,
        sessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        sessionDuration: 60,
        originalPrice: 500,
        paidPrice: 500,
        status: 'completed',
      });

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/rate`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          rating: 5,
          feedback: 'Good mentor',
        });

      expect(response.status).toBe(403);
    });
  });
});
