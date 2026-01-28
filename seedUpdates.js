/**
 * Seed Script: Populate Platform Updates/Features into Database
 * Run: node seedUpdates.js
 */

const mongoose = require('mongoose');
const Update = require('./models/Update');
const User = require('./models/User');

// Database connection
const MONGO_URL =
  'mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0';

// All platform features organized by priority and type
const platformUpdates = [
  // ==================== PRIORITY 1: CORE FEATURES ====================
  {
    title: 'User Authentication System',
    description:
      'Complete authentication system with JWT tokens, Google OAuth 2.0 integration, email verification, OTP-based secure login, password reset flows, and session management with activity logging.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/login',
    issueDescription: '',
    version: '2.0.0',
    priority: 'Critical',
    updateType: 'Feature',
  },
  {
    title: 'AI-Powered Career Chatbot',
    description:
      'Context-aware AI chatbot powered by Gemini API for personalized career guidance. Available globally across all pages with conversation history and intelligent responses.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/',
    issueDescription: '',
    version: '1.5.0',
    priority: 'Critical',
    updateType: 'Feature',
  },
  {
    title: 'Mentorship Booking System',
    description:
      'Complete mentorship platform with mentor discovery, profile viewing, session booking with date/time selection, Jitsi video call integration, automated email reminders, and post-session ratings.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentorship',
    issueDescription: '',
    version: '2.0.0',
    priority: 'Critical',
    updateType: 'Feature',
  },
  {
    title: 'Psychometric Career Assessment',
    description:
      'Comprehensive assessment module with adaptive quizzes evaluating interests, strengths, and skills. Provides personalized career recommendations based on assessment results.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/assessment',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Critical',
    updateType: 'Feature',
  },
  {
    title: 'AI Career Recommendations Engine',
    description:
      'Machine learning-powered career recommendation system that analyzes user assessments, interests, and strengths to suggest personalized career paths and job titles.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/recommendation',
    issueDescription: '',
    version: '1.5.0',
    priority: 'Critical',
    updateType: 'Feature',
  },

  // ==================== PRIORITY 2: ADMIN FEATURES ====================
  {
    title: 'Admin Analytics Dashboard',
    description:
      'Comprehensive analytics dashboard with user activity metrics, engagement statistics, booking trends, and platform usage reports with visual charts and graphs.',
    allowedRoles: ['Admin'],
    redirectUrl: '/analytics',
    issueDescription: '',
    version: '1.0.0',
    priority: 'High',
    updateType: 'Feature',
  },
  {
    title: 'User Management Dashboard',
    description:
      'Advanced user management interface with search, filter, role management, user activity viewing, account status control, and bulk operations for administrators.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/userData',
    issueDescription: '',
    version: '1.0.0',
    priority: 'High',
    updateType: 'Feature',
  },
  {
    title: 'Mentor Application Workflow',
    description:
      'Complete mentor application system with multi-step form, document upload, admin review interface, approval/rejection with email notifications, and application tracking.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/application',
    issueDescription: '',
    version: '1.5.0',
    priority: 'High',
    updateType: 'Feature',
  },
  {
    title: 'Live Server Logs with WebSocket',
    description:
      'Real-time server monitoring dashboard with WebSocket streaming for live log viewing. Filter by log level, search functionality, and auto-refresh capabilities.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription: '',
    version: '1.0.0',
    priority: 'High',
    updateType: 'Feature',
  },
  {
    title: 'System Announcements Manager',
    description:
      'Role-based announcement system allowing admins to create and manage platform-wide announcements with priority levels, scheduling, and targeted audience selection.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/announcements',
    issueDescription: '',
    version: '1.0.0',
    priority: 'High',
    updateType: 'Feature',
  },
  {
    title: 'Mentor Profile Review System',
    description:
      'Admin interface to review, verify, and approve mentor profiles. Includes detailed profile viewing, verification status management, and feedback capabilities.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/profile-reviews',
    issueDescription: '',
    version: '1.0.0',
    priority: 'High',
    updateType: 'Feature',
  },

  // ==================== PRIORITY 3: EDUCATIONAL CONTENT ====================
  {
    title: 'Video Learning Library',
    description:
      'Educational video content management system with video upload, categorization, search functionality, and playback tracking for career-related educational content.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/learnlist',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Resource Library (Books & PDFs)',
    description:
      'Digital resource library for career development materials including books, PDFs, and downloadable guides organized by category with search functionality.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/view-books',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Workshops Management System',
    description:
      'Workshop listing and management platform with scheduling, enrollment, capacity tracking, and automated notifications for upcoming sessions.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/workshops',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Interactive Career Roadmaps',
    description:
      'Visual career path roadmaps for 10+ technology disciplines including Frontend Development, Data Science, and more. Interactive navigation with skill progression tracking.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/careerPaths',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },

  // ==================== PRIORITY 4: USER EXPERIENCE ====================
  {
    title: 'User Profile Management',
    description:
      'Comprehensive profile management with personal information editing, avatar upload, preference settings, and activity history viewing.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/profile',
    issueDescription: '',
    version: '1.5.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Mentor Dashboard',
    description:
      'Dedicated mentor dashboard for managing sessions, setting availability, viewing bookings, tracking earnings, and accessing mentor-specific analytics.',
    allowedRoles: ['Mentor', 'Admin'],
    redirectUrl: '/mentorDashboard',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'My Bookings Management',
    description:
      'User interface for viewing and managing session bookings including upcoming sessions, past sessions, cancellation options, and session details.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-bookings',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Session Rating & Feedback System',
    description:
      'Post-session rating system allowing users to rate mentors, provide feedback, and help maintain quality through mentor performance tracking.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/userFeedback',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Real-time Notifications System',
    description:
      'Comprehensive notification system with in-app notifications, email alerts for bookings, session reminders, and platform announcements.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/notifications',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Application Status Tracker',
    description:
      'Real-time tracking system for mentor applications with status updates, timeline view, and notification on status changes.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/tracker',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },

  // ==================== PRIORITY 5: COMMUNITY & ENGAGEMENT ====================
  {
    title: 'Community Forum',
    description:
      'Community platform for users to share posts, engage in discussions, ask questions, and connect with peers and mentors in the career guidance community.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/community',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'College Explorer',
    description:
      'College information directory with search functionality, detailed college profiles, program listings, and comparison features for educational planning.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/colleges',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Low',
    updateType: 'Feature',
  },
  {
    title: 'Career Quiz Game',
    description:
      'Gamified career discovery quiz with interactive questions, instant results, and fun approach to exploring career interests and aptitudes.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/careerquiz',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Low',
    updateType: 'Feature',
  },

  // ==================== PRIORITY 6: UNIVERSITY FEATURES ====================
  {
    title: 'University Admin Portal',
    description:
      'Dedicated portal for university administrators to manage student access, track engagement, view analytics, and configure institutional settings.',
    allowedRoles: ['Admin'],
    redirectUrl: '/uniAdminPortal',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Teacher Dashboard',
    description:
      'Dashboard for university teachers to monitor student progress, access mentorship tools, and manage assigned students within the platform.',
    allowedRoles: ['Admin'],
    redirectUrl: '/teacher/dashboard',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Medium',
    updateType: 'Feature',
  },
  {
    title: 'Bulk Mentor Operations',
    description:
      'Administrative tool for bulk mentor data operations including mass import, export, and batch updates for efficient mentor management.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/user-management',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Low',
    updateType: 'Feature',
  },

  // ==================== ENHANCEMENTS & OPTIMIZATIONS ====================
  {
    title: 'Performance Optimization',
    description:
      'Implemented lazy loading for all pages, GZIP compression, Helmet.js security headers, MongoDB data caching, and optimized API responses for faster load times.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/system-settings',
    issueDescription: '',
    version: '2.0.0',
    priority: 'High',
    updateType: 'Enhancement',
  },
  {
    title: 'Role-Based Access Control',
    description:
      'Comprehensive RBAC system with 5 user roles (User, Mentor, Admin, UniAdmin, Teacher) and protected routes ensuring secure access to platform features.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/user-management',
    issueDescription: '',
    version: '1.0.0',
    priority: 'Critical',
    updateType: 'Security',
  },
  {
    title: 'Responsive Mobile-First UI',
    description:
      'Fully responsive design with TailwindCSS, optimized for mobile, tablet, and desktop devices. Includes companion React Native mobile app.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/',
    issueDescription: '',
    version: '1.0.0',
    priority: 'High',
    updateType: 'UI/UX',
  },
];

