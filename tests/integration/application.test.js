const request = require('supertest');
const app = require('../../app');
const Application = require('../../models/Application');

describe('Application Integration Tests', () => {
  describe('Application Workflow', () => {
    it('should handle complete application workflow', async () => {
      // Submit application
      const applicationData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        jobTitle: 'Software Engineer',
        companiesWorked: ['Company A', 'Company B'],
        experience: 5
      };

      const submitResponse = await request(app)
        .post('/api/submit-application')
        .send(applicationData)
        .expect(201);

      expect(submitResponse.body).toHaveProperty('trackingId');
      
      const trackingId = submitResponse.body.trackingId;

      // Track application
      const trackResponse = await request(app)
        .get(`/api/track/${trackingId}`)
        .expect(200);

      expect(trackResponse.body.trackingId).toBe(trackingId);
      expect(trackResponse.body.status).toBe('Pending');

      // Get all applications (admin view)
      const applicationsResponse = await request(app)
        .get('/api/applications')
        .expect(200);

      expect(Array.isArray(applicationsResponse.body)).toBe(true);
      expect(applicationsResponse.body.length).toBeGreaterThan(0);
    });
  });
});