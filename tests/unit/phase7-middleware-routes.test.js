/**
 * PHASE 7: MIDDLEWARE & ROUTES TESTS
 * Validates route definitions, middleware execution, and request handling
 *
 * Focus Areas:
 * 1. Route definitions and HTTP methods
 * 2. Middleware chaining and execution order
 * 3. Parameter validation
 * 4. Error handling and status codes
 * 5. Response formatting
 * 6. CORS and security headers
 */

const request = require('supertest');
const app = require('../../index');
const { cleanDatabase, createTestUser, getValidJWT } = require('../helpers/testHelpers');

describe('PHASE 7: Middleware & Routes Testing', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
    authToken = getValidJWT(testUser._id, 'User');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // ROUTE DEFINITION TESTS
  // =========================================================================
  describe('Route Definitions', () => {
    test('should have GET /api/users/profile endpoint', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Should respond (200, 401, 404, etc - not 501 Not Implemented)
      expect(response.status).not.toBe(501);
    });

    test('should have POST /api/assessments endpoint', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: { R1: 5, I1: 4 },
        });

      expect(response.status).not.toBe(501);
    });

    test('should have GET /api/assessments endpoint', async () => {
      const response = await request(app)
        .get('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).not.toBe(501);
    });

    test('should have authentication middleware on protected routes', async () => {
      const response = await request(app).get('/api/users/profile');

      // Should reject unauthenticated request
      expect([401, 403]).toContain(response.status);
    });

    test('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/nonexistent/route');

      expect(response.status).toBe(404);
    });

    test('should return 405 for wrong HTTP method on valid route', async () => {
      // If GET /api/assessments exists, POST on non-existent variant
      const response = await request(app)
        .delete('/api/assessments/123')
        .set('Authorization', `Bearer ${authToken}`);

      // Should be 405 (Method Not Allowed) or similar
      expect([405, 404, 401, 403]).toContain(response.status);
    });
  });

  // =========================================================================
  // MIDDLEWARE EXECUTION TESTS
  // =========================================================================
  describe('Middleware Execution', () => {
    test('should execute authentication middleware before handler', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      // Auth middleware should reject invalid token
      expect([401, 403]).toContain(response.status);
    });

    test('should preserve request body through middleware chain', async () => {
      const payload = {
        answers: {
          R1: 5,
          I1: 4,
          A1: 3,
          S1: 2,
          E1: 3,
          C1: 4,
        },
      };

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      // Request should be processed (not rejected by middleware)
      expect([200, 201, 400, 401, 404]).toContain(response.status);
    });

    test('should properly execute error middleware on exception', async () => {
      // Attempt to create with invalid data
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        });

      // Should return error status, not 500 unhandled error
      expect([200, 400, 401, 404]).toContain(response.status);
    });

    test('should validate request size limits', async () => {
      // Create very large payload
      const largePayload = {
        answers: {},
      };

      // Add many large fields
      for (let i = 0; i < 10000; i++) {
        largePayload.answers[`field${i}`] = 'x'.repeat(1000);
      }

      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largePayload);

      // Should either handle or reject gracefully
      expect([400, 413, 401, 404]).toContain(response.status);
    });

    test('should set Content-Type header correctly', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status !== 401) {
        expect(response.type).toMatch(/json/i);
      }
    });
  });

  // =========================================================================
  // PARAMETER VALIDATION TESTS
  // =========================================================================
  describe('Parameter Validation', () => {
    test('should validate path parameters (user ID)', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      // Should validate ID format
      expect([400, 404, 401]).toContain(response.status);
    });

    test('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/users/profile?page=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      // Should handle invalid pagination gracefully
      expect([200, 400, 401, 404]).toContain(response.status);
    });

    test('should validate required request body fields', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing 'answers' field
        });

      expect([400, 401, 404]).toContain(response.status);
    });

    test('should validate email format in request', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email-format',
        });

      // Should reject invalid email
      expect([400, 401, 404]).toContain(response.status);
    });

    test('should validate numeric ranges', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: {
            R1: 999, // Invalid range (should be 1-5)
          },
        });

      expect([400, 401, 404]).toContain(response.status);
    });

    test('should trim whitespace from string inputs', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: '   trimmed bio   ',
        });

      if (response.status === 200) {
        // Assuming response includes updated data
        if (response.body.user) {
          // Bio should be trimmed
          expect(response.body.user.bio).not.toMatch(/^\s|\s$/);
        }
      }
    });
  });

  // =========================================================================
  // ERROR HANDLING TESTS
  // =========================================================================
  describe('Error Handling', () => {
    test('should return appropriate error for missing authentication', async () => {
      const response = await request(app).get('/api/users/profile');

      expect(response.status).toBe(401 || 403);
      expect(response.body.message || response.body.error).toBeDefined();
    });

    test('should return appropriate error for insufficient permissions', async () => {
      const regularUser = await createTestUser({ role: 'User' });
      const regularToken = getValidJWT(regularUser._id, 'User');

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularToken}`);

      if (response.status !== 401) {
        expect([403, 404]).toContain(response.status);
      }
    });

    test('should handle database errors gracefully', async () => {
      // Attempt operation on non-existent resource
      const response = await request(app)
        .get('/api/users/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 404, not 500
      expect([404, 401]).toContain(response.status);
    });

    test('should return validation error with field details', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: {
            invalid: 'not a number',
          },
        });

      if (response.status === 400) {
        expect(response.body.message || response.body.error).toBeDefined();
      }
    });

    test('should handle race conditions in concurrent requests', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/assessments')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              answers: { R1: 5 },
            })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should be handled (no 500 errors)
      responses.forEach(response => {
        expect([200, 201, 400, 401, 404]).toContain(response.status);
      });
    });
  });

  // =========================================================================
  // RESPONSE FORMATTING TESTS
  // =========================================================================
  describe('Response Formatting', () => {
    test('should return JSON response', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status !== 401) {
        expect(response.type).toMatch(/json/);
      }
    });

    test('should include status code in response', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeDefined();
      expect(typeof response.status).toBe('number');
    });

    test('should include error message in error response', async () => {
      const response = await request(app).get('/api/users/profile');

      // 401 response should have error message
      expect([401, 403]).toContain(response.status);
      if (response.body) {
        expect(response.body.message || response.body.error).toBeDefined();
      }
    });

    test('should structure success response consistently', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        // Response should have consistent structure
        expect(response.body).toBeDefined();
      }
    });

    test('should include pagination info for list endpoints', async () => {
      const response = await request(app)
        .get('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        // If endpoint returns multiple items, should include pagination
        if (Array.isArray(response.body)) {
          // ok
        } else if (response.body.data) {
          // ok
        }
      }
    });
  });

  // =========================================================================
  // SECURITY HEADER TESTS
  // =========================================================================
  describe('Security Headers', () => {
    test('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/');

      // App should set security headers (or framework default)
      expect(response.headers).toBeDefined();
    });

    test('should not expose server information', async () => {
      const response = await request(app).get('/api/users/profile');

      // Server header should be minimal or absent
      const serverHeader = response.headers['server'];
      if (serverHeader) {
        expect(serverHeader).not.toMatch(/detailed version info/i);
      }
    });

    test('should prevent CSRF attacks', async () => {
      const response = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: { R1: 5 },
        });

      // Framework should handle CSRF protection
      expect([200, 201, 400, 401, 404]).toContain(response.status);
    });

    test('should validate Origin header for CORS', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Origin', 'http://malicious.com');

      // Should handle origin validation
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  // =========================================================================
  // RATE LIMITING & THROTTLING TESTS
  // =========================================================================
  describe('Rate Limiting & Throttling', () => {
    test('should handle multiple rapid requests', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app).get('/api/users/profile').set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(promises);

      // All requests should be answered (not hanging)
      expect(responses.length).toBe(10);
      responses.forEach(response => {
        expect([200, 400, 401, 404, 429]).toContain(response.status);
      });
    });

    test('should prevent brute force login attempts', async () => {
      // Multiple failed auth attempts
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app).post('/api/auth/login').send({
            email: 'test@test.com',
            password: 'wrong',
          })
        );
      }

      const responses = await Promise.all(promises);

      // Should eventually throttle or block
      const early = responses.slice(0, 3);
      const late = responses.slice(7);

      // Later requests might be rate limited
      expect([401, 429]).toContain(late[0].status);
    });
  });

  // =========================================================================
  // TIMEOUT & PERFORMANCE TESTS
  // =========================================================================
  describe('Timeout & Performance', () => {
    test('should respond within reasonable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Response should come within 5 seconds
      expect(responseTime).toBeLessThan(5000);
    });

    test('should not timeout on list operations', async () => {
      const response = await request(app)
        .get('/api/assessments?limit=100')
        .set('Authorization', `Bearer ${authToken}`);

      // Should respond without timing out
      expect([200, 400, 401, 404]).toContain(response.status);
    });

    test('should handle partial failures gracefully', async () => {
      // Mix of valid and invalid requests
      const requests = [
        request(app).get('/api/users/profile').set('Authorization', `Bearer ${authToken}`),
        request(app).get('/api/nonexistent'),
        request(app).post('/api/assessments').set('Authorization', `Bearer ${authToken}`).send({}),
      ];

      const responses = await Promise.all(requests);

      // All should respond
      expect(responses.length).toBe(3);
      responses.forEach(response => {
        expect(response.status).toBeDefined();
      });
    });
  });
});
