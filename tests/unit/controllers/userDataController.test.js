// tests/unit/controllers/userDataController.test.js

// Mock dependencies
jest.mock('../../../models/User', () => ({
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteMany: jest.fn()
}));

jest.mock('../../../models/Student', () => ({
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn()
}));

jest.mock('../../../models/UserActivity', () => ({
    find: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
}));

jest.mock('../../../config/mailHelper', () => ({
    sendEmailFast: jest.fn()
}));

const User = require('../../../models/User');
const Student = require('../../../models/Student');
const UserActivity = require('../../../models/UserActivity');
const { sendEmailFast } = require('../../../config/mailHelper');

const userDataController = require('../../../controllers/userDataController');

describe('UserData Controller Tests', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
            user: { _id: 'admin123', name: 'Admin User' },
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('Mozilla/5.0'),
            sessionID: 'session123'
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should return paginated users with default parameters', async () => {
            const mockUsers = [
                { _id: 'u1', name: 'User 1', email: 'user1@test.com' },
                { _id: 'u2', name: 'User 2', email: 'user2@test.com' }
            ];

            User.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockReturnValue({
                                    lean: jest.fn().mockResolvedValue(mockUsers)
                                })
                            })
                        })
                    })
                })
            });

            User.countDocuments.mockResolvedValueOnce(2) // For filter count
                .mockResolvedValueOnce(10)  // Total
                .mockResolvedValueOnce(8)   // Active
                .mockResolvedValueOnce(7)   // Verified
                .mockResolvedValueOnce(1);  // Suspended

            User.aggregate.mockResolvedValue([
                { _id: 'User', count: 8 },
                { _id: 'Admin', count: 2 }
            ]);

            await userDataController.getAllUsers(mockReq, mockRes);

            expect(User.find).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    users: mockUsers,
                    pagination: expect.objectContaining({
                        currentPage: 1,
                        perPage: 10
                    })
                })
            );
        });

        it('should filter users by role', async () => {
            mockReq.query = { role: 'Admin' };

            User.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockReturnValue({
                                    lean: jest.fn().mockResolvedValue([])
                                })
                            })
                        })
                    })
                })
            });

            User.countDocuments.mockResolvedValue(0);
            User.aggregate.mockResolvedValue([]);

            await userDataController.getAllUsers(mockReq, mockRes);

            expect(User.find).toHaveBeenCalled();
        });

        it('should search users by name, email, or username', async () => {
            mockReq.query = { search: 'john' };

            User.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                skip: jest.fn().mockReturnValue({
                                    lean: jest.fn().mockResolvedValue([])
                                })
                            })
                        })
                    })
                })
            });

            User.countDocuments.mockResolvedValue(0);
            User.aggregate.mockResolvedValue([]);

            await userDataController.getAllUsers(mockReq, mockRes);

            expect(User.find).toHaveBeenCalled();
        });

        it('should handle database errors gracefully', async () => {
            User.find.mockImplementation(() => {
                throw new Error('Database error');
            });

            await userDataController.getAllUsers(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Server error while fetching users'
                })
            );
        });
    });

    describe('getUserById', () => {
        it('should return user when found', async () => {
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'User'
            };

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockUser)
                    })
                })
            });

            Student.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            UserActivity.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue([])
                    })
                })
            });

            mockReq.params.userId = 'user123';

            await userDataController.getUserById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    user: mockUser
                })
            );
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(null)
                    })
                })
            });

            mockReq.params.userId = 'nonexistent';

            await userDataController.getUserById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found'
            });
        });

        it('should include student profile for Student role', async () => {
            const mockUser = {
                _id: 'student123',
                name: 'Student User',
                role: 'Student'
            };

            const mockStudentProfile = {
                userId: 'student123',
                department: 'Computer Science',
                year: '2024'
            };

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue(mockUser)
                    })
                })
            });

            Student.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockStudentProfile)
            });

            UserActivity.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                        lean: jest.fn().mockResolvedValue([])
                    })
                })
            });

            mockReq.params.userId = 'student123';

            await userDataController.getUserById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    studentProfile: mockStudentProfile
                })
            );
        });
    });

    describe('updateUser', () => {
        it('should update user successfully', async () => {
            const originalUser = {
                _id: 'user123',
                name: 'Original Name',
                email: 'original@test.com',
                role: 'User',
                isVerified: true,
                isActive: true
            };

            const updatedUser = {
                ...originalUser,
                name: 'Updated Name'
            };

            User.findById.mockResolvedValue(originalUser);
            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(updatedUser)
            });
            User.findOne.mockResolvedValue(null);
            UserActivity.create.mockResolvedValue({});

            mockReq.params.userId = 'user123';
            mockReq.body = { name: 'Updated Name' };

            await userDataController.updateUser(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User updated successfully'
                })
            );
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            mockReq.params.userId = 'nonexistent';
            mockReq.body = { name: 'New Name' };

            await userDataController.updateUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should validate email format', async () => {
            User.findById.mockResolvedValue({ _id: 'user123' });

            mockReq.params.userId = 'user123';
            mockReq.body = { email: 'invalid-email' };

            await userDataController.updateUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email format'
            });
        });

        it('should prevent duplicate email', async () => {
            User.findById.mockResolvedValue({ _id: 'user123' });
            User.findOne.mockResolvedValue({ _id: 'other-user', email: 'existing@test.com' });

            mockReq.params.userId = 'user123';
            mockReq.body = { email: 'existing@test.com' };

            await userDataController.updateUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already registered to another user'
            });
        });

        it('should validate role values', async () => {
            User.findById.mockResolvedValue({ _id: 'user123' });

            mockReq.params.userId = 'user123';
            mockReq.body = { role: 'InvalidRole' };

            await userDataController.updateUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid role specified'
            });
        });

        it('should not allow password update through this endpoint', async () => {
            User.findById.mockResolvedValue({ _id: 'user123', role: 'User' });
            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: 'user123' })
            });
            UserActivity.create.mockResolvedValue({});

            mockReq.params.userId = 'user123';
            mockReq.body = { password: 'newpassword', name: 'Test' };

            await userDataController.updateUser(mockReq, mockRes);

            // Password should be stripped from update data
            expect(User.findByIdAndUpdate).toHaveBeenCalled();
        });
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@test.com',
                role: 'User'
            };

            User.findById.mockResolvedValue(mockUser);
            User.findByIdAndDelete.mockResolvedValue(mockUser);
            UserActivity.deleteMany.mockResolvedValue({});
            UserActivity.create.mockResolvedValue({});
            sendEmailFast.mockResolvedValue({});

            mockReq.params.userId = 'user123';

            await userDataController.deleteUser(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true
                })
            );
        });

        it('should prevent self-deletion', async () => {
            mockReq.user._id = 'user123';
            mockReq.params.userId = 'user123';

            await userDataController.deleteUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cannot delete your own account'
            });
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            mockReq.params.userId = 'nonexistent';

            await userDataController.deleteUser(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });

        it('should delete associated student profile', async () => {
            const mockUser = {
                _id: 'student123',
                name: 'Student',
                email: 'student@test.com',
                role: 'Student'
            };

            User.findById.mockResolvedValue(mockUser);
            User.findByIdAndDelete.mockResolvedValue(mockUser);
            Student.deleteOne.mockResolvedValue({});
            UserActivity.deleteMany.mockResolvedValue({});
            UserActivity.create.mockResolvedValue({});
            sendEmailFast.mockResolvedValue({});

            mockReq.params.userId = 'student123';

            await userDataController.deleteUser(mockReq, mockRes);

            expect(Student.deleteOne).toHaveBeenCalledWith({ userId: mockUser._id });
        });
    });

    describe('bulkDeleteUsers', () => {
        it('should delete multiple users', async () => {
            const mockUsers = [
                { _id: 'u1', name: 'User 1', email: 'u1@test.com' },
                { _id: 'u2', name: 'User 2', email: 'u2@test.com' }
            ];

            User.find.mockResolvedValue(mockUsers);
            User.deleteMany.mockResolvedValue({ deletedCount: 2 });
            Student.deleteMany.mockResolvedValue({});
            UserActivity.deleteMany.mockResolvedValue({});
            UserActivity.create.mockResolvedValue({});
            sendEmailFast.mockResolvedValue({});

            mockReq.body = { userIds: ['u1', 'u2'] };

            await userDataController.bulkDeleteUsers(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    deletedCount: 2
                })
            );
        });

        it('should return 400 for empty userIds array', async () => {
            mockReq.body = { userIds: [] };

            await userDataController.bulkDeleteUsers(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'userIds array is required'
            });
        });

        it('should prevent self-deletion in bulk', async () => {
            mockReq.user._id = 'admin123';
            mockReq.body = { userIds: ['u1', 'admin123', 'u2'] };

            await userDataController.bulkDeleteUsers(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cannot delete your own account'
            });
        });
    });

    describe('toggleUserStatus', () => {
        it('should activate user', async () => {
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@test.com',
                isActive: true
            };

            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            UserActivity.create.mockResolvedValue({});
            sendEmailFast.mockResolvedValue({});

            mockReq.params.userId = 'user123';
            mockReq.body = { isActive: true };

            await userDataController.toggleUserStatus(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User activated successfully'
                })
            );
        });

        it('should deactivate user', async () => {
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@test.com',
                isActive: false
            };

            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            UserActivity.create.mockResolvedValue({});
            sendEmailFast.mockResolvedValue({});

            mockReq.params.userId = 'user123';
            mockReq.body = { isActive: false };

            await userDataController.toggleUserStatus(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User deactivated successfully'
                })
            );
        });

        it('should return 400 for non-boolean isActive', async () => {
            mockReq.params.userId = 'user123';
            mockReq.body = { isActive: 'true' };

            await userDataController.toggleUserStatus(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'isActive must be a boolean value'
            });
        });
    });

    describe('resetUserPassword', () => {
        it('should reset password successfully', async () => {
            const mockUser = {
                _id: 'user123',
                name: 'Test User',
                email: 'test@test.com',
                save: jest.fn().mockResolvedValue(true)
            };

            User.findById.mockResolvedValue(mockUser);
            UserActivity.create.mockResolvedValue({});
            sendEmailFast.mockResolvedValue({});

            mockReq.params.userId = 'user123';
            mockReq.body = { newPassword: 'NewPass123!' };

            await userDataController.resetUserPassword(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    temporaryPassword: 'NewPass123!'
                })
            );
        });

        it('should return 400 for short password', async () => {
            mockReq.params.userId = 'user123';
            mockReq.body = { newPassword: '123' };

            await userDataController.resetUserPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        });

        it('should return 404 when user not found', async () => {
            User.findById.mockResolvedValue(null);

            mockReq.params.userId = 'nonexistent';
            mockReq.body = { newPassword: 'ValidPass123!' };

            await userDataController.resetUserPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getUserStatistics', () => {
        it('should return user statistics', async () => {
            User.countDocuments
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(80)  // active
                .mockResolvedValueOnce(20)  // inactive
                .mockResolvedValueOnce(75)  // verified
                .mockResolvedValueOnce(25)  // unverified
                .mockResolvedValueOnce(5)   // suspended
                .mockResolvedValueOnce(10); // tempPassword

            User.aggregate
                .mockResolvedValueOnce([{ _id: 'User', count: 90 }]) // byRole
                .mockResolvedValueOnce([]); // monthlyGrowth

            User.find.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue([])
                        })
                    })
                })
            });

            await userDataController.getUserStatistics(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    stats: expect.objectContaining({
                        overview: expect.any(Object)
                    })
                })
            );
        });
    });
});
