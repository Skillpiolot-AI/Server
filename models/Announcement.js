// models/Announcement.js - Announcement model for notifications

const mongoose = require('mongoose');
const crypto = require('crypto');

const AnnouncementSchema = new mongoose.Schema({
    // Unique announcement ID
    announcementId: {
        type: String,
        unique: true,
        default: function () {
            return 'ANN-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        },
    },

    // Subject/Title
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },

    // Description (plain text or markdown for email)
    description: {
        type: String,
        required: true,
        maxlength: 5000,
    },

    // Short description for push notifications
    shortDescription: {
        type: String,
        maxlength: 200,
    },

    // Announcement type
    type: {
        type: String,
        enum: ['general', 'important', 'urgent', 'update', 'event'],
        default: 'general',
    },

    // Recipient targeting
    recipientType: {
        type: String,
        enum: ['all', 'mentors', 'users', 'college', 'specific'],
        required: true,
        default: 'all',
    },

    // Specific recipient IDs (when recipientType is 'specific')
    recipientIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    // Role filter (can target multiple roles)
    targetRoles: [{
        type: String,
        enum: ['User', 'Mentor', 'Admin', 'College'],
    }],

    // Delivery channels
    channels: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
        inApp: { type: Boolean, default: true },
    },

    // Email specific settings
    emailSettings: {
        isMarkdown: { type: Boolean, default: false },
        previewText: { type: String, maxlength: 150 },
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
        default: 'draft',
        index: true,
    },

    // Scheduling
    scheduledAt: {
        type: Date,
    },

    sentAt: {
        type: Date,
    },

    // Delivery stats
    stats: {
        totalRecipients: { type: Number, default: 0 },
        pushSent: { type: Number, default: 0 },
        pushFailed: { type: Number, default: 0 },
        emailSent: { type: Number, default: 0 },
        emailFailed: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
    },

    // Track which users received/read
    deliveryLog: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        pushSent: { type: Boolean, default: false },
        pushSentAt: Date,
        emailSent: { type: Boolean, default: false },
        emailSentAt: Date,
        readAt: Date,
    }],

    // Created by (admin)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes
AnnouncementSchema.index({ status: 1, createdAt: -1 });
AnnouncementSchema.index({ recipientType: 1 });
AnnouncementSchema.index({ scheduledAt: 1, status: 1 });

// Pre-save
AnnouncementSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Generate short description from description if not provided
    if (!this.shortDescription && this.description) {
        this.shortDescription = this.description.substring(0, 150) + (this.description.length > 150 ? '...' : '');
    }

    next();
});

// Method: Get target users based on recipientType
AnnouncementSchema.methods.getTargetUsers = async function () {
    const User = require('./User');

    let query = { isActive: { $ne: false } };

    switch (this.recipientType) {
        case 'all':
            // All active users
            break;
        case 'mentors':
            query.role = 'Mentor';
            break;
        case 'users':
            query.role = 'User';
            break;
        case 'college':
            query.role = 'College';
            break;
        case 'specific':
            if (this.recipientIds && this.recipientIds.length > 0) {
                query._id = { $in: this.recipientIds };
            } else {
                return [];
            }
            break;
        default:
            break;
    }

    // Apply role filter if specified
    if (this.targetRoles && this.targetRoles.length > 0) {
        query.role = { $in: this.targetRoles };
    }

    return User.find(query).select('_id name email role pushToken');
};

// Method: Mark as read by user
AnnouncementSchema.methods.markAsRead = async function (userId) {
    const existingLog = this.deliveryLog.find(log => log.userId?.toString() === userId.toString());

    if (existingLog && !existingLog.readAt) {
        existingLog.readAt = new Date();
        this.stats.read = (this.stats.read || 0) + 1;
        await this.save();
        return true;
    }

    return false;
};

// Static: Get announcements for a user
AnnouncementSchema.statics.getForUser = async function (userId, userRole) {
    return this.find({
        status: 'sent',
        $or: [
            { recipientType: 'all' },
            { recipientType: userRole.toLowerCase() + 's' }, // 'mentors', 'users'
            { recipientIds: userId },
            { targetRoles: userRole },
        ],
    })
        .sort({ sentAt: -1 })
        .limit(50)
        .select('-deliveryLog');
};

// Static: Get unread count for user
AnnouncementSchema.statics.getUnreadCount = async function (userId, userRole) {
    const announcements = await this.getForUser(userId, userRole);
    let unreadCount = 0;

    for (const ann of announcements) {
        const log = ann.deliveryLog?.find(l => l.userId?.toString() === userId.toString());
        if (!log?.readAt) unreadCount++;
    }

    return unreadCount;
};

module.exports = mongoose.model('Announcement', AnnouncementSchema);