// Main seed function
async function seedUpdates() {
  try {
    console.log('🚀 Starting database seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Find admin user (ujjwaljha744@gmail.com or Ujjwaljha_12)
    const adminUser = await User.findOne({
      $or: [{ email: 'ujjwaljha744@gmail.com' }, { username: 'Ujjwaljha_12' }, { role: 'Admin' }],
    });

    if (!adminUser) {
      console.log('❌ Admin user not found! Please provide a valid admin user ID.');
      console.log('   Looking for: ujjwaljha744@gmail.com or Ujjwaljha_12');
      process.exit(1);
    }

    console.log(
      `✅ Found admin user: ${adminUser.name || adminUser.username} (${adminUser.email})`
    );
    console.log(`   User ID: ${adminUser._id}\n`);

    // Check for existing updates
    const existingCount = await Update.countDocuments();
    console.log(`📊 Existing updates in database: ${existingCount}\n`);

    // Option to clear existing updates (comment out if you want to keep existing)
    if (existingCount > 0) {
      console.log('🗑️  Clearing existing updates...');
      await Update.deleteMany({});
      console.log('✅ Cleared existing updates\n');
    }

    // Insert updates with admin as creator
    console.log('📝 Inserting platform features/updates...\n');

    let inserted = 0;
    const errors = [];

    for (const update of platformUpdates) {
      try {
        const newUpdate = new Update({
          ...update,
          createdBy: adminUser._id,
          isActive: true,
        });
        await newUpdate.save();
        console.log(`   ✅ ${update.title}`);
        inserted++;
      } catch (err) {
        console.log(`   ❌ ${update.title}: ${err.message}`);
        errors.push({ title: update.title, error: err.message });
      }
    }

    console.log('\n========================================');
    console.log('📊 SEED SUMMARY');
    console.log('========================================');
    console.log(`✅ Successfully inserted: ${inserted} updates`);
    console.log(`❌ Failed: ${errors.length} updates`);
    console.log(`📁 Total in database: ${await Update.countDocuments()}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach(e => console.log(`   - ${e.title}: ${e.error}`));
    }

    console.log('\n🎉 Seeding complete! Visit /updates on your website to see the features.');
    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed
seedUpdates();
