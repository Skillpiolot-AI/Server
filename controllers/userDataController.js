// controllers/userDataController.js - Enhanced with automatic email notifications
const User = require('../models/User');
const Student = require('../models/Student');
const UserActivity = require('../models/UserActivity');
const StudentActivity = require('../models/StudentActivity');
const EmailVerification = require('../models/EmailVerification');
const bcrypt = require('bcryptjs');
const { sendEmailFast } = require('../config/mailHelper');
const emailTemplates = require('../config/emailTemplates');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ==================== HELPER: SEND EMAIL WITH ERROR HANDLING ====================
const sendEmailSafely = async (email, template, logMessage) => {
  try {
    await sendEmailFast(email, template);
    console.log(`✅ ${logMessage} sent to:`, email);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send ${logMessage}:`, error.message);
    return false;
  }
};

// ==================== GET ALL USERS ====================
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isVerified, 
      isActive,
      isSuspended,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isSuspended !== undefined) query.isSuspended = isSuspended === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const users = await User.find(query)
      .select('-password -passwordHistory')
      .populate('universityId', 'name url location')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await User.countDocuments(query);

    const stats = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ isActive: true }),
      verified: await User.countDocuments({ isVerified: true }),
      suspended: await User.countDocuments({ isSuspended: true }),
      byRole: await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    };

    res.json({
      success: true,
      users,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

// ==================== GET USER BY ID ====================
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .populate('universityId', 'name url location isActive')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let studentProfile = null;
    if (user.role === 'Student') {
      studentProfile = await Student.findOne({ userId: user._id }).lean();
    }

    const recentActivities = await UserActivity.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      user,
      studentProfile,
      recentActivities
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// ==================== UPDATE USER (Enhanced with Email Notifications) ====================
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Get original user data before update
    const originalUser = await User.findById(userId);
    
    if (!originalUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow password update through this endpoint
    delete updateData.password;
    delete updateData.passwordHistory;

    // Track what changed for email notifications
    const changes = {
      roleChanged: updateData.role && updateData.role !== originalUser.role,
      oldRole: originalUser.role,
      newRole: updateData.role,
      verificationChanged: updateData.isVerified !== undefined && updateData.isVerified !== originalUser.isVerified,
      wasUnverified: !originalUser.isVerified && updateData.isVerified === false,
      wasReVerified: !originalUser.isVerified && updateData.isVerified === true,
      statusChanged: updateData.isActive !== undefined && updateData.isActive !== originalUser.isActive,
      wasDeactivated: originalUser.isActive && updateData.isActive === false,
      wasReactivated: !originalUser.isActive && updateData.isActive === true
    };

    // Validate email if being updated
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      const existingUser = await User.findOne({ 
        email: updateData.email.toLowerCase(),
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered to another user'
        });
      }

      updateData.email = updateData.email.toLowerCase();
    }

    // Validate username if being updated
    if (updateData.username) {
      const existingUser = await User.findOne({ 
        username: updateData.username,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken by another user'
        });
      }
    }

    // Validate role if being updated
    if (updateData.role) {
      const validRoles = ['User', 'Mentor', 'Admin', 'UniAdmin', 'UniTeach', 'Student'];
      if (!validRoles.includes(updateData.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -passwordHistory');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ==================== SEND EMAIL NOTIFICATIONS ====================
    
    // 1. Role Changed Email
    if (changes.roleChanged) {
      await sendEmailSafely(
        updatedUser.email,
        emailTemplates.roleChangedEmail(
          updatedUser.name,
          changes.oldRole,
          changes.newRole
        ),
        'Role changed notification'
      );
    }

    // 2. Account Unverified - Send Verification Email
    if (changes.wasUnverified) {
      // Delete old verification tokens
      await EmailVerification.deleteMany({ 
        userId: updatedUser._id, 
        isVerified: false 
      });

      // Create new verification token
      const verification = await EmailVerification.createVerificationToken(
        updatedUser._id,
        updatedUser.email,
        req.ip || '127.0.0.1',
        req.get('User-Agent') || 'Admin Panel'
      );

      const verificationLink = `${FRONTEND_URL}/verify-email?token=${verification.token}`;

      await sendEmailSafely(
        updatedUser.email,
        emailTemplates.accountUnverifiedEmail(
          updatedUser.name,
          updatedUser.username,
          verificationLink
        ),
        'Account unverified notification'
      );
    }

    // 3. Account Deactivated Email
    if (changes.wasDeactivated) {
      await sendEmailSafely(
        updatedUser.email,
        emailTemplates.accountDeactivatedEmail(
          updatedUser.name,
          updateData.deactivationReason || null
        ),
        'Account deactivated notification'
      );
    }

    // 4. Account Reactivated Email
    if (changes.wasReactivated) {
      await sendEmailSafely(
        updatedUser.email,
        emailTemplates.accountReactivatedEmail(updatedUser.name),
        'Account reactivated notification'
      );
    }

    // Log activity
    await UserActivity.create({
      userId: req.user._id,
      sessionId: req.sessionID || 'admin-panel',
      activityType: 'user_updated',
      details: {
        updatedUserId: userId,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user.name,
        updateTime: new Date(),
        changes: changes
      },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
      emailsSent: {
        roleChanged: changes.roleChanged,
        verificationSent: changes.wasUnverified,
        deactivationSent: changes.wasDeactivated,
        reactivationSent: changes.wasReactivated
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

// ==================== DELETE USER (Enhanced with Email Notification) ====================
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body; // Optional deletion reason

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store user data for email
    const userData = {
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role
    };

    // Send deletion notification email BEFORE deleting
    await sendEmailSafely(
      userData.email,
      emailTemplates.accountDeletedEmail(userData.name, reason),
      'Account deletion notification'
    );

    // Delete associated student profile if exists
    if (user.role === 'Student') {
      await Student.deleteOne({ userId: user._id });
    }

    // Delete user activities
    await UserActivity.deleteMany({ userId: user._id });

    // Delete user
    await User.findByIdAndDelete(userId);

    // Log activity
    await UserActivity.create({
      userId: req.user._id,
      sessionId: req.sessionID || 'admin-panel',
      activityType: 'user_deleted',
      details: {
        deletedUserId: userId,
        deletedUserEmail: userData.email,
        deletedUserName: userData.name,
        deletedUserRole: userData.role,
        deletedBy: req.user.name,
        deleteTime: new Date(),
        reason: reason || 'No reason provided'
      },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.json({
      success: true,
      message: `User ${userData.name} deleted successfully`,
      emailSent: true
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting user',
      error: error.message
    });
  }
};

// ==================== BULK DELETE USERS ====================
exports.bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds, reason } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required'
      });
    }

    if (userIds.includes(req.user._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const usersToDelete = await User.find({ _id: { $in: userIds } });

    // Send deletion emails to all users
    const emailPromises = usersToDelete.map(user => 
      sendEmailSafely(
        user.email,
        emailTemplates.accountDeletedEmail(user.name, reason),
        `Bulk deletion notification for ${user.email}`
      )
    );

    await Promise.allSettled(emailPromises);

    // Delete student profiles
    await Student.deleteMany({ userId: { $in: userIds } });

    // Delete user activities
    await UserActivity.deleteMany({ userId: { $in: userIds } });

    // Delete users
    const result = await User.deleteMany({ _id: { $in: userIds } });

    // Log activity
    await UserActivity.create({
      userId: req.user._id,
      sessionId: req.sessionID || 'admin-panel',
      activityType: 'bulk_user_delete',
      details: {
        deletedCount: result.deletedCount,
        deletedUsers: usersToDelete.map(u => ({ id: u._id, email: u.email, name: u.name })),
        deletedBy: req.user.name,
        deleteTime: new Date(),
        reason: reason || 'No reason provided'
      },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount,
      emailsSent: usersToDelete.length
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting users',
      error: error.message
    });
  }
};

// ==================== TOGGLE USER STATUS ====================
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isActive } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send appropriate email
    if (!isActive) {
      // Deactivated
      await sendEmailSafely(
        user.email,
        emailTemplates.accountDeactivatedEmail(user.name, reason),
        'Account deactivation notification'
      );
    } else {
      // Reactivated
      await sendEmailSafely(
        user.email,
        emailTemplates.accountReactivatedEmail(user.name),
        'Account reactivation notification'
      );
    }

    // Log activity
    await UserActivity.create({
      userId: req.user._id,
      sessionId: req.sessionID || 'admin-panel',
      activityType: isActive ? 'user_activated' : 'user_deactivated',
      details: {
        targetUserId: userId,
        targetUserEmail: user.email,
        newStatus: isActive,
        changedBy: req.user.name,
        changeTime: new Date(),
        reason: reason || 'No reason provided'
      },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user,
      emailSent: true
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating user status',
      error: error.message
    });
  }
};

// ==================== RESET USER PASSWORD ====================
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, sendEmail = true } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.temporaryPassword = true;
    user.mustChangePassword = true;
    await user.save();

    // Send email notification if requested
    if (sendEmail) {
      try {
        const passwordResetTemplate = {
          subject: `🔐 Password Reset by Administrator - ${process.env.COMPANY_NAME || 'Skill-Pilot'}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                .password-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
                .password { font-size: 24px; color: #d9534f; font-weight: bold; font-family: monospace; letter-spacing: 2px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Password Reset</h1>
                  <p>Administrator Action</p>
                </div>
                <div class="content">
                  <p>Hello <strong>${user.name}</strong>,</p>
                  <p>An administrator has reset your password. You can now login with the following temporary password:</p>
                  
                  <div class="password-box">
                    <p style="margin: 0 0 10px 0; color: #666;">Your Temporary Password:</p>
                    <div class="password">${newPassword}</div>
                  </div>
                  
                  <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong><br>
                    You MUST change this temporary password immediately after logging in. This is required for security purposes.
                  </div>
                  
                  <p style="margin-top: 20px;">Login at: <a href="${FRONTEND_URL}/login">${FRONTEND_URL}/login</a></p>
                  
                  <p style="margin-top: 30px;">Best regards,<br><strong>Skill-Pilot Team</strong></p>
                </div>
                <div class="footer">
                  <p>&copy; 2025 Skill-Pilot Career Guidance. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `Hello ${user.name},\n\nYour password has been reset by an administrator.\n\nTemporary Password: ${newPassword}\n\nYou must change this password after logging in.\n\nLogin at: ${FRONTEND_URL}/login\n\nBest regards,\nSkill-Pilot Team`
        };

        await sendEmailFast(user.email, passwordResetTemplate);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

    // Log activity
    await UserActivity.create({
      userId: req.user._id,
      sessionId: req.sessionID || 'admin-panel',
      activityType: 'password_reset_by_admin',
      details: {
        targetUserId: userId,
        targetUserEmail: user.email,
        emailSent: sendEmail,
        resetBy: req.user.name,
        resetTime: new Date()
      },
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.json({
      success: true,
      message: `Password reset successfully${sendEmail ? '. Email sent to user.' : ''}`,
      temporaryPassword: newPassword,
      emailSent: sendEmail
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while resetting password',
      error: error.message
    });
  }
};

// ==================== GET USER STATISTICS ====================
exports.getUserStatistics = async (req, res) => {
  try {
    const stats = {
      overview: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ isActive: true }),
        inactive: await User.countDocuments({ isActive: false }),
        verified: await User.countDocuments({ isVerified: true }),
        unverified: await User.countDocuments({ isVerified: false }),
        suspended: await User.countDocuments({ isSuspended: true }),
        tempPassword: await User.countDocuments({ temporaryPassword: true })
      },
      byRole: await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            }
          }
        }
      ]),
      recentUsers: await User.find()
        .select('name email role createdAt isActive isVerified')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      monthlyGrowth: await User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ])
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
};

module.exports = exports;