const User = require('../../models/User');
const mongoose = require('mongoose');

describe('User Model', () => {
  it('should create a valid user', async () => {
    const userData = {
      username: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'User'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe(userData.role);
  });

  it('should require username', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'User'
    };

    const user = new User(userData);
    
    await expect(user.save()).rejects.toThrow('User validation failed');
  });

  it('should not allow duplicate usernames', async () => {
    const userData1 = {
      username: 'testuser',
      name: 'Test User 1',
      email: 'test1@example.com',
      password: 'hashedpassword',
      role: 'User'
    };

    const userData2 = {
      username: 'testuser',
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'hashedpassword',
      role: 'User'
    };

    await User.create(userData1);
    await expect(User.create(userData2)).rejects.toThrow();
  });
});