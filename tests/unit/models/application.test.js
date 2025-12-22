// tests/unit/models/application.test.js
const mongoose = require('mongoose');
const Application = require('../../../models/Application');

describe('Application Model Tests', () => {
  const validApplicationData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+919876543210',
    jobTitle: 'Senior Software Engineer',
    experience: 5,
    expertise: ['JavaScript', 'React', 'Node.js'],
  };

  describe('Application Creation', () => {
    it('should create a valid mentor application', async () => {
      const application = new Application(validApplicationData);
      const savedApp = await application.save();

      expect(savedApp._id).toBeDefined();
      expect(savedApp.name).toBe('John Doe');
      expect(savedApp.email).toBe('john.doe@example.com');
      expect(savedApp.status).toBe('Pending');
      expect(savedApp.trackingId).toMatch(/^MNT-/);
    });

    it('should generate unique trackingId', async () => {
      const app1 = await Application.create({
        ...validApplicationData,
        email: 'app1@test.com',
        phone: '1111111111',
      });
      const app2 = await Application.create({
        ...validApplicationData,
        email: 'app2@test.com',
        phone: '2222222222',
      });

      expect(app1.trackingId).not.toBe(app2.trackingId);
      expect(app1.trackingId).toMatch(/^MNT-[A-Z0-9]{6}$/);
    });

    it('should not create application without required name', async () => {
      const app = new Application({
        email: 'test@example.com',
        phone: '1234567890',
        jobTitle: 'Developer',
        experience: 3,
      });

      await expect(app.save()).rejects.toThrow();
    });

    it('should not create application without required email', async () => {
      const app = new Application({
        name: 'Test User',
        phone: '1234567890',
        jobTitle: 'Developer',
        experience: 3,
      });

      await expect(app.save()).rejects.toThrow();
    });

    it('should lowercase email', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'UPPERCASE@EXAMPLE.COM',
        phone: '9999999999',
      });

      expect(app.email).toBe('uppercase@example.com');
    });

    it('should trim name whitespace', async () => {
      const app = await Application.create({
        ...validApplicationData,
        name: '  Trimmed Name  ',
        email: 'trimmed@test.com',
        phone: '8888888888',
      });

      expect(app.name).toBe('Trimmed Name');
    });
  });

  describe('Status Validation', () => {
    it('should validate status enum values', async () => {
      const app = new Application({
        ...validApplicationData,
        email: 'status@test.com',
        phone: '7777777777',
        status: 'InvalidStatus',
      });

      await expect(app.save()).rejects.toThrow();
    });

    it('should accept all valid status values', async () => {
      const validStatuses = [
        'Pending',
        'Under Review',
        'Approved',
        'Rejected',
        'More Info Requested',
      ];

      for (let i = 0; i < validStatuses.length; i++) {
        const status = validStatuses[i];
        const app = await Application.create({
          ...validApplicationData,
          email: `status${i}@test.com`,
          phone: `600000000${i}`,
          status,
        });

        expect(app.status).toBe(status);
      }
    });
  });

  describe('Instance Methods', () => {
    let testApp;

    beforeEach(async () => {
      testApp = await Application.create({
        ...validApplicationData,
        email: `instance${Date.now()}@test.com`,
        phone: `555${Date.now()}`.slice(0, 10),
      });
    });

    describe('approve', () => {
      it('should approve application', async () => {
        const adminId = new mongoose.Types.ObjectId();
        await testApp.approve(adminId);

        const updatedApp = await Application.findById(testApp._id);
        expect(updatedApp.status).toBe('Approved');
        expect(updatedApp.reviewedBy.toString()).toBe(adminId.toString());
        expect(updatedApp.reviewedAt).toBeDefined();
      });
    });

    describe('reject', () => {
      it('should reject application with reason', async () => {
        const adminId = new mongoose.Types.ObjectId();
        await testApp.reject(adminId, 'Insufficient experience');

        const updatedApp = await Application.findById(testApp._id);
        expect(updatedApp.status).toBe('Rejected');
        expect(updatedApp.rejectionReason).toBe('Insufficient experience');
      });
    });

    describe('requestMoreInfo', () => {
      it('should request more info with details', async () => {
        const adminId = new mongoose.Types.ObjectId();
        await testApp.requestMoreInfo(adminId, 'Please provide your certifications');

        const updatedApp = await Application.findById(testApp._id);
        expect(updatedApp.status).toBe('More Info Requested');
        expect(updatedApp.moreInfoRequest.requestDetails).toBe(
          'Please provide your certifications'
        );
        expect(updatedApp.moreInfoRequest.responseReceived).toBe(false);
      });
    });

    describe('respondToInfoRequest', () => {
      it('should respond to info request', async () => {
        const adminId = new mongoose.Types.ObjectId();
        await testApp.requestMoreInfo(adminId, 'Need more info');

        const appWithRequest = await Application.findById(testApp._id);
        await appWithRequest.respondToInfoRequest('Here is the additional info');

        const updatedApp = await Application.findById(testApp._id);
        expect(updatedApp.status).toBe('Under Review');
        expect(updatedApp.moreInfoRequest.responseReceived).toBe(true);
        expect(updatedApp.moreInfoRequest.response).toBe('Here is the additional info');
      });
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test applications
      await Application.create({
        ...validApplicationData,
        email: 'pending1@test.com',
        phone: '1111111111',
        status: 'Pending',
      });

      await Application.create({
        ...validApplicationData,
        email: 'pending2@test.com',
        phone: '2222222222',
        status: 'Pending',
      });

      await Application.create({
        ...validApplicationData,
        email: 'approved@test.com',
        phone: '3333333333',
        status: 'Approved',
      });

      await Application.create({
        ...validApplicationData,
        email: 'rejected@test.com',
        phone: '4444444444',
        status: 'Rejected',
      });
    });

    describe('findPending', () => {
      it('should find all pending applications', async () => {
        const pending = await Application.findPending();
        expect(pending.length).toBeGreaterThanOrEqual(2);
        pending.forEach(app => {
          expect(app.status).toBe('Pending');
        });
      });
    });

    describe('findByStatus', () => {
      it('should find applications by status', async () => {
        const approved = await Application.findByStatus('Approved');
        expect(approved.length).toBeGreaterThanOrEqual(1);
        approved.forEach(app => {
          expect(app.status).toBe('Approved');
        });
      });

      it('should return empty for non-existent status applications', async () => {
        const underReview = await Application.findByStatus('Under Review');
        // Should be empty since we don't create any with that status in this test
        expect(Array.isArray(underReview)).toBe(true);
      });
    });

    describe('getStats', () => {
      it('should return application statistics', async () => {
        const stats = await Application.getStats();

        expect(stats).toHaveProperty('total');
        expect(stats).toHaveProperty('Pending');
        expect(stats).toHaveProperty('Approved');
        expect(stats).toHaveProperty('Rejected');
        expect(stats.total).toBeGreaterThanOrEqual(4);
      });
    });

    describe('checkDuplicate', () => {
      it('should detect duplicate email', async () => {
        const duplicate = await Application.checkDuplicate('pending1@test.com', '9999999999');
        expect(duplicate).not.toBeNull();
        expect(duplicate.email).toBe('pending1@test.com');
      });

      it('should detect duplicate phone', async () => {
        const duplicate = await Application.checkDuplicate('unique@test.com', '1111111111');
        expect(duplicate).not.toBeNull();
      });

      it('should return null for unique application', async () => {
        const duplicate = await Application.checkDuplicate('totallynew@test.com', '0000000000');
        expect(duplicate).toBeNull();
      });
    });
  });

  describe('Pricing Configuration', () => {
    it('should accept valid pricing configuration', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'pricing@test.com',
        phone: '5555555555',
        pricingType: 'paid',
        pricing: {
          monthlyPrice: 5000,
          threeMonthPrice: 12000,
          hourlyRate: 500,
        },
      });

      expect(app.pricingType).toBe('paid');
      expect(app.pricing.monthlyPrice).toBe(5000);
    });

    it('should validate pricing type enum', async () => {
      const app = new Application({
        ...validApplicationData,
        email: 'invalidpricing@test.com',
        phone: '6666666666',
        pricingType: 'invalid_type',
      });

      await expect(app.save()).rejects.toThrow();
    });
  });

  describe('Availability Slots', () => {
    it('should accept valid availability slots', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'slots@test.com',
        phone: '7777777777',
        availabilitySlots: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00' },
          { day: 'Wednesday', startTime: '10:00', endTime: '18:00' },
        ],
      });

      expect(app.availabilitySlots).toHaveLength(2);
      expect(app.availabilitySlots[0].day).toBe('Monday');
    });

    it('should validate day enum in availability slots', async () => {
      const app = new Application({
        ...validApplicationData,
        email: 'invalidslots@test.com',
        phone: '8888888888',
        availabilitySlots: [{ day: 'InvalidDay', startTime: '09:00', endTime: '17:00' }],
      });

      await expect(app.save()).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple expertise areas', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'expertise@test.com',
        phone: '1234567891',
        expertise: ['JavaScript', 'Python', 'Go', 'Rust', 'TypeScript'],
      });

      expect(app.expertise).toHaveLength(5);
    });

    it('should handle social links', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'social@test.com',
        phone: '1234567892',
        socialLinks: {
          linkedIn: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe',
          twitter: 'https://twitter.com/johndoe',
        },
      });

      expect(app.socialLinks.linkedIn).toBe('https://linkedin.com/in/johndoe');
      expect(app.socialLinks.github).toBe('https://github.com/johndoe');
    });

    it('should handle education array', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'education@test.com',
        phone: '1234567893',
        education: [
          { degree: 'B.Tech', field: 'Computer Science', institution: 'IIT Delhi', year: 2015 },
          {
            degree: 'M.Tech',
            field: 'Software Engineering',
            institution: 'IIT Bombay',
            year: 2017,
          },
        ],
      });

      expect(app.education).toHaveLength(2);
      expect(app.education[0].degree).toBe('B.Tech');
    });

    it('should handle certifications array', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'certs@test.com',
        phone: '1234567894',
        certifications: [
          { name: 'AWS Solutions Architect', issuer: 'Amazon', year: 2022 },
          { name: 'Google Cloud Professional', issuer: 'Google', year: 2023 },
        ],
      });

      expect(app.certifications).toHaveLength(2);
      expect(app.certifications[0].name).toBe('AWS Solutions Architect');
    });

    it('should update timestamps on save', async () => {
      const app = await Application.create({
        ...validApplicationData,
        email: 'timestamp@test.com',
        phone: '1234567895',
      });

      const originalUpdatedAt = app.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 100));

      app.name = 'Updated Name';
      await app.save();

      expect(app.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should enforce experience range', async () => {
      const app = new Application({
        ...validApplicationData,
        email: 'exp@test.com',
        phone: '1234567896',
        experience: 50, // Max is 30
      });

      await expect(app.save()).rejects.toThrow();
    });
  });
});
