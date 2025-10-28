// routes/bulkMentorRoutes.js
const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { auth, adminOnly } = require('../middleware/auth');
const { sendEmailFast } = require('../config/mailHelper');
const router = express.Router();

// Admin-only bulk mentor creation endpoint
router.post('/bulk-create-mentors', auth, adminOnly, async (req, res) => {
  const { mentors } = req.body;

  console.log('\n👥 Bulk Mentor Creation Request');
  console.log(`Count: ${mentors?.length || 0} mentors`);

  try {
    if (!Array.isArray(mentors) || mentors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mentors array is required'
      });
    }

    const results = {
      created: [],
      failed: [],
      skipped: []
    };

    for (const mentorData of mentors) {
      try {
        const { 
          name, 
          email, 
          username, 
          password, 
          phoneNumber, 
          jobTitle, 
          companiesJoined, 
          experience, 
          imageUrl 
        } = mentorData;

        // Validate required fields
        if (!name || !email || !username || !password) {
          results.failed.push({
            email,
            reason: 'Missing required fields'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { email: email.toLowerCase() },
            { username }
          ]
        });

        if (existingUser) {
          results.skipped.push({
            email,
            username,
            reason: 'User already exists'
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create mentor user
        const mentor = new User({
          username,
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          phoneNumber,
          jobTitle,
          companiesJoined: companiesJoined || [],
          experience: experience || 1,
          imageUrl: imageUrl || '',
          role: 'Mentor',
          isVerified: true, // Auto-verify bulk created mentors
          isActive: true,
          newsletter: false,
          subscription: false
        });

        await mentor.save();

        // Try to send welcome email (non-blocking)
        try {
          const welcomeEmail = {
            subject: '🎉 Welcome to Skill-Pilot as a Mentor!',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
                  .credentials { background: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
                  .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎓 Welcome to Skill-Pilot!</h1>
                    <p>You've been registered as a Mentor</p>
                  </div>
                  <div class="content">
                    <h2>Hello ${name}! 👋</h2>
                    <p>Your mentor account has been successfully created. You can now start helping students on their career journey!</p>
                    
                    <div class="credentials">
                      <h3>Your Login Credentials:</h3>
                      <p><strong>Username:</strong> ${username}</p>
                      <p><strong>Email:</strong> ${email}</p>
                      <p><strong>Password:</strong> ${password}</p>
                      <p><strong>Role:</strong> Mentor</p>
                    </div>
                    
                    <p><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
                    
                    <p>Your profile includes:</p>
                    <ul>
                      <li>Job Title: ${jobTitle || 'Not specified'}</li>
                      <li>Experience: ${experience || 'Not specified'} years</li>
                      <li>Companies: ${companiesJoined?.join(', ') || 'None listed'}</li>
                    </ul>
                    
                    <div style="text-align: center;">
                      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login Now</a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>© 2025 Skill-Pilot. All rights reserved.</p>
                    <p>If you have questions, contact support@skill-pilot.com</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `Welcome to Skill-Pilot!\n\nYour mentor account has been created.\n\nUsername: ${username}\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password.`
          };

          await sendEmailFast(email, welcomeEmail);
          
          results.created.push({
            id: mentor._id,
            name,
            email,
            username,
            emailSent: true
          });
        } catch (emailError) {
          console.error(`Email failed for ${email}:`, emailError.message);
          results.created.push({
            id: mentor._id,
            name,
            email,
            username,
            emailSent: false,
            emailError: emailError.message
          });
        }

        console.log(`✅ Created: ${username} (${email})`);

      } catch (error) {
        console.error(`Error creating mentor:`, error.message);
        results.failed.push({
          email: mentorData.email,
          username: mentorData.username,
          reason: error.message
        });
      }
    }

    console.log(`\n📊 Results: ${results.created.length} created, ${results.skipped.length} skipped, ${results.failed.length} failed`);

    res.status(201).json({
      success: true,
      message: `Bulk mentor creation completed`,
      summary: {
        total: mentors.length,
        created: results.created.length,
        skipped: results.skipped.length,
        failed: results.failed.length
      },
      results
    });

  } catch (error) {
    console.error('❌ Bulk mentor creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk creation',
      error: error.message
    });
  }
});

// Get all mentors (Admin only)
router.get('/mentors', auth, adminOnly, async (req, res) => {
  try {
    const { verified, active, page = 1, limit = 20 } = req.query;

    const query = { role: 'Mentor' };
    
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (active !== undefined) query.isActive = active === 'true';

    const mentors = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      mentors,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalMentors: count
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Verify specific mentor (Admin only)
router.post('/verify-mentor/:mentorId', auth, adminOnly, async (req, res) => {
  try {
    const { mentorId } = req.params;

    const mentor = await User.findById(mentorId);

    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    if (mentor.role !== 'Mentor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a mentor'
      });
    }

    mentor.isVerified = true;
    mentor.isActive = true;
    await mentor.save();

    console.log(`✅ Mentor verified: ${mentor.email}`);

    res.json({
      success: true,
      message: 'Mentor verified successfully',
      mentor: {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        username: mentor.username,
        isVerified: mentor.isVerified
      }
    });
  } catch (error) {
    console.error('Error verifying mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Bulk verify mentors (Admin only)
router.post('/bulk-verify-mentors', auth, adminOnly, async (req, res) => {
  try {
    const { mentorIds } = req.body;

    if (!Array.isArray(mentorIds) || mentorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'mentorIds array is required'
      });
    }

    const result = await User.updateMany(
      { 
        _id: { $in: mentorIds },
        role: 'Mentor'
      },
      { 
        $set: { 
          isVerified: true,
          isActive: true 
        } 
      }
    );

    console.log(`✅ Bulk verified ${result.modifiedCount} mentors`);

    res.json({
      success: true,
      message: `Successfully verified ${result.modifiedCount} mentors`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk verifying mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Auto-verify all unverified mentors (Admin only)
router.post('/auto-verify-all-mentors', auth, adminOnly, async (req, res) => {
  try {
    const result = await User.updateMany(
      {
        role: 'Mentor',
        $or: [
          { isVerified: { $exists: false } },
          { isVerified: false }
        ]
      },
      { 
        $set: { 
          isVerified: true,
          isActive: true 
        } 
      }
    );

    console.log(`✅ Auto-verified all mentors: ${result.modifiedCount}`);

    res.json({
      success: true,
      message: `Successfully verified ${result.modifiedCount} mentors`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error auto-verifying mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;