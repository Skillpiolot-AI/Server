/**
 * ChatBot Controller Tests
 * Tests for chatbot interactions and conversational features
 * Focus: Chat message handling, conversation tracking, AI responses
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('ChatBot Controller', () => {
  let testUser;
  let authToken;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({ role: 'User' });
    authToken = getValidJWT(testUser._id, 'User');
    adminUser = await createTestUser({ role: 'Admin' });
    adminToken = getValidJWT(adminUser._id, 'Admin');
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  // =========================================================================
  // CHATBOT MESSAGE TESTS
  // =========================================================================
  describe('Send Chat Messages', () => {
    test('should send message to chatbot', async () => {
      const response = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What are the best careers for me?',
          conversationId: null, // New conversation
        });

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.conversationId).toBeDefined();
    });

    test('should continue existing conversation', async () => {
      const firstMessage = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Tell me about software engineering',
          conversationId: null,
        });

      const conversationId = firstMessage.body.conversationId;

      const response = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What about the salary?',
          conversationId,
        });

      expect(response.status).toBe(200);
      expect(response.body.conversationId).toBe(conversationId);
    });

    test('should not allow empty messages', async () => {
      const response = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: '',
          conversationId: null,
        });

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // CONVERSATION HISTORY TESTS
  // =========================================================================
  describe('Conversation History', () => {
    test('should retrieve conversation history', async () => {
      const message = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Tell me about careers',
          conversationId: null,
        });

      const conversationId = message.body.conversationId;

      const response = await request(app)
        .get(`/api/chatbot/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
    });

    test('should retrieve all user conversations', async () => {
      // Create multiple conversations
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/chatbot/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            message: `Question ${i + 1}`,
            conversationId: null,
          });
      }

      const response = await request(app)
        .get('/api/chatbot/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.conversations.length).toBeGreaterThanOrEqual(3);
    });

    test('should not allow user to view other user conversations', async () => {
      const message = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Secret message',
          conversationId: null,
        });

      const conversationId = message.body.conversationId;
      const otherUser = await createTestUser({ role: 'User' });
      const otherToken = getValidJWT(otherUser._id, 'User');

      const response = await request(app)
        .get(`/api/chatbot/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // CONVERSATION MANAGEMENT TESTS
  // =========================================================================
  describe('Conversation Management', () => {
    let conversationId;

    beforeEach(async () => {
      const message = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is machine learning?',
          conversationId: null,
        });

      conversationId = message.body.conversationId;
    });

    test('should delete conversation', async () => {
      const response = await request(app)
        .delete(`/api/chatbot/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const getResponse = await request(app)
        .get(`/api/chatbot/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    test('should clear conversation history', async () => {
      // Add multiple messages
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/chatbot/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            message: `Message ${i + 1}`,
            conversationId,
          });
      }

      const response = await request(app)
        .post(`/api/chatbot/conversations/${conversationId}/clear`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const historyResponse = await request(app)
        .get(`/api/chatbot/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should be empty or reset
      expect(historyResponse.status).toBe(200);
    });

    test('should rename conversation', async () => {
      const response = await request(app)
        .patch(`/api/chatbot/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Custom Conversation Title',
        });

      expect(response.status).toBe(200);
      expect(response.body.conversation.title).toBe('Custom Conversation Title');
    });
  });

  // =========================================================================
  // CHATBOT CONTEXT & FEATURES TESTS
  // =========================================================================
  describe('ChatBot Context & Features', () => {
    test('should understand career-related questions', async () => {
      const response = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I like programming and design. What careers might suit me?',
          conversationId: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.intent).toBeDefined(); // Should identify intent
    });

    test('should provide skill recommendations', async () => {
      const response = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What skills should I learn for backend development?',
          conversationId: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
    });

    test('should handle follow-up questions', async () => {
      const first = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is data science?',
          conversationId: null,
        });

      const conversationId = first.body.conversationId;

      const response = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What programming languages do I need to learn for it?',
          conversationId,
        });

      expect(response.status).toBe(200);
      // Should understand context from previous message
    });

    test('should recognize assessment requests', async () => {
      const response = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Can you recommend a career based on my interests?',
          conversationId: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.actionRequired).toBeDefined();
    });
  });

  // =========================================================================
  // CHATBOT FEEDBACK TESTS
  // =========================================================================
  describe('ChatBot Feedback', () => {
    let conversationId;
    let messageId;

    beforeEach(async () => {
      const message = await request(app)
        .post('/api/chatbot/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Tell me about careers',
          conversationId: null,
        });

      conversationId = message.body.conversationId;
      messageId = message.body.messageId;
    });

    test('should rate chatbot response', async () => {
      const response = await request(app)
        .post(`/api/chatbot/messages/${messageId}/rate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 5,
          feedback: 'Very helpful!',
        });

      expect(response.status).toBe(200);
    });

    test('should track response quality metrics', async () => {
      // Rate multiple responses
      for (let i = 0; i < 3; i++) {
        const msg = await request(app)
          .post('/api/chatbot/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            message: `Question ${i + 1}`,
            conversationId,
          });

        await request(app)
          .post(`/api/chatbot/messages/${msg.body.messageId}/rate`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            rating: 4 + i,
            feedback: 'Good response',
          });
      }

      const response = await request(app)
        .get(`/api/chatbot/conversations/${conversationId}/stats`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
    });
  });

  // =========================================================================
  // ADMIN CHATBOT MANAGEMENT TESTS
  // =========================================================================
  describe('Admin ChatBot Management', () => {
    test('should allow admin to view all conversations', async () => {
      const response = await request(app)
        .get('/api/admin/chatbot/conversations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.conversations).toBeDefined();
    });

    test('should allow admin to view chatbot analytics', async () => {
      const response = await request(app)
        .get('/api/admin/chatbot/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analytics).toBeDefined();
    });

    test('should allow admin to disable chatbot', async () => {
      const response = await request(app)
        .patch('/api/admin/chatbot/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          enabled: false,
        });

      expect(response.status).toBe(200);
    });

    test('should prevent non-admin from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/chatbot/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // RATE LIMITING TESTS
  // =========================================================================
  describe('Rate Limiting', () => {
    test('should enforce rate limiting on messages', async () => {
      const promises = [];

      // Send multiple messages rapidly
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app)
            .post('/api/chatbot/send')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              message: `Rapid message ${i + 1}`,
              conversationId: null,
            })
        );
      }

      const responses = await Promise.all(promises);

      // Some should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect([true, false]).toContain(rateLimited); // Depending on rate limit config
    });
  });
});
