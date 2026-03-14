/**
 * Skill Controller Tests
 * Tests for skill tracking, proficiency levels, and endorsements
 * Focus: Skill management and skill-to-career mapping
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../index');
const Skill = require('../../../models/Skill');
const User = require('../../../models/User');
const { cleanDatabase, createTestUser, getValidJWT } = require('../../helpers/testHelpers');

describe('Skill Controller', () => {
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
  // SKILL RETRIEVAL TESTS
  // =========================================================================
  describe('Get Skills', () => {
    beforeEach(async () => {
      await Skill.create([
        { name: 'JavaScript', category: 'Programming', difficulty: 'Intermediate' },
        { name: 'Python', category: 'Programming', difficulty: 'Beginner' },
        { name: 'Leadership', category: 'Soft Skills', difficulty: 'Advanced' },
      ]);
    });

    test('should retrieve all skills', async () => {
      const response = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.skills.length).toBeGreaterThan(0);
    });

    test('should filter skills by category', async () => {
      const response = await request(app)
        .get('/api/skills?category=Programming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.skills.forEach(skill => {
        expect(skill.category).toBe('Programming');
      });
    });

    test('should get single skill by ID', async () => {
      const skills = await Skill.find();
      const response = await request(app)
        .get(`/api/skills/${skills[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.skill._id.toString()).toBe(skills[0]._id.toString());
    });
  });

  // =========================================================================
  // SKILL PROFICIENCY TESTS
  // =========================================================================
  describe('Skill Proficiency Tracking', () => {
    let skill;

    beforeEach(async () => {
      skill = await Skill.create({
        name: 'React',
        category: 'Programming',
        difficulty: 'Intermediate',
      });
    });

    test('should add skill to user profile with proficiency level', async () => {
      const response = await request(app)
        .post('/api/users/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skillId: skill._id,
          proficiency: 'Intermediate',
          yearsOfExperience: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.skills.length).toBeGreaterThan(0);
    });

    test('should update skill proficiency level', async () => {
      await request(app)
        .post('/api/users/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skillId: skill._id,
          proficiency: 'Beginner',
          yearsOfExperience: 1,
        });

      const response = await request(app)
        .put(`/api/users/skills/${skill._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ proficiency: 'Advanced' });

      expect(response.status).toBe(200);
      expect(response.body.user.skills[0].proficiency).toBe('Advanced');
    });

    test('should track years of experience', async () => {
      const response = await request(app)
        .post('/api/users/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skillId: skill._id,
          proficiency: 'Advanced',
          yearsOfExperience: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.skills[0].yearsOfExperience).toBe(5);
    });
  });

  // =========================================================================
  // SKILL ENDORSEMENT TESTS
  // =========================================================================
  describe('Skill Endorsements', () => {
    let user1;
    let user2;
    let skill;

    beforeEach(async () => {
      user1 = await createTestUser({ name: 'User One' });
      user2 = await createTestUser({ name: 'User Two' });
      skill = await Skill.create({ name: 'Communication', category: 'Soft Skills' });

      // Add skill to user1
      user1.skills = [{ skillId: skill._id, proficiency: 'Intermediate', endorsements: [] }];
      await user1.save();
    });

    test('should endorse skill for another user', async () => {
      const user2Token = getValidJWT(user2._id, 'User');

      const response = await request(app)
        .post(`/api/users/${user1._id}/skills/${skill._id}/endorse`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.endorsements).toBeGreaterThan(0);
    });

    test('should not allow self-endorsement', async () => {
      const response = await request(app)
        .post(`/api/users/${user1._id}/skills/${skill._id}/endorse`)
        .set('Authorization', `Bearer ${getValidJWT(user1._id, 'User')}`);

      expect(response.status).toBe(400);
    });

    test('should prevent duplicate endorsement from same user', async () => {
      const user2Token = getValidJWT(user2._id, 'User');

      await request(app)
        .post(`/api/users/${user1._id}/skills/${skill._id}/endorse`)
        .set('Authorization', `Bearer ${user2Token}`);

      const response = await request(app)
        .post(`/api/users/${user1._id}/skills/${skill._id}/endorse`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // SKILL DIFFICULTY TESTS
  // =========================================================================
  describe('Skill Difficulty Levels', () => {
    beforeEach(async () => {
      await Skill.create([
        { name: 'HTML', difficulty: 'Beginner', estimatedLearningHours: 20 },
        { name: 'Advanced Python', difficulty: 'Advanced', estimatedLearningHours: 200 },
      ]);
    });

    test('should return skills by difficulty level', async () => {
      const response = await request(app)
        .get('/api/skills?difficulty=Beginner')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.skills.forEach(skill => {
        expect(skill.difficulty).toBe('Beginner');
      });
    });

    test('should show estimated learning hours for skill', async () => {
      const response = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.skills[0].estimatedLearningHours).toBeDefined();
    });

    test('should correlate difficulty with learning hours', async () => {
      const response = await request(app)
        .get('/api/skills')
        .set('Authorization', `Bearer ${authToken}`);

      const beginnerSkills = response.body.skills.filter(s => s.difficulty === 'Beginner');
      const advancedSkills = response.body.skills.filter(s => s.difficulty === 'Advanced');

      if (beginnerSkills.length > 0 && advancedSkills.length > 0) {
        expect(beginnerSkills[0].estimatedLearningHours).toBeLessThan(
          advancedSkills[0].estimatedLearningHours
        );
      }
    });
  });

  // =========================================================================
  // SKILL REMOVAL TESTS
  // =========================================================================
  describe('Remove Skill', () => {
    let skill;

    beforeEach(async () => {
      skill = await Skill.create({ name: 'Old Skill', category: 'Legacy', difficulty: 'Beginner' });

      testUser.skills = [
        {
          skillId: skill._id,
          proficiency: 'Intermediate',
          endorsements: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
          addedAt: new Date(),
        },
      ];
      await testUser.save();
    });

    test('should remove skill from user profile', async () => {
      const response = await request(app)
        .delete(`/api/users/skills/${skill._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.skills.length).toBe(0);
    });

    test('should return 404 if skill not in user profile', async () => {
      const otherSkill = await Skill.create({ name: 'Other Skill', category: 'Other' });

      const response = await request(app)
        .delete(`/api/users/skills/${otherSkill._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // SKILL SEARCH & DISCOVERY TESTS
  // =========================================================================
  describe('Skill Search & Discovery', () => {
    beforeEach(async () => {
      await Skill.create([
        {
          name: 'Web Development',
          category: 'Programming',
          relatedCareers: ['Frontend Engineer', 'Full Stack Developer'],
        },
        { name: 'UI Design', category: 'Design', relatedCareers: ['UX Designer', 'UI Designer'] },
      ]);
    });

    test('should search skills by name', async () => {
      const response = await request(app)
        .get('/api/skills?search=Web')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.skills.some(s => s.name.includes('Web'))).toBe(true);
    });

    test('should return related careers for skill', async () => {
      const skills = await Skill.find({ name: 'Web Development' });
      const response = await request(app)
        .get(`/api/skills/${skills[0]._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.skill.relatedCareers).toBeDefined();
    });

    test('should recommend learning path for skill', async () => {
      const response = await request(app)
        .get('/api/skills/learning-path')
        .query({ skill: 'Web Development' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.path).toBeDefined();
    });
  });
});
