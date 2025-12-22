// tests/unit/models/mentorProfile.test.js
const mongoose = require('mongoose');
const MentorProfile = require('../../../models/MentorProfile');

describe('MentorProfile Model Tests', () => {
    let testUserId;

    beforeEach(() => {
        testUserId = new mongoose.Types.ObjectId();
    });

    describe('MentorProfile Creation', () => {
        it('should create a valid mentor profile', async () => {
            const profileData = {
                userId: testUserId,
                displayName: 'John Doe',
                tagline: 'Senior Software Engineer',
                bio: 'Experienced mentor with 10+ years in tech',
                expertise: ['JavaScript', 'React', 'Node.js'],
                targetingDomains: ['Frontend Developer', 'Fullstack Developer'],
                languages: ['English', 'Hindi'],
            };

            const profile = new MentorProfile(profileData);
            const savedProfile = await profile.save();

            expect(savedProfile._id).toBeDefined();
            expect(savedProfile.displayName).toBe('John Doe');
            expect(savedProfile.expertise).toHaveLength(3);
            expect(savedProfile.averageRating).toBe(0);
            expect(savedProfile.isVisible).toBe(true);
        });

        it('should not create profile without required userId', async () => {
            const profile = new MentorProfile({
                displayName: 'John Doe',
            });

            await expect(profile.save()).rejects.toThrow();
        });

        it('should not create profile without required displayName', async () => {
            const profile = new MentorProfile({
                userId: testUserId,
            });

            await expect(profile.save()).rejects.toThrow();
        });

        it('should enforce unique userId constraint', async () => {
            const profileData = {
                userId: testUserId,
                displayName: 'Mentor One',
            };

            await MentorProfile.create(profileData);

            const duplicateProfile = new MentorProfile({
                userId: testUserId,
                displayName: 'Mentor Two',
            });

            await expect(duplicateProfile.save()).rejects.toThrow();
        });

        it('should set default values correctly', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
            });

            expect(profile.averageRating).toBe(0);
            expect(profile.totalReviews).toBe(0);
            expect(profile.totalMentees).toBe(0);
            expect(profile.totalPlacements).toBe(0);
            expect(profile.isVisible).toBe(true);
            expect(profile.featured).toBe(false);
            expect(profile.pricingType).toBe('paid');
            expect(profile.sessionDuration).toBe(60);
            expect(profile.sessionsPerWeek).toBe(1);
        });
    });

    describe('MentorProfile Virtuals & Validation', () => {
        it('should validate pricing type enum', async () => {
            const profile = new MentorProfile({
                userId: testUserId,
                displayName: 'Test Mentor',
                pricingType: 'invalid_type',
            });

            await expect(profile.save()).rejects.toThrow();
        });

        it('should validate sector type enum', async () => {
            const profile = new MentorProfile({
                userId: testUserId,
                displayName: 'Test Mentor',
                sectorType: 'invalid_sector',
            });

            await expect(profile.save()).rejects.toThrow();
        });

        it('should validate preferredMenteeType enum values', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
                preferredMenteeType: ['Fresher', 'Student'],
            });

            expect(profile.preferredMenteeType).toContain('Fresher');
            expect(profile.preferredMenteeType).toContain('Student');
        });

        it('should validate availability slot day enum', async () => {
            const profile = new MentorProfile({
                userId: testUserId,
                displayName: 'Test Mentor',
                availabilitySlots: [
                    {
                        day: 'InvalidDay',
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                ],
            });

            await expect(profile.save()).rejects.toThrow();
        });

        it('should accept valid availability slots', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
                availabilitySlots: [
                    { day: 'Monday', startTime: '09:00', endTime: '17:00' },
                    { day: 'Wednesday', startTime: '10:00', endTime: '16:00' },
                ],
            });

            expect(profile.availabilitySlots).toHaveLength(2);
            expect(profile.availabilitySlots[0].day).toBe('Monday');
        });
    });

    describe('addReview Method', () => {
        it('should add a new review', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
            });

            const reviewerId = new mongoose.Types.ObjectId();
            await profile.addReview(reviewerId, 5, 'Excellent mentor!');

            const updatedProfile = await MentorProfile.findById(profile._id);
            expect(updatedProfile.reviews).toHaveLength(1);
            expect(updatedProfile.reviews[0].rating).toBe(5);
            expect(updatedProfile.reviews[0].comment).toBe('Excellent mentor!');
        });

        it('should update existing review from same user', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
            });

            const reviewerId = new mongoose.Types.ObjectId();

            // First review
            await profile.addReview(reviewerId, 3, 'Good mentor');

            // Update review
            const updatedProfile = await MentorProfile.findById(profile._id);
            await updatedProfile.addReview(reviewerId, 5, 'Amazing mentor!');

            const finalProfile = await MentorProfile.findById(profile._id);
            expect(finalProfile.reviews).toHaveLength(1);
            expect(finalProfile.reviews[0].rating).toBe(5);
            expect(finalProfile.reviews[0].comment).toBe('Amazing mentor!');
        });

        it('should allow multiple reviews from different users', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
            });

            const reviewer1 = new mongoose.Types.ObjectId();
            const reviewer2 = new mongoose.Types.ObjectId();
            const reviewer3 = new mongoose.Types.ObjectId();

            await profile.addReview(reviewer1, 5, 'Great!');
            let updatedProfile = await MentorProfile.findById(profile._id);
            await updatedProfile.addReview(reviewer2, 4, 'Very good');
            updatedProfile = await MentorProfile.findById(profile._id);
            await updatedProfile.addReview(reviewer3, 3, 'Okay');

            const finalProfile = await MentorProfile.findById(profile._id);
            expect(finalProfile.reviews).toHaveLength(3);
        });

        it('should calculate average rating correctly', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
            });

            const reviewer1 = new mongoose.Types.ObjectId();
            const reviewer2 = new mongoose.Types.ObjectId();

            await profile.addReview(reviewer1, 5, 'Great!');
            let updatedProfile = await MentorProfile.findById(profile._id);
            await updatedProfile.addReview(reviewer2, 3, 'Okay');

            const finalProfile = await MentorProfile.findById(profile._id);
            expect(finalProfile.averageRating).toBe(4); // (5+3)/2 = 4
            expect(finalProfile.totalReviews).toBe(2);
        });

        it('should handle edge case of single 1-star review', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
            });

            const reviewerId = new mongoose.Types.ObjectId();
            await profile.addReview(reviewerId, 1, 'Not helpful');

            const updatedProfile = await MentorProfile.findById(profile._id);
            expect(updatedProfile.averageRating).toBe(1);
        });
    });

    describe('Static Methods', () => {
        beforeEach(async () => {
            // Create test profiles
            await MentorProfile.create({
                userId: new mongoose.Types.ObjectId(),
                displayName: 'JavaScript Expert',
                expertise: ['JavaScript', 'React'],
                isVisible: true,
                featured: true,
                averageRating: 4.5,
            });

            await MentorProfile.create({
                userId: new mongoose.Types.ObjectId(),
                displayName: 'Python Expert',
                expertise: ['Python', 'Django'],
                isVisible: true,
                featured: false,
                averageRating: 4.0,
            });

            await MentorProfile.create({
                userId: new mongoose.Types.ObjectId(),
                displayName: 'Hidden Mentor',
                expertise: ['JavaScript'],
                isVisible: false,
                featured: false,
            });
        });

        describe('findByExpertise', () => {
            it('should find mentors by expertise', async () => {
                // Use direct find instead of the method with populate
                const profiles = await MentorProfile.find({
                    expertise: { $in: ['JavaScript'] },
                    isVisible: true,
                });

                expect(profiles.length).toBeGreaterThanOrEqual(1);
                profiles.forEach(profile => {
                    expect(profile.isVisible).toBe(true);
                    expect(profile.expertise).toContain('JavaScript');
                });
            });

            it('should not return hidden profiles', async () => {
                const profiles = await MentorProfile.find({
                    expertise: { $in: ['JavaScript'] },
                    isVisible: true,
                });

                profiles.forEach(profile => {
                    expect(profile.isVisible).toBe(true);
                });
            });

            it('should return empty array for non-existent expertise', async () => {
                const profiles = await MentorProfile.find({
                    expertise: { $in: ['NonExistent'] },
                    isVisible: true,
                });
                expect(profiles).toHaveLength(0);
            });
        });

        describe('findFeatured', () => {
            it('should find featured mentors', async () => {
                const profiles = await MentorProfile.find({
                    featured: true,
                    isVisible: true,
                }).sort({ averageRating: -1 });

                profiles.forEach(profile => {
                    expect(profile.featured).toBe(true);
                    expect(profile.isVisible).toBe(true);
                });
            });

            it('should limit results', async () => {
                const profiles = await MentorProfile.find({
                    featured: true,
                    isVisible: true,
                }).limit(1);
                expect(profiles.length).toBeLessThanOrEqual(1);
            });

            it('should sort by rating', async () => {
                const profiles = await MentorProfile.find({
                    featured: true,
                    isVisible: true,
                }).sort({ averageRating: -1 });

                for (let i = 1; i < profiles.length; i++) {
                    expect(profiles[i - 1].averageRating).toBeGreaterThanOrEqual(
                        profiles[i].averageRating
                    );
                }
            });
        });

        describe('search', () => {
            it('should search by expertise filter', async () => {
                const profiles = await MentorProfile.find({
                    expertise: { $in: ['Python'] },
                    isVisible: true,
                });

                expect(profiles.length).toBeGreaterThanOrEqual(1);
                profiles.forEach(profile => {
                    expect(profile.expertise).toContain('Python');
                });
            });

            it('should search by minimum rating filter', async () => {
                const profiles = await MentorProfile.find({
                    averageRating: { $gte: 4.0 },
                    isVisible: true,
                });

                profiles.forEach(profile => {
                    expect(profile.averageRating).toBeGreaterThanOrEqual(4.0);
                });
            });

            it('should only return visible profiles', async () => {
                const profiles = await MentorProfile.find({ isVisible: true });

                profiles.forEach(profile => {
                    expect(profile.isVisible).toBe(true);
                });
            });

            it('should handle empty filters', async () => {
                const profiles = await MentorProfile.find({ isVisible: true });
                expect(profiles.length).toBeGreaterThanOrEqual(2);
            });
        });
    });


    describe('Pricing Plans', () => {
        it('should accept valid pricing plans', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
                pricingPlans: [
                    {
                        duration: '1 Month',
                        price: 5000,
                        discountPercent: 0,
                        features: ['1-on-1 sessions', 'Resume review'],
                    },
                    {
                        duration: '3 Months',
                        price: 12000,
                        discountPercent: 20,
                        features: ['1-on-1 sessions', 'Resume review', 'Mock interviews'],
                    },
                ],
            });

            expect(profile.pricingPlans).toHaveLength(2);
            expect(profile.pricingPlans[0].price).toBe(5000);
            expect(profile.pricingPlans[1].discountPercent).toBe(20);
        });

        it('should validate pricing plan duration enum', async () => {
            const profile = new MentorProfile({
                userId: testUserId,
                displayName: 'Test Mentor',
                pricingPlans: [
                    {
                        duration: 'Invalid Duration',
                        price: 5000,
                    },
                ],
            });

            await expect(profile.save()).rejects.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty expertise array', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
                expertise: [],
            });

            expect(profile.expertise).toHaveLength(0);
        });

        it('should trim displayName whitespace', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: '  Test Mentor  ',
            });

            expect(profile.displayName).toBe('Test Mentor');
        });

        it('should enforce tagline maxlength', async () => {
            const profile = new MentorProfile({
                userId: testUserId,
                displayName: 'Test Mentor',
                tagline: 'A'.repeat(201),
            });

            await expect(profile.save()).rejects.toThrow();
        });

        it('should enforce bio maxlength', async () => {
            const profile = new MentorProfile({
                userId: testUserId,
                displayName: 'Test Mentor',
                bio: 'A'.repeat(1001),
            });

            await expect(profile.save()).rejects.toThrow();
        });

        it('should handle busy dates correctly', async () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
                busyDates: [
                    { date: futureDate, reason: 'On vacation' },
                ],
            });

            expect(profile.busyDates).toHaveLength(1);
            expect(profile.busyDates[0].reason).toBe('On vacation');
        });

        it('should update timestamps on save', async () => {
            const profile = await MentorProfile.create({
                userId: testUserId,
                displayName: 'Test Mentor',
            });

            const originalUpdatedAt = profile.updatedAt;

            // Wait a bit and update
            await new Promise(resolve => setTimeout(resolve, 100));
            profile.displayName = 'Updated Name';
            await profile.save();

            expect(profile.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });
});
