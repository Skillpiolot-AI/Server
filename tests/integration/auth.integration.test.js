// tests/integration/auth.integration.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../../routes/authRoutes');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Integration Tests', () => {
  // NOTE: Signup tests removed to avoid sending verification emails
  // These tests were triggering real email sends which hit service limits

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a verified test user directly in DB (no email sent)
      await User.create({
        username: 'loginuser',
        name: 'Login User',
        email: 'login@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'User',
        isVerified: true,
        isActive: true,
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'login@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'login@example.com',
        password: 'WrongPassword!',
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    });

    it('should not login unverified user', async () => {
      await User.create({
        username: 'unverified',
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'User',
        isVerified: false,
        isActive: false,
      });

      const response = await request(app).post('/api/auth/login').send({
        username: 'unverified@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  // NOTE: Forgot-password tests removed to avoid sending OTP emails
  // These tests were triggering real email sends which hit service limits
});
