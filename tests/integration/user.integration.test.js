// tests/integration/user.integration.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock user routes for testing
app.get('/api/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    // Handle edge case: ensure page is at least 1
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.max(1, parseInt(limit) || 10);

    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password -passwordHistory')
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        currentPage: safePage,
        perPage: safeLimit,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

describe('User Integration Tests', () => {
  describe('GET /api/users', () => {
    beforeEach(async () => {
      await User.create([
        {
          username: 'user1',
          name: 'User One',
          email: 'user1@test.com',
          password: await bcrypt.hash('password123', 10),
          role: 'User',
          isActive: true,
          isVerified: true,
        },
        {
          username: 'admin1',
          name: 'Admin One',
          email: 'admin1@test.com',
          password: await bcrypt.hash('password123', 10),
          role: 'Admin',
          isActive: true,
          isVerified: true,
        },
        {
          username: 'mentor1',
          name: 'Mentor One',
          email: 'mentor1@test.com',
          password: await bcrypt.hash('password123', 10),
          role: 'Mentor',
          isActive: false,
          isVerified: true,
        },
      ]);
    });

    it('should get all users with pagination', async () => {
      const response = await request(app).get('/api/users').query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter users by role', async () => {
      const response = await request(app).get('/api/users').query({ role: 'Admin' });

      expect(response.status).toBe(200);
      response.body.users.forEach(user => {
        expect(user.role).toBe('Admin');
      });
    });

    it('should search users by name', async () => {
      const response = await request(app).get('/api/users').query({ search: 'User One' });

      expect(response.status).toBe(200);
      expect(response.body.users.some(u => u.name === 'User One')).toBe(true);
    });

    it('should search users by email', async () => {
      const response = await request(app).get('/api/users').query({ search: 'mentor1@test.com' });

      expect(response.status).toBe(200);
      expect(response.body.users.some(u => u.email === 'mentor1@test.com')).toBe(true);
    });

    it('should not include password in response', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      response.body.users.forEach(user => {
        expect(user.password).toBeUndefined();
        expect(user.passwordHistory).toBeUndefined();
      });
    });

    it('should paginate correctly', async () => {
      const response = await request(app).get('/api/users').query({ page: 1, limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.perPage).toBe(1);
    });
  });

  describe('GET /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      const user = await User.create({
        username: 'gettest',
        name: 'Get Test User',
        email: 'gettest@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
      });
      testUserId = user._id;
    });

    it('should get user by id', async () => {
      const response = await request(app).get(`/api/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('gettest');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/users/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 500 for invalid id format', async () => {
      const response = await request(app).get('/api/users/invalid-id');

      expect(response.status).toBe(500);
    });

    it('should not include password in response', async () => {
      const response = await request(app).get(`/api/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('PUT /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      const user = await User.create({
        username: 'updatetest',
        name: 'Update Test User',
        email: 'updatetest@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
      });
      testUserId = user._id;
    });

    it('should update user name', async () => {
      const response = await request(app)
        .put(`/api/users/${testUserId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.name).toBe('Updated Name');
    });

    it('should update multiple fields', async () => {
      const response = await request(app).put(`/api/users/${testUserId}`).send({
        name: 'New Name',
        newsletter: true,
      });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('New Name');
    });

    it('should not update password through this endpoint', async () => {
      const response = await request(app).put(`/api/users/${testUserId}`).send({
        name: 'Name Change',
        password: 'newpassword123',
      });

      expect(response.status).toBe(200);

      // Verify password was not changed
      const user = await User.findById(testUserId);
      const isOriginalPassword = await bcrypt.compare('password123', user.password);
      expect(isOriginalPassword).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).put(`/api/users/${fakeId}`).send({ name: 'New Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUserId;

    beforeEach(async () => {
      const user = await User.create({
        username: 'deletetest',
        name: 'Delete Test User',
        email: 'deletetest@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
      });
      testUserId = user._id;
    });

    it('should delete user successfully', async () => {
      const response = await request(app).delete(`/api/users/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(testUserId);
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/users/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    let testUserId;

    beforeEach(async () => {
      const user = await User.create({
        username: 'statustest',
        name: 'Status Test User',
        email: 'statustest@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
        isActive: true,
      });
      testUserId = user._id;
    });

    it('should deactivate user', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserId}/status`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.isActive).toBe(false);
      expect(response.body.message).toBe('User deactivated successfully');
    });

    it('should activate user', async () => {
      // First deactivate
      await User.findByIdAndUpdate(testUserId, { isActive: false });

      const response = await request(app)
        .patch(`/api/users/${testUserId}/status`)
        .send({ isActive: true });

      expect(response.status).toBe(200);
      expect(response.body.user.isActive).toBe(true);
      expect(response.body.message).toBe('User activated successfully');
    });

    it('should return 400 for non-boolean isActive', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserId}/status`)
        .send({ isActive: 'true' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('isActive must be a boolean');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/users/${fakeId}/status`)
        .send({ isActive: false });

      expect(response.status).toBe(404);
    });
  });

  describe('User Data Validation', () => {
    it('should handle special characters in search', async () => {
      const response = await request(app).get('/api/users').query({ search: 'test@email.com' });

      expect(response.status).toBe(200);
    });

    it('should handle empty search query', async () => {
      const response = await request(app).get('/api/users').query({ search: '' });

      expect(response.status).toBe(200);
    });

    it('should handle pagination edge case - page 0 (defaults to 1)', async () => {
      const response = await request(app).get('/api/users').query({ page: 0, limit: 10 });

      // Now handles gracefully - defaults to page 1
      expect(response.status).toBe(200);
      expect(response.body.pagination.currentPage).toBe(1);
    });

    it('should handle negative page number (defaults to 1)', async () => {
      const response = await request(app).get('/api/users').query({ page: -1, limit: 10 });

      // Now handles gracefully - defaults to page 1
      expect(response.status).toBe(200);
      expect(response.body.pagination.currentPage).toBe(1);
    });
  });

  describe('Concurrent Operations', () => {
    let testUserId;

    beforeEach(async () => {
      const user = await User.create({
        username: 'concurrent',
        name: 'Concurrent Test',
        email: 'concurrent@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
      });
      testUserId = user._id;
    });

    it('should handle concurrent updates', async () => {
      const updates = [
        request(app).put(`/api/users/${testUserId}`).send({ name: 'Name 1' }),
        request(app).put(`/api/users/${testUserId}`).send({ name: 'Name 2' }),
        request(app).put(`/api/users/${testUserId}`).send({ name: 'Name 3' }),
      ];

      const results = await Promise.all(updates);

      results.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle concurrent read and write', async () => {
      const operations = [
        request(app).get(`/api/users/${testUserId}`),
        request(app).put(`/api/users/${testUserId}`).send({ name: 'Updated' }),
        request(app).get(`/api/users/${testUserId}`),
      ];

      const results = await Promise.all(operations);

      results.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
