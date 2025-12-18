const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==================== MULTER CONFIGURATION FOR PROFILE PHOTOS ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

// ==================== GET COMPLETE PROFILE ====================
// GET /api/profile/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id).select('name username email imageUrl newsletter');

    if (!profile) {
      // Create empty profile if doesn't exist
      profile = new Profile({ user: req.user._id });
      await profile.save();
    }

    res.json({
      success: true,
      profile: {
        ...profile.toObject(),
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          imageUrl: user.imageUrl,
          newsletter: user.newsletter,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== LEGACY GET PROFILE ====================
// GET /api/profile (for backward compatibility)
router.get('/', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== UPDATE PERSONAL INFORMATION ====================
// PUT /api/profile/personal
router.put('/personal', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, country, phoneNumber, address, bio } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Update personal fields
    if (firstName !== undefined) profile.firstName = firstName;
    if (lastName !== undefined) profile.lastName = lastName;
    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (country !== undefined) profile.country = country;
    if (phoneNumber !== undefined) profile.phoneNumber = phoneNumber;
    if (address !== undefined) profile.address = address;
    if (bio !== undefined) profile.bio = bio;

    await profile.save();

    // Also update user's name if firstName/lastName provided
    if (firstName || lastName) {
      const user = await User.findById(req.user._id);
      const newName = `${firstName || profile.firstName || ''} ${lastName || profile.lastName || ''}`.trim();
      if (newName) {
        user.name = newName;
        await user.save();
      }
    }

    res.json({ success: true, message: 'Personal information updated', profile });
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE 10TH GRADE DETAILS ====================
// PUT /api/profile/education/tenth
router.put('/education/tenth', verifyToken, async (req, res) => {
  try {
    const { percentage, cgpa, board, year, school, maths, science, english } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.tenthGrade = {
      ...profile.tenthGrade,
      percentage,
      cgpa,
      board,
      year,
      school,
      maths,
      science,
      english,
    };

    await profile.save();

    res.json({ success: true, message: '10th grade details updated', tenthGrade: profile.tenthGrade });
  } catch (error) {
    console.error('Error updating 10th grade:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE 12TH GRADE DETAILS ====================
// PUT /api/profile/education/twelfth
router.put('/education/twelfth', verifyToken, async (req, res) => {
  try {
    const { percentage, cgpa, board, stream, year, school, maths, physics, chemistry } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.twelfthGrade = {
      ...profile.twelfthGrade,
      percentage,
      cgpa,
      board,
      stream,
      year,
      school,
      maths,
      physics,
      chemistry,
    };

    await profile.save();

    res.json({ success: true, message: '12th grade details updated', twelfthGrade: profile.twelfthGrade });
  } catch (error) {
    console.error('Error updating 12th grade:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE UNDERGRADUATE DETAILS ====================
// PUT /api/profile/education/undergraduate
router.put('/education/undergraduate', verifyToken, async (req, res) => {
  try {
    const {
      status,
      courseName,
      specialization,
      collegeName,
      university,
      startYear,
      passoutYear,
      expectedPassoutYear,
      cgpa,
      percentage,
    } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.undergraduate = {
      status,
      courseName,
      specialization,
      collegeName,
      university,
      startYear,
      passoutYear,
      expectedPassoutYear,
      cgpa,
      percentage,
    };

    await profile.save();

    res.json({ success: true, message: 'Undergraduate details updated', undergraduate: profile.undergraduate });
  } catch (error) {
    console.error('Error updating undergraduate:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE GRADUATION DETAILS ====================
// PUT /api/profile/education/graduation
router.put('/education/graduation', verifyToken, async (req, res) => {
  try {
    const {
      status,
      courseName,
      specialization,
      collegeName,
      university,
      startYear,
      passoutYear,
      expectedPassoutYear,
      cgpa,
      percentage,
    } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.graduation = {
      status,
      courseName,
      specialization,
      collegeName,
      university,
      startYear,
      passoutYear,
      expectedPassoutYear,
      cgpa,
      percentage,
    };

    await profile.save();

    res.json({ success: true, message: 'Graduation details updated', graduation: profile.graduation });
  } catch (error) {
    console.error('Error updating graduation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE EXPERIENCE ====================
// PUT /api/profile/experience
router.put('/experience', verifyToken, async (req, res) => {
  try {
    const { experience } = req.body;

    if (!Array.isArray(experience)) {
      return res.status(400).json({ success: false, message: 'Experience must be an array' });
    }

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.experience = experience;
    await profile.save();

    res.json({ success: true, message: 'Experience updated', experience: profile.experience });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== ADD SINGLE EXPERIENCE ====================
// POST /api/profile/experience
router.post('/experience', verifyToken, async (req, res) => {
  try {
    const experienceItem = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.experience.unshift(experienceItem);
    await profile.save();

    res.json({ success: true, message: 'Experience added', experience: profile.experience });
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== DELETE EXPERIENCE ====================
// DELETE /api/profile/experience/:index
router.delete('/experience/:index', verifyToken, async (req, res) => {
  try {
    const { index } = req.params;
    const idx = parseInt(index, 10);

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (idx < 0 || idx >= profile.experience.length) {
      return res.status(400).json({ success: false, message: 'Invalid experience index' });
    }

    profile.experience.splice(idx, 1);
    await profile.save();

    res.json({ success: true, message: 'Experience deleted', experience: profile.experience });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE SOCIAL LINKS ====================
// PUT /api/profile/social-links
router.put('/social-links', verifyToken, async (req, res) => {
  try {
    const { github, linkedin, portfolio, twitter, customLinks } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.socialLinks = {
      github,
      linkedin,
      portfolio,
      twitter,
      customLinks: customLinks || [],
    };

    await profile.save();

    res.json({ success: true, message: 'Social links updated', socialLinks: profile.socialLinks });
  } catch (error) {
    console.error('Error updating social links:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPLOAD PROFILE PHOTO ====================
// POST /api/profile/photo
router.post('/photo', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);

    // Delete old photo if exists
    if (user.imageUrl && user.imageUrl.includes('/uploads/profiles/')) {
      const oldPath = path.join(__dirname, '..', user.imageUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    user.imageUrl = imageUrl;
    await user.save();

    res.json({ success: true, message: 'Profile photo uploaded', imageUrl });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== REMOVE PROFILE PHOTO ====================
// DELETE /api/profile/photo
router.delete('/photo', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.imageUrl && user.imageUrl.includes('/uploads/profiles/')) {
      const oldPath = path.join(__dirname, '..', user.imageUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.imageUrl = '';
    await user.save();

    res.json({ success: true, message: 'Profile photo removed' });
  } catch (error) {
    console.error('Error removing photo:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== UPDATE SKILLS ====================
// PUT /api/profile/skills
router.put('/skills', verifyToken, async (req, res) => {
  try {
    const { skills } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    profile.skills = skills || [];
    await profile.save();

    res.json({ success: true, message: 'Skills updated', skills: profile.skills });
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ==================== LEGACY ENDPOINTS FOR BACKWARD COMPATIBILITY ====================

// POST /api/profile (create/update entire profile)
router.post('/', verifyToken, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      profile = await Profile.findOneAndUpdate({ user: req.user._id }, { $set: req.body }, { new: true });
    } else {
      profile = new Profile({
        user: req.user._id,
        ...req.body,
      });
      await profile.save();
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/profile/project
router.post('/project', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.projects.unshift(req.body);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/profile/certification
router.post('/certification', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.certifications.unshift(req.body);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/profile/goal
router.post('/goal', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    profile.goals.unshift(req.body);
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
