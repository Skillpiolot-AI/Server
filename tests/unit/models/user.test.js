// tests/unit/models/user.test.js
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model Tests', () => {
  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('User');
    });

    it('should not create user without required fields', async () => {
      const user = new User({});

      await expect(user.save()).rejects.toThrow();
    });

    it('should not create user with duplicate email', async () => {
      const userData = {
        username: 'user1',
        name: 'User One',
        email: 'duplicate@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User'
      };

      await User.create(userData);

      const duplicateUser = new User({
        ...userData,
        username: 'user2'
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('User Virtuals', () => {
    it('should correctly identify locked accounts', async () => {
      const user = await User.create({
        username: 'lockeduser',
        name: 'Locked User',
        email: 'locked@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
        lockUntil: new Date(Date.now() + 1000000)
      });

      expect(user.isLocked).toBe(true);
    });

    it('should correctly identify active suspensions', async () => {
      const user = await User.create({
        username: 'suspendeduser',
        name: 'Suspended User',
        email: 'suspended@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
        isSuspended: true,
        suspensionDetails: {
          until: new Date(Date.now() + 1000000),
          reason: 'Test suspension'
        }
      });

      expect(user.isSuspensionActive).toBe(true);
    });
  });

  describe('User Methods', () => {
    it('should increment login attempts', async () => {
      const user = await User.create({
        username: 'attemptuser',
        name: 'Attempt User',
        email: 'attempt@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User'
      });

      await user.incLoginAttempts();
      const updatedUser = await User.findById(user._id);

      expect(updatedUser.loginAttempts).toBe(1);
    });

    it('should reset login attempts', async () => {
      const user = await User.create({
        username: 'resetuser',
        name: 'Reset User',
        email: 'reset@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'User',
        loginAttempts: 5
      });

      await user.resetLoginAttempts();
      const updatedUser = await User.findById(user._id);

      expect(updatedUser.loginAttempts).toBeUndefined();
    });

    it('should change password correctly', async () => {
      const user = await User.create({
        username: 'passworduser',
        name: 'Password User',
        email: 'password@example.com',
        password: await bcrypt.hash('oldpassword', 10),
        role: 'User'
      });

      const newHashedPassword = await bcrypt.hash('newpassword', 10);
      await user.changePassword(newHashedPassword);

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.mustChangePassword).toBe(false);
      expect(updatedUser.temporaryPassword).toBe(false);
      expect(updatedUser.passwordHistory.length).toBe(1);
    });
  });
});
