// controllers/announcementController.js - Announcement management

const Announcement = require('../models/Announcement');
const User = require('../models/User');
const pushService = require('../services/pushNotificationService');
const { sendEmailFast } = require('../config/mailHelper');
const { marked } = require('marked');

// ==========================================
// ADMIN ANNOUNCEMENT ENDPOINTS
// ==========================================

/**
 * Create a new announcement
 * POST /api/announcements
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      subject,
      description,
      shortDescription,
      type,
      recipientType,
      recipientIds,
      targetRoles,
      channels,
      emailSettings,
      scheduledAt,
      sendNow,
    } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const announcement = new Announcement({
      subject,
      description,
      shortDescription,
      type: type || 'general',
      recipientType: recipientType || 'all',
      recipientIds: recipientIds || [],
      targetRoles: targetRoles || [],
      channels: channels || { push: true, email: false, inApp: true },
      emailSettings: emailSettings || {},
      scheduledAt,
      createdBy: req.user._id,
      status: 'draft',
    });

    await announcement.save();

    // If sendNow is true, send immediately
    if (sendNow) {
      await sendAnnouncementInternal(announcement);
    }

    res.status(201).json({
      success: true,
      message: sendNow ? 'Announcement created and sent' : 'Announcement created as draft',
      announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

/**
 * Get all announcements (admin)
 * GET /api/announcements
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .select('-deliveryLog'),
      Announcement.countDocuments(query),
    ]);

    res.json({
      announcements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

/**
 * Get single announcement
 * GET /api/announcements/:id
 */
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('recipientIds', 'name email role');

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ announcement });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
};

/**
 * Update announcement (only drafts)
 * PUT /api/announcements/:id
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft announcements can be edited' });
    }

    const allowedUpdates = [
      'subject',
      'description',
      'shortDescription',
      'type',
      'recipientType',
      'recipientIds',
      'targetRoles',
      'channels',
      'emailSettings',
      'scheduledAt',
    ];

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        announcement[key] = req.body[key];
      }
    }

    await announcement.save();

    res.json({
      success: true,
      message: 'Announcement updated',
      announcement,
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Announcement deleted',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

/**
 * Send announcement to recipients
 * POST /api/announcements/:id/send
 */
exports.sendAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status === 'sent') {
      return res.status(400).json({ error: 'Announcement already sent' });
    }

    await sendAnnouncementInternal(announcement);

    res.json({
      success: true,
      message: 'Announcement sent successfully',
      stats: announcement.stats,
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
};

/**
 * Test notification (send to admin only)
 * POST /api/announcements/test
 */
exports.testNotification = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id);

    if (!admin.pushToken) {
      return res.status(400).json({
        error: 'No push token registered. Please enable notifications in the mobile app first.',
      });
    }

    const result = await pushService.sendTestNotification(admin.pushToken);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test notification sent to your device',
        ticket: result.ticket,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
};

/**
 * Get recipient count preview
 * POST /api/announcements/preview-recipients
 */
exports.previewRecipients = async (req, res) => {
  try {
    const { recipientType, recipientIds, targetRoles } = req.body;

    // Create temporary announcement to get users
    const tempAnnouncement = new Announcement({
      subject: 'temp',
      description: 'temp',
      recipientType,
      recipientIds,
      targetRoles,
      createdBy: req.user._id,
    });

    const users = await tempAnnouncement.getTargetUsers();

    // Count by role
    const roleBreakdown = {};
    let withPushToken = 0;

    for (const user of users) {
      roleBreakdown[user.role] = (roleBreakdown[user.role] || 0) + 1;
      if (user.pushToken) withPushToken++;
    }

    res.json({
      totalRecipients: users.length,
      withPushToken,
      roleBreakdown,
      sampleUsers: users.slice(0, 10).map(u => ({ name: u.name, email: u.email, role: u.role })),
    });
  } catch (error) {
    console.error('Error previewing recipients:', error);
    res.status(500).json({ error: 'Failed to preview recipients' });
  }
};

/**
 * Get announcements for current user
 * GET /api/announcements/my
 */
exports.getMyAnnouncements = async (req, res) => {
  try {
    // Defensive check for req.user
    if (!req.user || !req.user._id) {
      console.error('getMyAnnouncements: req.user is undefined or missing _id');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user._id;
    const userRole = req.user.role || 'User';
    const userIdStr = userId.toString();

    // Only show announcements from the last 5 days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    console.log(`getMyAnnouncements: Fetching for user ${userIdStr} with role ${userRole}`);

    // Query announcements with deliveryLog included for read status calculation
    const announcements = await Announcement.find({
      status: 'sent',
      sentAt: { $gte: fiveDaysAgo }, // Only announcements from last 5 days
      $or: [
        { recipientType: 'all' },
        { recipientType: userRole.toLowerCase() + 's' },
        { recipientIds: userId },
        { targetRoles: userRole },
      ],
    })
      .sort({ sentAt: -1 })
      .limit(50);

    console.log(`getMyAnnouncements: Found ${announcements.length} announcements`);

    // Mark read status for each and exclude deliveryLog from response
    const announcementsWithStatus = announcements.map(ann => {
      const log = ann.deliveryLog?.find(l => l.userId?.toString() === userIdStr);
      const annObj = ann.toObject();
      delete annObj.deliveryLog; // Remove deliveryLog from response
      return {
        ...annObj,
        isRead: !!log?.readAt,
        readAt: log?.readAt,
      };
    });

    res.json({ announcements: announcementsWithStatus });
  } catch (error) {
    console.error('Error fetching user announcements:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch announcements', details: error.message });
  }
};

