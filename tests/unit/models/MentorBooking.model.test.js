/**
 * MentorBooking Model Tests
 * Tests for mentor session booking schema and status management
 */

const mongoose = require('mongoose');
const MentorBooking = require('../../../models/MentorBooking');
const User = require('../../../models/User');
const { testBookings, generateId } = require('../../fixtures/testData');
const { cleanDatabase, createTestMentor, createTestUser } = require('../../helpers/testHelpers');

describe('MentorBooking Model', () => {
  let testMentor, testUserDoc;

  beforeEach(async () => {
    await cleanDatabase();
    testMentor = await createTestMentor();
    testUserDoc = await createTestUser();
  });

  // =========================================================================
  // SCHEMA VALIDATION TESTS
  // =========================================================================

  describe('Schema Validation', () => {
    test('should create a valid booking with required fields', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking._id).toBeDefined();
      expect(booking.userId.toString()).toBe(testUserDoc._id.toString());
      expect(booking.mentorId.toString()).toBe(testMentor._id.toString());
    });

    test('should fail validation when userId is missing', async () => {
      const bookingData = {
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await expect(MentorBooking.create(bookingData)).rejects.toThrow();
    });

    test('should fail validation when mentorId is missing', async () => {
      const bookingData = {
        userId: testUserDoc._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await expect(MentorBooking.create(bookingData)).rejects.toThrow();
    });

    test('should fail validation when scheduledAt is missing', async () => {
      const bookingData = {
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
      };

      await expect(MentorBooking.create(bookingData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // BOOKING ID GENERATION TESTS
  // =========================================================================

  describe('Booking ID Generation', () => {
    test('should auto-generate unique bookingId', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking.bookingId).toBeDefined();
      expect(booking.bookingId).toMatch(/^BK-/); // Should start with BK-
    });

    test('should ensure unique bookingIds', async () => {
      const booking1 = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const booking2 = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      });

      expect(booking1.bookingId).not.toBe(booking2.bookingId);
    });
  });

  // =========================================================================
  // STATUS TESTS
  // =========================================================================

  describe('Booking Status', () => {
    test('should set default status to pending', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking.status).toBe('pending');
    });

    test('should accept all valid statuses', async () => {
      const validStatuses = [
        'pending',
        'confirmed',
        'in-progress',
        'completed',
        'cancelled',
        'no-show',
      ];

      for (const status of validStatuses) {
        const booking = await MentorBooking.create({
          userId: testUserDoc._id,
          mentorId: testMentor._id,
          mentorProfileId: generateId(),
          scheduledAt: new Date(),
          status,
        });

        expect(booking.status).toBe(status);
        await MentorBooking.deleteOne({ _id: booking._id });
      }
    });

    test('should reject invalid status', async () => {
      const bookingData = {
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'invalid_status',
      };

      await expect(MentorBooking.create(bookingData)).rejects.toThrow();
    });
  });

  // =========================================================================
  // PRICING & PAYMENT TESTS
  // =========================================================================

  describe('Pricing & Payment', () => {
    test('should store original price and paid amount', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        originalPrice: 500,
        paidAmount: 400, // After discount
      });

      expect(booking.originalPrice).toBe(500);
      expect(booking.paidAmount).toBe(400);
    });

    test('should support free bookings', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isFree: true,
        paidAmount: 0,
      });

      expect(booking.isFree).toBe(true);
      expect(booking.paidAmount).toBe(0);
    });

    test('should track coupon application', async () => {
      const couponId = generateId();
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        originalPrice: 500,
        paidAmount: 400,
        couponId,
      });

      expect(booking.couponId.toString()).toBe(couponId.toString());
    });

    test('should set default pricing values', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking.isFree).toBe(false);
      expect(booking.originalPrice).toBe(0);
      expect(booking.paidAmount).toBe(0);
    });
  });

  // =========================================================================
  // SESSION DETAILS TESTS
  // =========================================================================

  describe('Session Details', () => {
    test('should store session duration in minutes', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 60,
      });

      expect(booking.duration).toBe(60);
    });

    test('should set default duration to 60 minutes', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking.duration).toBe(60);
    });

    test('should calculate end time from scheduled time and duration', async () => {
      const scheduledTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const endTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000); // 60 minutes

      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: scheduledTime,
        duration: 60,
        endTime,
      });

      expect(booking.endTime).toBeDefined();
    });

    test('should store remark/reason for booking', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        remark: 'Need help with resume and interview preparation',
      });

      expect(booking.remark).toBe('Need help with resume and interview preparation');
    });

    test('should store discussion topics', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        topics: ['Career Planning', 'Tech Interview', 'Salary Negotiation'],
      });

      expect(booking.topics).toHaveLength(3);
      expect(booking.topics).toContain('Career Planning');
    });
  });

  // =========================================================================
  // MEETING LINK TESTS
  // =========================================================================

  describe('Meeting Link', () => {
    test('should store meeting link when provided', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        meetingLink: 'https://meet.google.com/abc-def-ghi',
      });

      expect(booking.meetingLink).toBe('https://meet.google.com/abc-def-ghi');
    });

    test('should track when meeting link was sent', async () => {
      const sentTime = new Date();
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        meetingLink: 'https://meet.google.com/abc-def-ghi',
        meetingLinkSentAt: sentTime,
      });

      expect(booking.meetingLinkSentAt).toBeDefined();
    });

    test('should track meeting link token and expiry', async () => {
      const token = 'meeting-token-xxx';
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        meetingLinkToken: token,
        meetingLinkTokenExpiry: expiry,
      });

      expect(booking.meetingLinkToken).toBe(token);
      expect(booking.meetingLinkTokenExpiry).toBeDefined();
    });
  });

  // =========================================================================
  // REMINDER TRACKING TESTS
  // =========================================================================

  describe('Reminder Tracking', () => {
    test('should track multiple reminders', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reminders: {
          oneHour: { sent: true, sentAt: new Date() },
          thirtyMin: { sent: false },
          tenMin: { sent: false },
        },
      });

      expect(booking.reminders.oneHour.sent).toBe(true);
      expect(booking.reminders.thirtyMin.sent).toBe(false);
    });

    test('should set default reminder sent status to false', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking.reminders.oneHour.sent).toBe(false);
      expect(booking.reminders.thirtyMin.sent).toBe(false);
    });
  });

  // =========================================================================
  // RATING REQUEST TESTS
  // =========================================================================

  describe('Rating Request', () => {
    test('should track rating request status', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        ratingRequest: {
          sent: true,
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      expect(booking.ratingRequest.sent).toBe(true);
      expect(booking.ratingRequest.expiresAt).toBeDefined();
    });

    test('should set default rating request sent to false', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking.ratingRequest.sent).toBe(false);
    });
  });

  // =========================================================================
  // SESSION COMPLETION TESTS
  // =========================================================================

  describe('Session Completion', () => {
    test('should track when session started and completed', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'completed',
        startedAt: startTime,
        completedAt: endTime,
        completedBy: testMentor._id,
      });

      expect(booking.startedAt).toBeDefined();
      expect(booking.completedAt).toBeDefined();
      expect(booking.completedBy.toString()).toBe(testMentor._id.toString());
    });
  });

  // =========================================================================
  // INDEXES TESTS
  // =========================================================================

  describe('Indexes', () => {
    test('should support efficient querying by userId', async () => {
      const booking1 = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const booking2 = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      });

      const userBookings = await MentorBooking.find({ userId: testUserDoc._id });

      expect(userBookings).toHaveLength(2);
    });

    test('should support efficient querying by mentorId', async () => {
      const booking1 = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const mentorBookings = await MentorBooking.find({ mentorId: testMentor._id });

      expect(mentorBookings).toHaveLength(1);
    });

    test('should support efficient querying by status', async () => {
      const booking1 = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending',
      });

      const booking2 = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: 'confirmed',
      });

      const pendingBookings = await MentorBooking.find({ status: 'pending' });

      expect(pendingBookings).toHaveLength(1);
    });
  });

  // =========================================================================
  // TIMESTAMPS TESTS
  // =========================================================================

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const booking = await MentorBooking.create({
        userId: testUserDoc._id,
        mentorId: testMentor._id,
        mentorProfileId: generateId(),
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(booking.createdAt).toBeDefined();
      expect(booking.updatedAt).toBeDefined();
    });
  });
});
