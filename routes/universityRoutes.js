// routes/universityRoutes.js - Enhanced with Student Management

const express = require('express');
const router = express.Router();
const University = require('../models/University');
const TeacherAccess = require('../models/TeacherAccess');
const Student = require('../models/Student');
const StudentActivity = require('../models/StudentActivity');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, verifyToken } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');

// Utility function to generate random password
const generatePassword = (length = 8) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

// Helper function to log student activity
const logStudentActivity = async (studentId, userId, universityId, activityType, details, req) => {
    try {
        await StudentActivity.create({
            studentId,
            userId,
            universityId,
            sessionId: req.sessionID || uuidv4(),
            activityType,
            details,
            ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
            userAgent: req.get('User-Agent') || 'Unknown'
        });
    } catch (error) {
        console.error('Error logging student activity:', error);
    }
};

// ==================== EXISTING ROUTES ====================

// Create University (Admin Only)
router.post('/create-university', verifyToken, async (req, res) => {
    try {
        const { name, url, location, accessMethod, registrationNumbers, emails, passwordMethod, defaultPassword } = req.body;

        const user = await User.findById(req.user._id);
        if (user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const regNumbers = registrationNumbers ? registrationNumbers.split(',').map(num => num.trim()).filter(num => num) : [];
        const emailList = emails ? emails.split(',').map(email => email.trim()).filter(email => email) : [];

        let finalPassword = defaultPassword;
        if (passwordMethod === 'auto') {
            finalPassword = generatePassword();
        }

        const university = new University({
            name,
            url,
            location,
            accessMethod,
            registrationNumbers: regNumbers,
            emails: emailList,
            passwordMethod,
            defaultPassword: finalPassword,
            createdBy: req.user._id
        });

        await university.save();

        const createdUsers = [];
        let identifiers = accessMethod === 'registration' ? regNumbers : emailList;
        for (let identifier of identifiers) {
            try {
                const existingUser = await User.findOne({
                    $or: [
                        { username: identifier },
                        { email: identifier }
                    ]
                });

                if (existingUser) {
                    console.log(`User with identifier ${identifier} already exists`);
                    continue;
                }

                const hashedPassword = await bcrypt.hash(finalPassword, 10);

                const newUser = new User({
                    username: identifier,
                    name: `UniAdmin - ${university.name}`,
                    email: accessMethod === 'gmail' ? identifier : `${identifier}@${university.name.toLowerCase().replace(/\s+/g, '')}.edu`,
                    password: hashedPassword,
                    role: 'UniAdmin',
                    universityId: university._id,
                    registrationNumber: accessMethod === 'registration' ? identifier : undefined
                });

                await newUser.save();
                createdUsers.push({
                    identifier,
                    password: finalPassword,
                    userId: newUser._id
                });
            } catch (userError) {
                console.error(`Error creating user for ${identifier}:`, userError);
            }
        }

        let excelBuffer = null;
        if (passwordMethod === 'auto') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('University Access Credentials');

            worksheet.columns = [
                { header: 'University', key: 'university', width: 30 },
                { header: 'Identifier', key: 'identifier', width: 25 },
                { header: 'Password', key: 'password', width: 15 },
                { header: 'Role', key: 'role', width: 15 },
                { header: 'Created Date', key: 'createdDate', width: 20 }
            ];

            createdUsers.forEach(user => {
                worksheet.addRow({
                    university: university.name,
                    identifier: user.identifier,
                    password: user.password,
                    role: 'UniAdmin',
                    createdDate: new Date().toLocaleDateString()
                });
            });

            excelBuffer = await workbook.xlsx.writeBuffer();
        }

        res.status(201).json({
            success: true,
            message: 'University created successfully',
            university,
            createdUsers: createdUsers.length,
            excelFile: excelBuffer ? excelBuffer.toString('base64') : null
        });

    } catch (error) {
        console.error('Error creating university:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create Teacher Access (UniAdmin Only) - Enhanced
router.post('/create-teacher-access', verifyToken, async (req, res) => {
    try {
        const { universityId, accessMethod, registrationNumbers, emails, passwordMethod, defaultPassword } = req.body;

        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        const regNumbers = registrationNumbers ? registrationNumbers.split(',').map(num => num.trim()).filter(num => num) : [];
        const emailList = emails ? emails.split(',').map(email => email.trim()).filter(email => email) : [];

        let finalPassword = defaultPassword;
        if (passwordMethod === 'auto') {
            finalPassword = generatePassword();
        }

        const teacherAccess = new TeacherAccess({
            university: universityId,
            accessMethod,
            registrationNumbers: regNumbers,
            emails: emailList,
            passwordMethod,
            defaultPassword: finalPassword,
            createdBy: req.user._id
        });

        const createdUsers = [];
        const generatedCredentials = [];
        let identifiers = accessMethod === 'registration' ? regNumbers : emailList;
        
        for (let identifier of identifiers) {
            try {
                const existingUser = await User.findOne({
                    $or: [
                        { username: identifier },
                        { email: identifier }
                    ]
                });

                if (existingUser) {
                    console.log(`User with identifier ${identifier} already exists`);
                    continue;
                }

                const userPassword = passwordMethod === 'auto' ? generatePassword() : finalPassword;
                const hashedPassword = await bcrypt.hash(userPassword, 10);

                const newUser = new User({
                    username: identifier,
                    name: `Teacher - ${university.name}`,
                    email: accessMethod === 'gmail' ? identifier : `${identifier}@${university.name.toLowerCase().replace(/\s+/g, '')}.edu`,
                    password: hashedPassword,
                    role: 'UniTeach',
                    universityId: universityId,
                    registrationNumber: accessMethod === 'registration' ? identifier : undefined
                });

                await newUser.save();
                createdUsers.push({
                    identifier,
                    password: userPassword,
                    userId: newUser._id
                });

                generatedCredentials.push({
                    identifier,
                    password: userPassword
                });

            } catch (userError) {
                console.error(`Error creating teacher user for ${identifier}:`, userError);
            }
        }

        teacherAccess.generatedCredentials = generatedCredentials;
        await teacherAccess.save();

        let excelBuffer = null;
        if (passwordMethod === 'auto') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Teacher Access Credentials');

            worksheet.columns = [
                { header: 'University', key: 'university', width: 30 },
                { header: 'Identifier', key: 'identifier', width: 25 },
                { header: 'Password', key: 'password', width: 15 },
                { header: 'Role', key: 'role', width: 15 },
                { header: 'Created Date', key: 'createdDate', width: 20 }
            ];

            createdUsers.forEach(user => {
                worksheet.addRow({
                    university: university.name,
                    identifier: user.identifier,
                    password: user.password,
                    role: 'UniTeach',
                    createdDate: new Date().toLocaleDateString()
                });
            });

            excelBuffer = await workbook.xlsx.writeBuffer();
        }

        res.status(201).json({
            success: true,
            message: 'Teacher access created successfully',
            teacherAccess,
            createdUsers: createdUsers.length,
            excelFile: excelBuffer ? excelBuffer.toString('base64') : null
        });

    } catch (error) {
        console.error('Error creating teacher access:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== NEW STUDENT MANAGEMENT ROUTES ====================

// Create Student Access (UniAdmin Only)
router.post('/create-student-access', verifyToken, async (req, res) => {
    try {
        const { 
            universityId, 
            accessMethod, 
            registrationNumbers, 
            emails, 
            passwordMethod, 
            defaultPassword,
            department,
            year,
            course
        } = req.body;

        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        const regNumbers = registrationNumbers ? registrationNumbers.split(',').map(num => num.trim()).filter(num => num) : [];
        const emailList = emails ? emails.split(',').map(email => email.trim()).filter(email => email) : [];

        let finalPassword = defaultPassword;
        if (passwordMethod === 'auto') {
            finalPassword = generatePassword();
        }

        const createdUsers = [];
        const generatedCredentials = [];
        let identifiers = accessMethod === 'registration' ? regNumbers : emailList;
        
        for (let identifier of identifiers) {
            try {
                const existingUser = await User.findOne({
                    $or: [
                        { username: identifier },
                        { email: identifier }
                    ]
                });

                if (existingUser) {
                    console.log(`User with identifier ${identifier} already exists`);
                    continue;
                }

                const userPassword = passwordMethod === 'auto' ? generatePassword() : finalPassword;
                const hashedPassword = await bcrypt.hash(userPassword, 10);

                // Create User account
                const newUser = new User({
                    username: identifier,
                    name: `Student - ${identifier}`,
                    email: accessMethod === 'gmail' ? identifier : `${identifier}@${university.name.toLowerCase().replace(/\s+/g, '')}.edu`,
                    password: hashedPassword,
                    role: 'Student',
                    universityId: universityId,
                    registrationNumber: accessMethod === 'registration' ? identifier : undefined
                });

                await newUser.save();

                // Create Student profile
                const newStudent = new Student({
                    userId: newUser._id,
                    universityId: universityId,
                    department: department || '',
                    year: year || '',
                    course: course || '',
                    rollNumber: accessMethod === 'registration' ? identifier : undefined,
                    createdBy: req.user._id,
                    enrollment: {
                        admissionDate: new Date(),
                        enrollmentType: 'full_time'
                    }
                });

                await newStudent.save();

                // Log student creation activity
                await logStudentActivity(
                    newStudent._id,
                    newUser._id,
                    universityId,
                    'account_created',
                    {
                        createdBy: user.name,
                        department: department,
                        year: year,
                        course: course
                    },
                    req
                );

                createdUsers.push({
                    identifier,
                    password: userPassword,
                    userId: newUser._id,
                    studentId: newStudent._id
                });

                generatedCredentials.push({
                    identifier,
                    password: userPassword
                });

            } catch (userError) {
                console.error(`Error creating student user for ${identifier}:`, userError);
            }
        }

        // Generate Excel file if auto password
        let excelBuffer = null;
        if (passwordMethod === 'auto' || createdUsers.length > 0) {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Student Access Credentials');

            worksheet.columns = [
                { header: 'University', key: 'university', width: 30 },
                { header: 'Identifier', key: 'identifier', width: 25 },
                { header: 'Password', key: 'password', width: 15 },
                { header: 'Role', key: 'role', width: 15 },
                { header: 'Department', key: 'department', width: 20 },
                { header: 'Year', key: 'year', width: 10 },
                { header: 'Course', key: 'course', width: 15 },
                { header: 'Created Date', key: 'createdDate', width: 20 }
            ];

            createdUsers.forEach(user => {
                worksheet.addRow({
                    university: university.name,
                    identifier: user.identifier,
                    password: user.password,
                    role: 'Student',
                    department: department || 'N/A',
                    year: year || 'N/A',
                    course: course || 'N/A',
                    createdDate: new Date().toLocaleDateString()
                });
            });

            excelBuffer = await workbook.xlsx.writeBuffer();
        }

        res.status(201).json({
            success: true,
            message: 'Student access created successfully',
            createdUsers: createdUsers.length,
            excelFile: excelBuffer ? excelBuffer.toString('base64') : null,
            generatedCredentials: passwordMethod === 'auto' ? generatedCredentials : []
        });

    } catch (error) {
        console.error('Error creating student access:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all students for UniAdmin
router.get('/students', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        let universityId;
        if (user.role === 'Admin') {
            universityId = req.query.universityId;
        } else {
            // Find university for UniAdmin
            const university = await University.findOne({
                $or: [
                    { registrationNumbers: user.username },
                    { emails: user.email }
                ],
                isActive: true
            });

            if (!university) {
                return res.status(404).json({ message: 'University not found for this user' });
            }
            universityId = university._id;
        }

        const students = await Student.findByUniversity(universityId)
            .populate({
                path: 'userId',
                select: 'name email username registrationNumber lastLogin isActive createdAt'
            })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        // Transform data for frontend
        const transformedStudents = students.map(student => ({
            _id: student._id,
            name: student.userId?.name || 'Unknown',
            email: student.userId?.email || '',
            username: student.userId?.username || '',
            registrationNumber: student.userId?.registrationNumber || student.rollNumber || '',
            department: student.department || '',
            year: student.year || '',
            course: student.course || '',
            isActive: student.userId?.isActive && student.academicStatus === 'active',
            isSuspended: student.isSuspended,
            suspensionDetails: student.suspensionDetails || null,
            lastLogin: student.userId?.lastLogin || null,
            createdAt: student.createdAt,
            createdBy: student.createdBy?.name || 'System',
            academicStatus: student.academicStatus,
            performance: student.performance || {}
        }));

        res.json({ success: true, students: transformedStudents });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Student actions (suspend, activate, delete, etc.)
router.post('/student-action', verifyToken, async (req, res) => {
    try {
        const { studentId, action, days, reason } = req.body;

        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const student = await Student.findById(studentId).populate('userId');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let message = '';
        let activityType = '';
        let activityDetails = {};

        switch (action) {
            case 'suspend':
                if (!days || !reason) {
                    return res.status(400).json({ message: 'Days and reason are required for suspension' });
                }
                await student.suspendStudent(days, reason, req.user._id, user.name);
                message = `Student suspended for ${days} days`;
                activityType = 'student_suspended';
                activityDetails = { days, reason, suspendedBy: user.name };
                break;

            case 'unsuspend':
                await student.unsuspendStudent();
                message = 'Student unsuspended successfully';
                activityType = 'student_unsuspended';
                activityDetails = { unsuspendedBy: user.name };
                break;

            case 'activate':
                student.academicStatus = 'active';
                student.userId.isActive = true;
                await student.save();
                await student.userId.save();
                message = 'Student activated successfully';
                activityType = 'student_activated';
                activityDetails = { activatedBy: user.name };
                break;

            case 'deactivate':
                student.academicStatus = 'on_leave';
                student.userId.isActive = false;
                await student.save();
                await student.userId.save();
                message = 'Student deactivated successfully';
                activityType = 'student_deactivated';
                activityDetails = { deactivatedBy: user.name };
                break;

            case 'delete':
                student.userId.isActive = false;
                student.academicStatus = 'dropped';
                await student.save();
                await student.userId.save();
                message = 'Student deleted successfully';
                activityType = 'student_deleted';
                activityDetails = { deletedBy: user.name };
                break;

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        // Log the activity
        await logStudentActivity(
            student._id,
            student.userId._id,
            student.universityId,
            activityType,
            activityDetails,
            req
        );

        res.json({ success: true, message });
    } catch (error) {
        console.error('Error performing student action:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Edit student information
router.put('/edit-student/:studentId', verifyToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { name, email, department, year, course } = req.body;

        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const student = await Student.findById(studentId).populate('userId');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update User information
        student.userId.name = name;
        student.userId.email = email;
        await student.userId.save();

        // Update Student information
        student.department = department || student.department;
        student.year = year || student.year;
        student.course = course || student.course;
        student.lastModifiedBy = req.user._id;
        await student.save();

        // Log the activity
        await logStudentActivity(
            student._id,
            student.userId._id,
            student.universityId,
            'student_updated',
            {
                updatedBy: user.name,
                updatedFields: { name, email, department, year, course }
            },
            req
        );

        res.json({ success: true, message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get student activity log
router.get('/student-activity/:studentId', verifyToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { days = 30 } = req.query;

        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const activities = await StudentActivity.getStudentLoginHistory(studentId, parseInt(days));
        
        res.json({ success: true, activities });
    } catch (error) {
        console.error('Error fetching student activity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get university statistics
router.get('/university-stats', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        let universityId;
        if (user.role === 'Admin') {
            universityId = req.query.universityId;
        } else {
            const university = await University.findOne({
                $or: [
                    { registrationNumbers: user.username },
                    { emails: user.email }
                ],
                isActive: true
            });

            if (!university) {
                return res.status(404).json({ message: 'University not found for this user' });
            }
            universityId = university._id;
        }

        const stats = await Student.getUniversityStats(universityId);
        const activityStats = await StudentActivity.getUniversityActivityStats(universityId);
        const activeStudents = await StudentActivity.getActiveStudentsCount(universityId);

        res.json({
            success: true,
            stats: stats[0] || {
                totalStudents: 0,
                activeStudents: 0,
                suspendedStudents: 0,
                graduatedStudents: 0
            },
            activityStats,
            currentlyActiveStudents: activeStudents.length
        });
    } catch (error) {
        console.error('Error fetching university stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add admin note to student
router.post('/student-note/:studentId', verifyToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { note, category = 'general', isImportant = false } = req.body;

        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await student.addAdminNote(note, req.user._id, user.name, category, isImportant);

        // Log the activity
        await logStudentActivity(
            student._id,
            student.userId,
            student.universityId,
            'admin_note_added',
            {
                addedBy: user.name,
                category,
                isImportant
            },
            req
        );

        res.json({ success: true, message: 'Note added successfully' });
    } catch (error) {
        console.error('Error adding student note:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update student portal access
router.put('/student-portal-access/:studentId', verifyToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const accessSettings = req.body;

        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin' && user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await student.updatePortalAccess(accessSettings);

        // Log the activity
        await logStudentActivity(
            student._id,
            student.userId,
            student.universityId,
            'portal_access_updated',
            {
                updatedBy: user.name,
                accessSettings
            },
            req
        );

        res.json({ success: true, message: 'Portal access updated successfully' });
    } catch (error) {
        console.error('Error updating portal access:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ==================== EXISTING ROUTES (UNCHANGED) ====================

// Get all universities (Admin Only)
router.get('/universities', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const universities = await University.find({ isActive: true })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, universities });
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get university for UniAdmin
router.get('/my-university', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const university = await University.findOne({
            $or: [
                { registrationNumbers: user.username },
                { emails: user.email }
            ],
            isActive: true
        });

        if (!university) {
            return res.status(404).json({ message: 'University not found for this user' });
        }

        res.json({ success: true, university });
    } catch (error) {
        console.error('Error fetching university:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get teacher access records for UniAdmin
router.get('/teacher-access', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        const university = await University.findOne({
            $or: [
                { registrationNumbers: user.username },
                { emails: user.email }
            ],
            isActive: true
        });

        if (!university) {
            return res.status(404).json({ message: 'University not found for this user' });
        }

        const teacherAccess = await TeacherAccess.find({
            university: university._id,
            isActive: true
        })
            .populate('university', 'name url')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, teacherAccess });
    } catch (error) {
        console.error('Error fetching teacher access:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;