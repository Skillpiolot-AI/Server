// tests/unit/models/student.test.js
const mongoose = require('mongoose');
const Student = require('../../../models/Student');

describe('Student Model Tests', () => {
    const mockUserId = new mongoose.Types.ObjectId();
    const mockUniversityId = new mongoose.Types.ObjectId();
    const mockCreatedById = new mongoose.Types.ObjectId();

    describe('Student Creation', () => {
        it('should create a valid student with required fields', async () => {
            const studentData = {
                userId: mockUserId,
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                department: 'Computer Science',
                year: '2024',
                course: 'B.Tech'
            };

            const student = new Student(studentData);
            const savedStudent = await student.save();

            expect(savedStudent._id).toBeDefined();
            expect(savedStudent.userId.toString()).toBe(mockUserId.toString());
            expect(savedStudent.universityId.toString()).toBe(mockUniversityId.toString());
            expect(savedStudent.department).toBe('Computer Science');
            expect(savedStudent.academicStatus).toBe('active');
            expect(savedStudent.isSuspended).toBe(false);
        });

        it('should not create student without required userId', async () => {
            const student = new Student({
                universityId: mockUniversityId,
                createdBy: mockCreatedById
            });

            await expect(student.save()).rejects.toThrow();
        });

        it('should not create student without required universityId', async () => {
            const student = new Student({
                userId: mockUserId,
                createdBy: mockCreatedById
            });

            await expect(student.save()).rejects.toThrow();
        });

        it('should set default values correctly', async () => {
            const student = new Student({
                userId: mockUserId,
                universityId: mockUniversityId,
                createdBy: mockCreatedById
            });

            const savedStudent = await student.save();

            expect(savedStudent.academicStatus).toBe('active');
            expect(savedStudent.isSuspended).toBe(false);
            expect(savedStudent.portalAccess.canAccessLibrary).toBe(true);
            expect(savedStudent.portalAccess.canAccessLabs).toBe(true);
            expect(savedStudent.portalAccess.canAccessCourses).toBe(true);
            expect(savedStudent.portalAccess.canSubmitAssignments).toBe(true);
            expect(savedStudent.portalAccess.canViewGrades).toBe(true);
        });

        it('should validate academic status enum values', async () => {
            const student = new Student({
                userId: mockUserId,
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                academicStatus: 'invalid_status'
            });

            await expect(student.save()).rejects.toThrow();
        });

        it('should accept valid academic status values', async () => {
            const validStatuses = ['active', 'graduated', 'dropped', 'transferred', 'on_leave'];

            for (const status of validStatuses) {
                const student = new Student({
                    userId: new mongoose.Types.ObjectId(),
                    universityId: mockUniversityId,
                    createdBy: mockCreatedById,
                    academicStatus: status
                });

                const saved = await student.save();
                expect(saved.academicStatus).toBe(status);
            }
        });

        it('should validate enrollment type enum values', async () => {
            const student = new Student({
                userId: mockUserId,
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                enrollment: { enrollmentType: 'invalid_type' }
            });

            await expect(student.save()).rejects.toThrow();
        });

        it('should validate GPA range (0-10)', async () => {
            const student = new Student({
                userId: mockUserId,
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                performance: { currentGPA: 11 }
            });

            await expect(student.save()).rejects.toThrow();
        });

        it('should validate attendance percentage range (0-100)', async () => {
            const student = new Student({
                userId: mockUserId,
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                performance: { attendancePercentage: 150 }
            });

            await expect(student.save()).rejects.toThrow();
        });
    });

    describe('Student Instance Methods', () => {
        let student;

        beforeEach(async () => {
            student = await Student.create({
                userId: new mongoose.Types.ObjectId(),
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                department: 'Computer Science'
            });
        });

        describe('suspendStudent', () => {
            it('should suspend student for specified days', async () => {
                const suspenderId = new mongoose.Types.ObjectId();
                const suspendedStudent = await student.suspendStudent(7, 'Violation of rules', suspenderId, 'Admin User');

                expect(suspendedStudent.isSuspended).toBe(true);
                expect(suspendedStudent.suspensionDetails.reason).toBe('Violation of rules');
                expect(suspendedStudent.suspensionDetails.suspendedBy.toString()).toBe(suspenderId.toString());
                expect(suspendedStudent.suspensionDetails.suspendedByName).toBe('Admin User');
                expect(suspendedStudent.suspensionDetails.isActive).toBe(true);

                // Check suspension end date is approximately 7 days from now
                const expectedEndDate = new Date();
                expectedEndDate.setDate(expectedEndDate.getDate() + 7);
                const actualEndDate = new Date(suspendedStudent.suspensionDetails.until);
                expect(actualEndDate.getDate()).toBe(expectedEndDate.getDate());
            });

            it('should handle suspension with minimum days', async () => {
                const suspendedStudent = await student.suspendStudent(1, 'Minor warning', mockCreatedById, 'Admin');

                expect(suspendedStudent.isSuspended).toBe(true);
                expect(suspendedStudent.suspensionDetails.reason).toBe('Minor warning');
            });
        });

        describe('unsuspendStudent', () => {
            it('should unsuspend a suspended student', async () => {
                // First suspend the student
                await student.suspendStudent(7, 'Test suspension', mockCreatedById, 'Admin');
                expect(student.isSuspended).toBe(true);

                // Then unsuspend
                const unsuspendedStudent = await student.unsuspendStudent();

                expect(unsuspendedStudent.isSuspended).toBe(false);
                expect(unsuspendedStudent.suspensionDetails).toEqual({});
            });

            it('should work on non-suspended student', async () => {
                expect(student.isSuspended).toBe(false);

                const result = await student.unsuspendStudent();

                expect(result.isSuspended).toBe(false);
            });
        });

        describe('addAdminNote', () => {
            it('should add admin note with all parameters', async () => {
                const adminId = new mongoose.Types.ObjectId();
                const updatedStudent = await student.addAdminNote(
                    'Student needs additional support',
                    adminId,
                    'Admin Name',
                    'academic',
                    true
                );

                expect(updatedStudent.adminNotes).toHaveLength(1);
                expect(updatedStudent.adminNotes[0].note).toBe('Student needs additional support');
                expect(updatedStudent.adminNotes[0].addedBy.toString()).toBe(adminId.toString());
                expect(updatedStudent.adminNotes[0].addedByName).toBe('Admin Name');
                expect(updatedStudent.adminNotes[0].category).toBe('academic');
                expect(updatedStudent.adminNotes[0].isImportant).toBe(true);
            });

            it('should add multiple notes', async () => {
                const adminId = new mongoose.Types.ObjectId();

                await student.addAdminNote('First note', adminId, 'Admin', 'general', false);
                await student.addAdminNote('Second note', adminId, 'Admin', 'disciplinary', true);

                const refreshedStudent = await Student.findById(student._id);
                expect(refreshedStudent.adminNotes).toHaveLength(2);
            });

            it('should use default values for category and importance', async () => {
                const adminId = new mongoose.Types.ObjectId();
                const updatedStudent = await student.addAdminNote('Simple note', adminId, 'Admin');

                expect(updatedStudent.adminNotes[0].category).toBe('general');
                expect(updatedStudent.adminNotes[0].isImportant).toBe(false);
            });
        });

        describe('updatePortalAccess', () => {
            it('should update portal access settings', async () => {
                const updatedStudent = await student.updatePortalAccess({
                    canAccessLibrary: false,
                    canAccessLabs: false
                });

                expect(updatedStudent.portalAccess.canAccessLibrary).toBe(false);
                expect(updatedStudent.portalAccess.canAccessLabs).toBe(false);
                expect(updatedStudent.portalAccess.canAccessCourses).toBe(true); // Unchanged
            });

            it('should handle partial updates', async () => {
                const updatedStudent = await student.updatePortalAccess({
                    canSubmitAssignments: false
                });

                expect(updatedStudent.portalAccess.canSubmitAssignments).toBe(false);
                expect(updatedStudent.portalAccess.canViewGrades).toBe(true);
            });
        });
    });

    describe('Student Virtual Properties', () => {
        it('should correctly identify active suspension with future date', async () => {
            const student = await Student.create({
                userId: new mongoose.Types.ObjectId(),
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                isSuspended: true,
                suspensionDetails: {
                    until: new Date(Date.now() + 86400000), // Tomorrow
                    reason: 'Test'
                }
            });

            expect(student.isSuspensionExpired).toBe(false);
        });

        it('should return false for non-suspended students', async () => {
            const student = await Student.create({
                userId: new mongoose.Types.ObjectId(),
                universityId: mockUniversityId,
                createdBy: mockCreatedById,
                isSuspended: false
            });

            expect(student.isSuspensionExpired).toBe(false);
        });
    });

    describe('Student Querying', () => {
        beforeEach(async () => {
            // Create test students
            await Student.create([
                {
                    userId: new mongoose.Types.ObjectId(),
                    universityId: mockUniversityId,
                    createdBy: mockCreatedById,
                    academicStatus: 'active',
                    isSuspended: false,
                    department: 'CS'
                },
                {
                    userId: new mongoose.Types.ObjectId(),
                    universityId: mockUniversityId,
                    createdBy: mockCreatedById,
                    academicStatus: 'active',
                    isSuspended: true,
                    department: 'ECE'
                },
                {
                    userId: new mongoose.Types.ObjectId(),
                    universityId: mockUniversityId,
                    createdBy: mockCreatedById,
                    academicStatus: 'graduated',
                    isSuspended: false,
                    department: 'ME'
                }
            ]);
        });

        it('should find students by university', async () => {
            const students = await Student.find({ universityId: mockUniversityId });
            expect(students.length).toBeGreaterThanOrEqual(3);
        });

        it('should filter by suspension status', async () => {
            const suspended = await Student.find({ universityId: mockUniversityId, isSuspended: true });
            suspended.forEach(s => expect(s.isSuspended).toBe(true));
        });

        it('should filter by academic status', async () => {
            const active = await Student.find({ universityId: mockUniversityId, academicStatus: 'active' });
            active.forEach(s => expect(s.academicStatus).toBe('active'));
        });

        it('should filter by department', async () => {
            const csStudents = await Student.find({ universityId: mockUniversityId, department: 'CS' });
            csStudents.forEach(s => expect(s.department).toBe('CS'));
        });
    });
});
