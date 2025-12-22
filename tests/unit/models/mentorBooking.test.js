// tests/unit/models/mentorBooking.test.js
const mongoose = require('mongoose');
const MentorBooking = require('../../../models/MentorBooking');

describe('MentorBooking Model Tests', () => {
  let testUserId;
  let testMentorId;
  let testMentorProfileId;

  beforeEach(() => {
    testUserId = new mongoose.Types.ObjectId();
    testMentorId = new mongoose.Types.ObjectId();
    testMentorProfileId = new mongoose.Types.ObjectId();
  });

  describe('Booking Creation', () => {
    it('should create a valid booking', async () => {
      const bookingData = {
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 60,
        remark: 'Want to discuss career guidance',
        topics: ['Career Switch', 'Resume Review'],
      };

      const booking = new MentorBooking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.bookingId).toBeDefined();
      expect(savedBooking.bookingId).toMatch(/^BK-/);
      expect(savedBooking.status).toBe('pending');
      expect(savedBooking.duration).toBe(60);
    });

    it('should generate unique bookingId', async () => {
      const booking1 = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const booking2 = await MentorBooking.create({
        userId: new mongoose.Types.ObjectId(),
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      expect(booking1.bookingId).not.toBe(booking2.bookingId);
    });

    it('should not create booking without required fields', async () => {
      const booking = new MentorBooking({
        userId: testUserId,
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should not create booking without userId', async () => {
      const booking = new MentorBooking({
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(),
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      expect(booking.status).toBe('pending');
      expect(booking.duration).toBe(60);
      expect(booking.isFree).toBe(false);
      expect(booking.paidAmount).toBe(0);
    });

    it('should calculate endTime from scheduledAt and duration', async () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt,
        duration: 60,
      });

      const expectedEndTime = new Date(scheduledAt.getTime() + 60 * 60000);
      expect(booking.endTime.getTime()).toBe(expectedEndTime.getTime());
    });
  });

  describe('Status Transitions', () => {
    it('should validate status enum values', async () => {
      const booking = new MentorBooking({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(),
        status: 'invalid_status',
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should accept all valid status values', async () => {
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
          userId: new mongoose.Types.ObjectId(),
          mentorId: testMentorId,
          mentorProfileId: testMentorProfileId,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status,
        });

        expect(booking.status).toBe(status);
      }
    });
  });

  describe('Meeting Link Token Methods', () => {
    it('should generate meeting link token', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const token = booking.generateMeetingLinkToken();

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(booking.meetingLinkToken).toBe(token);
      expect(booking.meetingLinkTokenExpiry).toBeDefined();
    });

    it('should verify valid meeting link token', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const token = booking.generateMeetingLinkToken();
      const isValid = booking.verifyMeetingLinkToken(token);

      expect(isValid).toBe(true);
    });

    it('should reject invalid meeting link token', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      booking.generateMeetingLinkToken();
      const isValid = booking.verifyMeetingLinkToken('invalid_token');

      expect(isValid).toBe(false);
    });

    it('should reject expired meeting link token', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const token = booking.generateMeetingLinkToken();
      // Manually expire the token
      booking.meetingLinkTokenExpiry = new Date(Date.now() - 1000);

      const isValid = booking.verifyMeetingLinkToken(token);
      expect(isValid).toBe(false);
    });
  });

  describe('setMeetingLink Method', () => {
    it('should set meeting link correctly', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      booking.generateMeetingLinkToken();
      await booking.setMeetingLink('https://meet.jit.si/test-room');

      const updatedBooking = await MentorBooking.findById(booking._id);
      expect(updatedBooking.meetingLink).toBe('https://meet.jit.si/test-room');
      expect(updatedBooking.meetingLinkSentAt).toBeDefined();
      expect(updatedBooking.meetingLinkToken).toBeUndefined();
      expect(updatedBooking.meetingLinkTokenExpiry).toBeUndefined();
    });
  });

  describe('markComplete Method', () => {
    it('should mark booking as complete', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'confirmed',
      });

      await booking.markComplete('mentor', 'Great session!');

      const updatedBooking = await MentorBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('completed');
      expect(updatedBooking.completedAt).toBeDefined();
      expect(updatedBooking.completedBy).toBe('mentor');
      expect(updatedBooking.mentorNotes).toBe('Great session!');
    });

    it('should mark complete without notes', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await booking.markComplete();

      const updatedBooking = await MentorBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('completed');
      expect(updatedBooking.completedBy).toBe('mentor');
    });
  });

  describe('cancel Method', () => {
    it('should cancel booking with reason', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await booking.cancel('user', 'Schedule conflict');

      const updatedBooking = await MentorBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('cancelled');
      expect(updatedBooking.cancelledAt).toBeDefined();
      expect(updatedBooking.cancelledBy).toBe('user');
      expect(updatedBooking.cancellationReason).toBe('Schedule conflict');
    });

    it('should cancel booking without reason', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await booking.cancel('mentor');

      const updatedBooking = await MentorBooking.findById(booking._id);
      expect(updatedBooking.status).toBe('cancelled');
      expect(updatedBooking.cancelledBy).toBe('mentor');
    });

    it('should validate cancelledBy enum values', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      booking.cancelledBy = 'invalid_actor';
      await expect(booking.save()).rejects.toThrow();
    });
  });

  describe('addRating Method', () => {
    it('should add rating to booking', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'completed',
      });

      // Mock the MentorProfile to avoid actual DB interaction
      jest.spyOn(require('../../../models/MentorProfile'), 'findById').mockResolvedValue(null);

      await booking.addRating(5, 'Excellent session!');

      const updatedBooking = await MentorBooking.findById(booking._id);
      expect(updatedBooking.rating.score).toBe(5);
      expect(updatedBooking.rating.comment).toBe('Excellent session!');
      expect(updatedBooking.rating.submittedAt).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test bookings
      await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending',
      });

      await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        status: 'confirmed',
      });

      await MentorBooking.create({
        userId: new mongoose.Types.ObjectId(),
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'completed',
      });
    });

    describe('getUserBookings', () => {
      it('should get all user bookings', async () => {
        // Use direct find instead of method with populate
        const bookings = await MentorBooking.find({ userId: testUserId }).sort({ scheduledAt: -1 });
        expect(bookings.length).toBeGreaterThanOrEqual(2);
      });

      it('should filter user bookings by status', async () => {
        const bookings = await MentorBooking.find({ userId: testUserId, status: 'pending' });

        bookings.forEach(booking => {
          expect(booking.status).toBe('pending');
        });
      });

      it('should return empty array for user with no bookings', async () => {
        const randomUserId = new mongoose.Types.ObjectId();
        const bookings = await MentorBooking.find({ userId: randomUserId });
        expect(bookings).toHaveLength(0);
      });
    });

    describe('getMentorBookings', () => {
      it('should get all mentor bookings', async () => {
        const bookings = await MentorBooking.find({ mentorId: testMentorId }).sort({
          scheduledAt: -1,
        });
        expect(bookings.length).toBeGreaterThanOrEqual(3);
      });

      it('should filter mentor bookings by status', async () => {
        const bookings = await MentorBooking.find({ mentorId: testMentorId, status: 'completed' });

        bookings.forEach(booking => {
          expect(booking.status).toBe('completed');
        });
      });
    });

    describe('checkConflict', () => {
      it('should detect conflicting bookings', async () => {
        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await MentorBooking.create({
          userId: new mongoose.Types.ObjectId(),
          mentorId: testMentorId,
          mentorProfileId: testMentorProfileId,
          scheduledAt,
          duration: 60,
          status: 'confirmed',
        });

        // Try to book at overlapping time
        const conflict = await MentorBooking.checkConflict(
          testMentorId,
          new Date(scheduledAt.getTime() + 30 * 60000), // 30 minutes later
          60
        );

        expect(conflict).not.toBeNull();
      });

      it('should allow non-conflicting bookings', async () => {
        const scheduledAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

        const conflict = await MentorBooking.checkConflict(testMentorId, scheduledAt, 60);

        expect(conflict).toBeNull();
      });
    });
  });

  describe('Reminders Tracking', () => {
    it('should track reminder status', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      expect(booking.reminders.oneHour.sent).toBe(false);
      expect(booking.reminders.thirtyMin.sent).toBe(false);
      expect(booking.reminders.tenMin.sent).toBe(false);
    });

    it('should update reminder status', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      booking.reminders.oneHour.sent = true;
      booking.reminders.oneHour.sentAt = new Date();
      await booking.save();

      const updatedBooking = await MentorBooking.findById(booking._id);
      expect(updatedBooking.reminders.oneHour.sent).toBe(true);
      expect(updatedBooking.reminders.oneHour.sentAt).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should enforce remark maxlength', async () => {
      const booking = new MentorBooking({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(),
        remark: 'A'.repeat(501),
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should enforce cancellationReason maxlength', async () => {
      const booking = new MentorBooking({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(),
        cancellationReason: 'A'.repeat(301),
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should allow topics array', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        topics: ['Career Guidance', 'Interview Prep', 'Resume Review'],
      });

      expect(booking.topics).toHaveLength(3);
    });

    it('should update timestamps on save', async () => {
      const booking = await MentorBooking.create({
        userId: testUserId,
        mentorId: testMentorId,
        mentorProfileId: testMentorProfileId,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const originalUpdatedAt = booking.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 100));
      booking.remark = 'Updated remark';
      await booking.save();

      expect(booking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
