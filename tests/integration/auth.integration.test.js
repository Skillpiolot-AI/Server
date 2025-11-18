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
  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'newuser',
          name: 'New User',
          email: 'newuser@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          newsletter: false,
          subscription: false
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should not register user with mismatched passwords', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'mismatch',
          name: 'Mismatch User',
          email: 'mismatch@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
          newsletter: false,
          subscription: false
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('do not match');
    });

    it('should not register duplicate email', async () => {
      const userData = {
        username: 'duplicate1',
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        newsletter: false,
        subscription: false
      };

      // First registration
      await request(app).post('/api/auth/signup').send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...userData,
          username: 'duplicate2'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a verified test user
      await User.create({
        username: 'loginuser',
        name: 'Login User',
        email: 'login@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'User',
        isVerified: true,
        isActive: true
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'login@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'login@example.com',
          password: 'WrongPassword!'
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
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'unverified@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(403);
      expect(response.body.errorCode).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        username: 'resetuser',
        name: 'Reset User',
        email: 'reset@example.com',
        password: await bcrypt.hash('Password123!', 10),
        role: 'User',
        isVerified: true,
        isActive: true
      });
    });

    it('should send OTP for password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('code sent');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
