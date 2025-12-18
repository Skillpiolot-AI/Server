// tests/unit/middleware/auth.test.js
const jwt = require('jsonwebtoken');

// Mock User model
jest.mock('../../../models/User', () => ({
    findById: jest.fn()
}));

const User = require('../../../models/User');
const { auth, verifyToken, requireRole, adminOnly, requireUniversityAccess } = require('../../../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET

describe('Auth Middleware Tests', () => {
    let mockReq, mockRes, nextFn;

    beforeEach(() => {
        mockReq = {
            header: jest.fn(),
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFn = jest.fn();
        jest.clearAllMocks();
    });

    describe('auth middleware', () => {
        it('should reject request without authorization header', async () => {
            mockReq.header.mockReturnValue(null);

            await auth(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access denied. No authorization header provided.'
            });
            expect(nextFn).not.toHaveBeenCalled();
        });

        it('should reject request with empty token', async () => {
            mockReq.header.mockReturnValue('Bearer ');

            await auth(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(nextFn).not.toHaveBeenCalled();
        });

        it('should reject request with invalid token format', async () => {
            mockReq.header.mockReturnValue('Bearer invalid-token');

            await auth(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid token format.'
            });
        });

        it('should reject request with expired token', async () => {
            const expiredToken = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '-1h' });
            mockReq.header.mockReturnValue(`Bearer ${expiredToken}`);

            await auth(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token has expired. Please login again.'
            });
        });

        it('should reject if user not found in database', async () => {
            const token = jwt.sign({ id: 'nonexistent' }, JWT_SECRET, { expiresIn: '1h' });
            mockReq.header.mockReturnValue(`Bearer ${token}`);

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null)
                })
            });

            await auth(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid token. User not found.'
            });
        });

        it('should reject locked accounts', async () => {
            const token = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            mockReq.header.mockReturnValue(`Bearer ${token}`);

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue({
                        _id: 'user123',
                        username: 'testuser',
                        role: 'User',
                        isLocked: true,
                        isActive: true
                    })
                })
            });

            await auth(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(423);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
            });
        });

        it('should reject inactive accounts', async () => {
            const token = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            mockReq.header.mockReturnValue(`Bearer ${token}`);

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue({
                        _id: 'user123',
                        username: 'testuser',
                        role: 'User',
                        isLocked: false,
                        isActive: false
                    })
                })
            });

            await auth(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Account has been deactivated. Please contact administrator.'
            });
        });

        it('should authenticate valid user and call next', async () => {
            const token = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            mockReq.header.mockReturnValue(`Bearer ${token}`);

            const mockUser = {
                _id: 'user123',
                username: 'testuser',
                role: 'User',
                isLocked: false,
                isActive: true
            };

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await auth(mockReq, mockRes, nextFn);

            expect(mockReq.user).toEqual(mockUser);
            expect(nextFn).toHaveBeenCalled();
        });
    });

    describe('verifyToken middleware', () => {
        it('should reject request without authorization header', async () => {
            mockReq.headers = {};

            await verifyToken(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'No authorization header provided'
            });
        });

        it('should reject request with malformed authorization header', async () => {
            mockReq.headers = { authorization: 'InvalidFormat' };

            await verifyToken(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'No token provided'
            });
        });

        it('should verify valid token and attach user to request', async () => {
            const token = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            mockReq.headers = { authorization: `Bearer ${token}` };

            const mockUser = {
                _id: 'user123',
                username: 'testuser',
                role: 'User',
                isLocked: false,
                isActive: true
            };

            User.findById.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockUser)
                })
            });

            await verifyToken(mockReq, mockRes, nextFn);

            expect(mockReq.user).toEqual(mockUser);
            expect(nextFn).toHaveBeenCalled();
        });
    });

    describe('requireRole middleware', () => {
        it('should reject if user is not authenticated', () => {
            mockReq.user = null;

            const middleware = requireRole(['Admin']);
            middleware(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication required.'
            });
        });

        it('should reject if user does not have required role', () => {
            mockReq.user = { role: 'User' };

            const middleware = requireRole(['Admin', 'Mentor']);
            middleware(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access denied. Required roles: Admin, Mentor'
            });
        });

        it('should allow access if user has one of the required roles', () => {
            mockReq.user = { role: 'Admin' };

            const middleware = requireRole(['Admin', 'Mentor']);
            middleware(mockReq, mockRes, nextFn);

            expect(nextFn).toHaveBeenCalled();
        });

        it('should handle single role requirement', () => {
            mockReq.user = { role: 'Mentor' };

            const middleware = requireRole(['Mentor']);
            middleware(mockReq, mockRes, nextFn);

            expect(nextFn).toHaveBeenCalled();
        });
    });

    describe('adminOnly middleware', () => {
        it('should reject if user is not authenticated', () => {
            mockReq.user = null;

            adminOnly(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication required.'
            });
        });

        it('should reject non-admin users', () => {
            mockReq.user = { role: 'User' };

            adminOnly(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        });

        it('should reject Mentor role', () => {
            mockReq.user = { role: 'Mentor' };

            adminOnly(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });

        it('should allow Admin role', () => {
            mockReq.user = { role: 'Admin' };

            adminOnly(mockReq, mockRes, nextFn);

            expect(nextFn).toHaveBeenCalled();
        });
    });

    describe('requireUniversityAccess middleware', () => {
        it('should reject if user is not authenticated', () => {
            mockReq.user = null;

            requireUniversityAccess(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should reject users without university access roles', () => {
            mockReq.user = { role: 'User' };

            requireUniversityAccess(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access denied. University access required.'
            });
        });

        it('should allow Admin without university association', () => {
            mockReq.user = { role: 'Admin' };

            requireUniversityAccess(mockReq, mockRes, nextFn);

            expect(nextFn).toHaveBeenCalled();
        });

        it('should reject UniAdmin without university association', () => {
            mockReq.user = { role: 'UniAdmin', universityId: null };

            requireUniversityAccess(mockReq, mockRes, nextFn);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                message: 'Access denied. No university association found.'
            });
        });

        it('should allow UniAdmin with university association', () => {
            mockReq.user = { role: 'UniAdmin', universityId: 'uni123' };

            requireUniversityAccess(mockReq, mockRes, nextFn);

            expect(nextFn).toHaveBeenCalled();
        });

        it('should allow UniTeach with university association', () => {
            mockReq.user = { role: 'UniTeach', universityId: 'uni123' };

            requireUniversityAccess(mockReq, mockRes, nextFn);

            expect(nextFn).toHaveBeenCalled();
        });
    });
});
