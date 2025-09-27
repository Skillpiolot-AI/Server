const request = require('supertest');
const app = require('../../app'); 
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('Auth Controller', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        newsletter: false,
        subscription: false
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('role');
      
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.username).toBe(userData.username);
    });

    it('should not create user with mismatched passwords', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
        newsletter: false,
        subscription: false
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Passwords do not match');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'User'
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('role');
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid username or password');
    });
  });
});