const express = require('express');
const router = express.Router();
const University = require('../models/University');
const TeacherAccess = require('../models/TeacherAccess');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, verifyToken } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// Utility function to generate random password
const generatePassword = (length = 8) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

// Create University (Admin Only)
router.post('/create-university', verifyToken, async (req, res) => {
    try {
        const { name, url, location, accessMethod, registrationNumbers, emails, passwordMethod, defaultPassword } = req.body;

        // Check if user is admin
        const user = await User.findById(req.user._id);
        if (user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Parse registration numbers and emails
        const regNumbers = registrationNumbers ? registrationNumbers.split(',').map(num => num.trim()).filter(num => num) : [];
        const emailList = emails ? emails.split(',').map(email => email.trim()).filter(email => email) : [];

        // Generate password if auto method
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

        // Create UniAdmin users based on access method
        const createdUsers = [];
        let identifiers = accessMethod === 'registration' ? regNumbers : emailList;
        for (let identifier of identifiers) {
            try {
                // Check if user already exists
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
                    universityId: university._id, // FIX: Add university association
                    registrationNumber: accessMethod === 'registration' ? identifier : undefined // FIX: Store reg number if applicable
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
        // Generate Excel file if auto password
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

// Update university (Admin Only)
router.put('/update-university/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { name, url, location, isActive } = req.body;

        const university = await University.findByIdAndUpdate(
            req.params.id,
            { name, url, location, isActive, updatedAt: Date.now() },
            { new: true }
        );

        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        res.json({ success: true, university });
    } catch (error) {
        console.error('Error updating university:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create Teacher Access (UniAdmin Only)
router.post('/create-teacher-access', verifyToken, async (req, res) => {
    try {
        const { universityId, accessMethod, registrationNumbers, emails, passwordMethod, defaultPassword } = req.body;

        // Check if user is UniAdmin
        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        // Verify university exists
        const university = await University.findById(universityId);
        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        // Parse registration numbers and emails
        const regNumbers = registrationNumbers ? registrationNumbers.split(',').map(num => num.trim()).filter(num => num) : [];
        const emailList = emails ? emails.split(',').map(email => email.trim()).filter(email => email) : [];

        // Generate password if auto method
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

        // Create teacher users based on access method
        const createdUsers = [];
        const generatedCredentials = [];
        let identifiers = accessMethod === 'registration' ? regNumbers : emailList;
        for (let identifier of identifiers) {
            try {
                // Check if user already exists
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
                    universityId: universityId, // FIX: Add university association
                    registrationNumber: accessMethod === 'registration' ? identifier : undefined // FIX: Store reg number if applicable
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

        // Generate Excel file if auto password
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

// Get university for UniAdmin
router.get('/my-university', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'UniAdmin') {
            return res.status(403).json({ message: 'Access denied. UniAdmin only.' });
        }

        // Find university by checking if user's username or email is in the university's access lists
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

        // Find university first
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

// Delete university (Admin Only)
router.delete('/delete-university/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const university = await University.findByIdAndUpdate(
            req.params.id,
            { isActive: false, updatedAt: Date.now() },
            { new: true }
        );

        if (!university) {
            return res.status(404).json({ message: 'University not found' });
        }

        res.json({ success: true, message: 'University deleted successfully' });
    } catch (error) {
        console.error('Error deleting university:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;