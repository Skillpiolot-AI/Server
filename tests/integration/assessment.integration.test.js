// tests/integration/assessment.integration.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Assessment = require('../../models/Assessment');
const Career = require('../../models/Career');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock assessment routes for testing
app.post('/api/assessments', async (req, res) => {
    try {
        const { userId, answers } = req.body;

        if (!answers || Object.keys(answers).length === 0) {
            return res.status(400).json({ error: 'Answers are required' });
        }

        // Calculate RIASEC scores
        const domainScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        Object.entries(answers).forEach(([questionId, value]) => {
            const domain = questionId.charAt(0);
            if (domainScores.hasOwnProperty(domain)) {
                domainScores[domain] += value;
            }
        });

        const total = Object.values(domainScores).reduce((a, b) => a + b, 0);
        const percentages = {};
        Object.keys(domainScores).forEach(domain => {
            percentages[domain] = total > 0 ? Math.round((domainScores[domain] / total) * 100) : 0;
        });

        const sorted = Object.entries(percentages)
            .sort((a, b) => b[1] - a[1])
            .map(([domain]) => domain);

        const hollandCode = sorted.slice(0, 3).join('');

        const assessment = await Assessment.create({
            userId,
            answers,
            results: {
                domainScores,
                percentages,
                hollandCode,
                topThreeDomains: sorted.slice(0, 3),
                recommendedCareers: []
            }
        });

        res.status(201).json({
            success: true,
            data: assessment,
            message: 'Assessment completed successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/assessments/:id', async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }
        res.json({ success: true, data: assessment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/assessments/user/:userId', async (req, res) => {
    try {
        const assessments = await Assessment.find({ userId: req.params.userId })
            .sort({ completedAt: -1 });
        res.json({ success: true, count: assessments.length, data: assessments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

describe('Assessment Integration Tests', () => {
    describe('POST /api/assessments', () => {
        it('should create a new assessment successfully', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'test-user-123',
                    answers: {
                        R1: 5, R2: 4, R3: 3,
                        I1: 4, I2: 5, I3: 4,
                        A1: 2, A2: 3, A3: 2,
                        S1: 3, S2: 4, S3: 3,
                        E1: 1, E2: 2, E3: 1,
                        C1: 2, C2: 2, C3: 3
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('userId', 'test-user-123');
            expect(response.body.data.results).toHaveProperty('hollandCode');
            expect(response.body.data.results.hollandCode).toHaveLength(3);
        });

        it('should calculate Holland code correctly', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'holland-test',
                    answers: {
                        R1: 10, R2: 10, R3: 10, // R = 30 (highest)
                        I1: 8, I2: 8, I3: 8,    // I = 24 (second)
                        A1: 5, A2: 5, A3: 5,    // A = 15 (third)
                        S1: 2, S2: 2, S3: 2,    // S = 6
                        E1: 1, E2: 1, E3: 1,    // E = 3
                        C1: 1, C2: 1, C3: 1     // C = 3
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.data.results.hollandCode).toBe('RIA');
            expect(response.body.data.results.topThreeDomains).toEqual(['R', 'I', 'A']);
        });

        it('should reject assessment without answers', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'test-user',
                    answers: {}
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Answers are required');
        });

        it('should reject assessment without answers field', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'test-user'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Answers are required');
        });

        it('should handle partial domain answers', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'partial-test',
                    answers: {
                        R1: 5, // Only R domain
                        I1: 3
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.data.results.domainScores.R).toBe(5);
            expect(response.body.data.results.domainScores.I).toBe(3);
            expect(response.body.data.results.domainScores.A).toBe(0);
        });

        it('should calculate percentages correctly', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'percentage-test',
                    answers: {
                        R1: 50,
                        I1: 50
                        // Total = 100, R = 50%, I = 50%
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.data.results.percentages.R).toBe(50);
            expect(response.body.data.results.percentages.I).toBe(50);
        });
    });

    describe('GET /api/assessments/:id', () => {
        let testAssessmentId;

        beforeEach(async () => {
            const assessment = await Assessment.create({
                userId: 'get-test-user',
                answers: new Map([['R1', 5]]),
                results: {
                    domainScores: { R: 5, I: 0, A: 0, S: 0, E: 0, C: 0 },
                    hollandCode: 'R',
                    topThreeDomains: ['R']
                }
            });
            testAssessmentId = assessment._id;
        });

        it('should get assessment by id', async () => {
            const response = await request(app)
                .get(`/api/assessments/${testAssessmentId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data._id.toString()).toBe(testAssessmentId.toString());
        });

        it('should return 404 for non-existent assessment', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/assessments/${fakeId}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Assessment not found');
        });

        it('should return 500 for invalid id format', async () => {
            const response = await request(app)
                .get('/api/assessments/invalid-id');

            expect(response.status).toBe(500);
        });
    });

    describe('GET /api/assessments/user/:userId', () => {
        beforeEach(async () => {
            // Create multiple assessments for the same user
            await Assessment.create([
                {
                    userId: 'multi-assessment-user',
                    answers: new Map([['R1', 5]]),
                    results: { hollandCode: 'RIA' }
                },
                {
                    userId: 'multi-assessment-user',
                    answers: new Map([['R1', 4]]),
                    results: { hollandCode: 'RIS' }
                },
                {
                    userId: 'other-user',
                    answers: new Map([['R1', 3]]),
                    results: { hollandCode: 'SIA' }
                }
            ]);
        });

        it('should get all assessments for a user', async () => {
            const response = await request(app)
                .get('/api/assessments/user/multi-assessment-user');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.data).toHaveLength(2);
        });

        it('should return empty array for user with no assessments', async () => {
            const response = await request(app)
                .get('/api/assessments/user/new-user');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(0);
            expect(response.body.data).toEqual([]);
        });

        it('should sort assessments by completedAt descending', async () => {
            const response = await request(app)
                .get('/api/assessments/user/multi-assessment-user');

            expect(response.status).toBe(200);

            if (response.body.data.length > 1) {
                const first = new Date(response.body.data[0].completedAt);
                const second = new Date(response.body.data[1].completedAt);
                expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
            }
        });
    });

    describe('Assessment Scoring Edge Cases', () => {
        it('should handle all answers being zero', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'zero-test',
                    answers: {
                        R1: 0, I1: 0, A1: 0, S1: 0, E1: 0, C1: 0
                    }
                });

            expect(response.status).toBe(201);
            // All percentages should be 0 when total is 0
        });

        it('should handle very high answer values', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'high-value-test',
                    answers: {
                        R1: 100, R2: 100, R3: 100,
                        I1: 50, I2: 50
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.data.results.domainScores.R).toBe(300);
        });

        it('should handle negative answer values', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'negative-test',
                    answers: {
                        R1: -5, I1: 10
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.data.results.domainScores.R).toBe(-5);
        });

        it('should ignore answers with invalid domain prefix', async () => {
            const response = await request(app)
                .post('/api/assessments')
                .send({
                    userId: 'invalid-prefix-test',
                    answers: {
                        R1: 5,
                        X1: 10, // Invalid domain prefix
                        Z2: 20  // Invalid domain prefix
                    }
                });

            expect(response.status).toBe(201);
            expect(response.body.data.results.domainScores.R).toBe(5);
            // X and Z should not affect scores
        });
    });
});