/**
 * Mark announcement as read
 * POST /api/announcements/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await announcement.markAsRead(req.user._id);

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

/**
 * Mark all announcements as read
 * POST /api/announcements/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userIdStr = req.user._id.toString();
    const userRole = req.user.role || 'User';

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const announcements = await Announcement.find({
      status: 'sent',
      sentAt: { $gte: fiveDaysAgo },
      $or: [
        { recipientType: 'all' },
        { recipientType: userRole.toLowerCase() + 's' },
        { recipientIds: req.user._id },
        { targetRoles: userRole },
      ],
    });

    let markCount = 0;

    for (const ann of announcements) {
      const existingLog = ann.deliveryLog.find(l => l.userId?.toString() === userIdStr);
      if (existingLog) {
        if (!existingLog.readAt) {
          existingLog.readAt = new Date();
          ann.stats.read = (ann.stats.read || 0) + 1;
          await ann.save();
          markCount++;
        }
      } else {
        ann.deliveryLog.push({
          userId: req.user._id,
          readAt: new Date(),
        });
        ann.stats.read = (ann.stats.read || 0) + 1;
        await ann.save();
        markCount++;
      }
    }

    res.json({ success: true, message: `Marked ${markCount} announcements as read` });
  } catch (error) {
    console.error('Error marking all as read:', error.message);
    res.status(500).json({ error: 'Failed to mark all as read', details: error.message });
  }
};

/**
 * Get unread count
 * GET /api/announcements/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    // Defensive check for req.user
    if (!req.user || !req.user._id) {
      console.error('getUnreadCount: req.user is undefined or missing _id');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const count = await Announcement.getUnreadCount(req.user._id, req.user.role || 'User');
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error getting unread count:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to get unread count', details: error.message });
  }
};

/**
 * Register push token
 * POST /api/announcements/register-token
 */
exports.registerPushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    if (!pushService.isValidPushToken(pushToken)) {
      return res.status(400).json({ error: 'Invalid push token format' });
    }

    await User.findByIdAndUpdate(req.user._id, { pushToken });

    res.json({ success: true, message: 'Push token registered' });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
};

// ==========================================
// INTERNAL FUNCTIONS
// ==========================================

/**
 * Internal function to send announcement
 */
async function sendAnnouncementInternal(announcement) {
  try {
    announcement.status = 'sending';
    await announcement.save();

    const users = await announcement.getTargetUsers();
    announcement.stats.totalRecipients = users.length;

    // Send push notifications if enabled
    if (announcement.channels.push) {
      const pushResult = await pushService.sendBulkPushNotifications(
        users,
        announcement.subject,
        announcement.shortDescription || announcement.description.substring(0, 150),
        {
          announcementId: announcement._id.toString(),
          type: announcement.type,
        }
      );

      announcement.stats.pushSent = pushResult.sent;
      announcement.stats.pushFailed = pushResult.failed;

      // Update delivery log
      for (const result of pushResult.results) {
        const existingLog = announcement.deliveryLog.find(
          l => l.userId?.toString() === result.userId?.toString()
        );

        if (existingLog) {
          existingLog.pushSent = result.success;
          existingLog.pushSentAt = new Date();
        } else {
          announcement.deliveryLog.push({
            userId: result.userId,
            pushSent: result.success,
            pushSentAt: new Date(),
          });
        }
      }
    }

    // Send emails if enabled
    if (announcement.channels.email) {
      let emailsSent = 0;
      let emailsFailed = 0;

      for (const user of users) {
        if (user.email) {
          try {
            // Convert markdown to HTML if needed
            let htmlContent = announcement.description;
            if (announcement.emailSettings?.isMarkdown) {
              htmlContent = marked(announcement.description);
            }

            await sendEmailFast({
              to: user.email,
              subject: announcement.subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); padding: 20px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0;">${announcement.subject}</h1>
                  </div>
                  <div style="padding: 20px; background: #f9fafb; border-radius: 0 0 12px 12px;">
                    ${htmlContent}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                      This announcement was sent to you from SkillPilot.
                    </p>
                  </div>
                </div>
              `,
              text: announcement.description,
            });

            emailsSent++;

            // Update delivery log
            const existingLog = announcement.deliveryLog.find(
              l => l.userId?.toString() === user._id?.toString()
            );

            if (existingLog) {
              existingLog.emailSent = true;
              existingLog.emailSentAt = new Date();
            } else {
              announcement.deliveryLog.push({
                userId: user._id,
                emailSent: true,
                emailSentAt: new Date(),
              });
            }
          } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
            emailsFailed++;
          }
        }
      }

      announcement.stats.emailSent = emailsSent;
      announcement.stats.emailFailed = emailsFailed;
    }

    announcement.status = 'sent';
    announcement.sentAt = new Date();
    await announcement.save();

    console.log(`Announcement ${announcement.announcementId} sent:`, announcement.stats);
    return announcement;
  } catch (error) {
    console.error('Error in sendAnnouncementInternal:', error);
    announcement.status = 'failed';
    await announcement.save();
    throw error;
  }
}

module.exports = exports;
