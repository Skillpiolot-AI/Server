/**
 * Seed Script: Populate Platform Changelog from Git Commit History
 * Run: node seedUpdatesFromCommits.js
 *
 * This script clears all existing updates and re-populates them
 * with accurate changelog entries derived from the actual git commit history.
 * Entries are ordered newest-first, grouped by date, and accurately describe
 * what changed with correct severity/type classification.
 */

const mongoose = require('mongoose');
const Update = require('./models/Update');
const User = require('./models/User');

const MONGO_URL =
  'mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0';

/**
 * Changelog entries derived from git commit history.
 * Each entry maps to one or more meaningful commits.
 * Ordered newest-first.
 */
const commitChangelog = [
  // ── 2026-05-08 ──────────────────────────────────────────────────────────
  {
    title: 'Upcoming and Past Booking Filter Logic',
    description:
      'Added server-side filtering to the booking controller to separate upcoming and past sessions. Introduced query parameters for upcoming and past filtering with precise end-time comparison logic to correctly categorize completed sessions.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-bookings',
    issueDescription:
      'Upcoming bookings were not correctly excluded from the past bookings view when sessions had ended.',
    version: '2.3.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-05-08'),
  },
  {
    title: 'Database Verification Utility Scripts',
    description:
      'Added utility scripts for verifying booking sort order, user data consistency, and database state. These scripts help diagnose production data issues without impacting live data.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription: '',
    version: '2.3.0',
    priority: 'Low',
    updateType: 'Enhancement',
    createdAt: new Date('2026-05-08'),
  },

  // ── 2026-05-01 ──────────────────────────────────────────────────────────
  {
    title: 'Stripe Payment Tracking Integration',
    description:
      'Integrated Stripe payment session tracking into the booking flow. Payment routes now record transaction IDs and payment status against bookings. Added automated scripts for bulk mentor booking management.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/payment-history',
    issueDescription: '',
    version: '2.2.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-05-01'),
  },

  // ── 2026-04-14 ──────────────────────────────────────────────────────────
  {
    title: 'Mentor Handle Exposed in Profile Response',
    description:
      'The mentor profile API response now includes the mentor handle field, enabling frontend components to display and link mentor profiles using their unique handle identifier.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription:
      'Mentor handle was missing from the profile response object returned by the API.',
    version: '2.1.1',
    priority: 'Medium',
    updateType: 'Bug Fix',
    createdAt: new Date('2026-04-14'),
  },

  // ── 2026-04-08 ──────────────────────────────────────────────────────────
  {
    title: 'AI Proxy Routes for Gemini-Based Career Predictions',
    description:
      'Implemented a dedicated AI proxy controller and route layer that forwards requests to the Gemini API for content generation and career prediction tasks. Provides a consistent, authenticated interface for all AI features on the platform.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/recommendation',
    issueDescription: '',
    version: '2.1.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-04-08'),
  },
  {
    title: 'Precise Overlap Detection for Mentor Booking Slots',
    description:
      'Replaced the previous hourly slot availability check with an exact time-range overlap algorithm. Mentors can no longer be double-booked if two sessions overlap within the same hour window.',
    allowedRoles: ['Admin', 'Mentor'],
    redirectUrl: '/mentor-dashboard',
    issueDescription:
      'Hourly slot check was too coarse and allowed overlapping bookings in edge cases.',
    version: '2.1.0',
    priority: 'High',
    updateType: 'Bug Fix',
    createdAt: new Date('2026-04-08'),
  },

  // ── 2026-04-07 ──────────────────────────────────────────────────────────
  {
    title: 'Sub-Group Request System and Group Announcements',
    description:
      'Implemented a sub-group join request workflow allowing users to request membership in private sub-groups. Admins can accept or reject requests. Added group-level announcements that broadcast messages to all group members.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/community',
    issueDescription: '',
    version: '2.1.0',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2026-04-07'),
  },

  // ── 2026-04-03 ──────────────────────────────────────────────────────────
  {
    title: 'Load Testing Infrastructure and Baseline Results',
    description:
      'Added a shell-based load testing script targeting critical API endpoints. Captured baseline performance results documenting server response times and throughput under concurrent load, establishing a reference for future optimization.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription: '',
    version: '2.0.5',
    priority: 'Medium',
    updateType: 'Enhancement',
    createdAt: new Date('2026-04-03'),
  },

  // ── 2026-03-27 ──────────────────────────────────────────────────────────
  {
    title: 'Community Group Posts, Comments, and Sub-Groups',
    description:
      'Introduced group-specific posts and threaded comments. Added a sub-group model enabling nested communities within larger groups. Seeding scripts were added to populate sample community post data for testing.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/community',
    issueDescription: '',
    version: '2.0.4',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2026-03-27'),
  },

  // ── 2026-03-22 ──────────────────────────────────────────────────────────
  {
    title: 'Comprehensive Group Management System',
    description:
      'Launched the full group management backend including models and controllers for groups, members, roles, messages, join requests, and reports. Role-based group permissions allow admins and members to have distinct access levels within communities.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/community',
    issueDescription: '',
    version: '2.0.3',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-03-22'),
  },
  {
    title: 'Mentor Search Enhancements',
    description:
      'Improved mentor search capabilities with additional filter criteria. College data was refreshed in the database to provide accurate institution information for college-related mentor searches.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '2.0.3',
    priority: 'Medium',
    updateType: 'Enhancement',
    createdAt: new Date('2026-03-22'),
  },

  // ── 2026-03-17 ──────────────────────────────────────────────────────────
  {
    title: 'Preferred Currency Support and College Data Seeding',
    description:
      'Added a preferred currency field to application and mentor profile models, enabling currency-aware pricing display. Introduced a comprehensive college data seeding script to populate the database with institution records.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/colleges',
    issueDescription: '',
    version: '2.0.2',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2026-03-17'),
  },

  // ── 2026-03-16 ──────────────────────────────────────────────────────────
  {
    title: 'Booking Rescheduling and Mentor Feedback System',
    description:
      'Mentors can now propose a new date and time for a booked session. Students receive notifications to accept or reject the reschedule. Mentors can submit structured feedback on student sessions. A new cron job was introduced to handle Priority DM queuing.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-bookings',
    issueDescription: '',
    version: '2.0.1',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-03-16'),
  },

  // ── 2026-03-14 ──────────────────────────────────────────────────────────
  {
    title: 'Mentor Services, Coupons, and Priority Direct Messaging',
    description:
      'Mentors can now define paid services with custom pricing and duration. Coupon codes can be applied during checkout. Priority Direct Messaging allows users to purchase expedited responses from mentors.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '2.0.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-03-14'),
  },
  {
    title: 'Comprehensive Test Suite - Phases 5 through 8',
    description:
      'Added role-based access control tests (Phase 5), data accuracy validation tests (Phase 6), middleware and route unit tests (Phase 7), and end-to-end user journey tests (Phase 8) covering the full student-to-mentor booking flow.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription: '',
    version: '2.0.0',
    priority: 'Medium',
    updateType: 'Enhancement',
    createdAt: new Date('2026-03-14'),
  },

  // ── 2026-02-24 ──────────────────────────────────────────────────────────
  {
    title: 'Assessment User ID Standardization and History Back-Fill',
    description:
      'Standardized how userId is stored across assessment records. Implemented backward-compatible history retrieval with automatic data back-filling for legacy records that used a different ID format.',
    allowedRoles: ['Admin', 'User'],
    redirectUrl: '/assessment',
    issueDescription:
      'Assessment history was inconsistently retrieved due to mismatched userId formats between old and new records.',
    version: '1.9.1',
    priority: 'High',
    updateType: 'Bug Fix',
    createdAt: new Date('2026-02-24'),
  },

  // ── 2026-02-23 ──────────────────────────────────────────────────────────
  {
    title: 'Admin Dashboard Statistics and Analytics Routes',
    description:
      'Added admin-only API routes to fetch platform-wide statistics including active user counts, booking volumes, and assessment completion rates for display in the admin analytics dashboard.',
    allowedRoles: ['Admin'],
    redirectUrl: '/analytics',
    issueDescription: '',
    version: '1.9.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-02-23'),
  },

  // ── 2026-02-05 ──────────────────────────────────────────────────────────
  {
    title: 'Email Template Streamlining',
    description:
      'Refactored all transactional email templates to remove excessive inline styling and complex layout logic. Templates now render consistently across email clients with cleaner HTML output.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription:
      'Some email clients were stripping complex CSS styles causing broken layouts in outbound emails.',
    version: '1.8.1',
    priority: 'Medium',
    updateType: 'Bug Fix',
    createdAt: new Date('2026-02-05'),
  },

  // ── 2026-01-28 ──────────────────────────────────────────────────────────
  {
    title: 'College Explorer, Job Board, and AI Resume Builder',
    description:
      'Introduced the College Explorer allowing users to search and compare institutions. Added a Job Board with listings relevant to assessed career paths. AI Resume Builder generates tailored resumes based on the user assessment profile and selected career.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/colleges',
    issueDescription: '',
    version: '1.8.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-01-28'),
  },

  // ── 2025-12-24 ──────────────────────────────────────────────────────────
  {
    title: 'Mentor Profile Management Utility Scripts',
    description:
      'Added administrative utility scripts for bulk mentor profile operations including updating profile images and cleaning up stale mentor records from the database.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/user-management',
    issueDescription: '',
    version: '1.7.2',
    priority: 'Low',
    updateType: 'Enhancement',
    createdAt: new Date('2025-12-24'),
  },

  // ── 2025-12-22 ──────────────────────────────────────────────────────────
  {
    title: 'Model and Controller Unit Test Coverage',
    description:
      'Added unit tests for Announcement, Application, MentorBooking, and MentorProfile models. Integration tests were introduced for the booking flow and mentor feature endpoints to verify end-to-end correctness.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription: '',
    version: '1.7.1',
    priority: 'Medium',
    updateType: 'Enhancement',
    createdAt: new Date('2025-12-22'),
  },

  // ── 2025-12-20 ──────────────────────────────────────────────────────────
  {
    title: 'Mentor Dashboard and Profile Review System',
    description:
      'Launched the dedicated mentor dashboard with session management, availability settings, and booking overview. Admins can review and approve mentor profiles through a structured review interface with feedback options.',
    allowedRoles: ['Admin', 'Mentor'],
    redirectUrl: '/mentor-dashboard',
    issueDescription: '',
    version: '1.7.0',
    priority: 'Critical',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'Announcement System with Push and Email Notifications',
    description:
      'Admins can create platform-wide announcements with role-based targeting. Each announcement triggers push notifications and email alerts to the targeted audience segments.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/announcements',
    issueDescription: '',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'Live Server Log Streaming via WebSocket',
    description:
      'Real-time server log viewer implemented using WebSocket. Administrators can monitor live application logs filtered by severity level directly from the admin panel without SSH access.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription: '',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'Jitsi Meeting Link Configuration and Room Name Cleanup',
    description:
      'Jitsi video call link generation was enhanced with configurable parameters for audio, video, and chat defaults. Meeting room names are now sanitized to remove special characters, resulting in cleaner and more predictable room URLs.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-bookings',
    issueDescription:
      'Meeting room names with special characters caused Jitsi to generate malformed URLs.',
    version: '1.7.0',
    priority: 'Medium',
    updateType: 'Bug Fix',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'Session Rating and Mentor Performance Tracking',
    description:
      'Users can now rate and leave written feedback on completed mentorship sessions. Ratings are aggregated on the mentor profile and factored into mentor search ranking.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'GitHub Actions CI/CD Pipeline',
    description:
      'Introduced automated CI/CD using GitHub Actions. Pull request checks run the full test suite before merge. A production deployment workflow was added to auto-deploy on pushes to the main branch.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription: '',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Security',
    createdAt: new Date('2025-12-20'),
  },

  // ── 2025-12-19 ──────────────────────────────────────────────────────────
  {
    title: 'Gemini AI Integration for Career Chatbot',
    description:
      'Integrated Google Generative AI into the career chatbot, replacing static responses with dynamic, context-aware guidance. New endpoints support multi-turn conversations and career suggestion generation based on the user profile.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/',
    issueDescription: '',
    version: '1.6.0',
    priority: 'Critical',
    updateType: 'Feature',
    createdAt: new Date('2025-12-19'),
  },
  {
    title: 'Holland Code Career Recommendations via RIASEC',
    description:
      'Added a recommendation engine that maps RIASEC Holland code combinations to curated career clusters. Users receive career suggestions ranked by match percentage based on their assessment results.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/recommendation',
    issueDescription: '',
    version: '1.6.0',
    priority: 'Critical',
    updateType: 'Feature',
    createdAt: new Date('2025-12-19'),
  },

  // ── 2025-12-18 ──────────────────────────────────────────────────────────
  {
    title: 'Mentorship Booking System with Email Reminders',
    description:
      'Launched the core mentorship booking platform. Users can browse mentor profiles, select available time slots, and confirm bookings. Automated email reminders are sent 24 hours and 1 hour before each session via a scheduled cron job.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '1.5.0',
    priority: 'Critical',
    updateType: 'Feature',
    createdAt: new Date('2025-12-18'),
  },
  {
    title: 'Assessment Improvement Tracking and History Trends',
    description:
      'Assessment results are now stored with timestamped history per user. A trend analysis endpoint computes score delta between the most recent and previous assessment, allowing users to track their RIASEC profile changes over time.',
    allowedRoles: ['Admin', 'User'],
    redirectUrl: '/assessment',
    issueDescription: '',
    version: '1.5.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-18'),
  },
  {
    title: 'Self-Delete Account Flow and Newsletter Preferences',
    description:
      'Users can now permanently delete their own account from the profile settings page. A confirmation email is sent before deletion. Newsletter subscription preferences were added allowing users to opt in or out of platform update emails.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/profile',
    issueDescription: '',
    version: '1.5.0',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2025-12-18'),
  },
  {
    title: 'Mentor Approval Auto-Verification on Approval',
    description:
      'When an admin approves a mentor application, the mentor account is now immediately marked as verified without requiring a separate step. A free mentorship campaign banner was added to the platform to encourage early mentor adoption.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/approvals',
    issueDescription:
      'Approved mentors were not being auto-verified, requiring a manual extra step from admins.',
    version: '1.5.0',
    priority: 'High',
    updateType: 'Bug Fix',
    createdAt: new Date('2025-12-18'),
  },
  {
    title: 'Real-Time Server Status Banner',
    description:
      'An offline detection banner is displayed to users when the API server is unreachable. The frontend polls the server health endpoint at regular intervals and surfaces a non-intrusive warning banner when connectivity is lost.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/',
    issueDescription: '',
    version: '1.5.0',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2025-12-18'),
  },
  {
    title: 'Lazy Loading and Route-Level Code Splitting',
    description:
      'All major routes are now loaded lazily using React.lazy and Suspense. Authentication logic was consolidated into a single context. API endpoint references were moved to environment variables. This reduces initial bundle size and improves first-load performance.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/',
    issueDescription: '',
    version: '1.5.0',
    priority: 'High',
    updateType: 'Enhancement',
    createdAt: new Date('2025-12-18'),
  },
  {
    title: 'Comprehensive User Profile Management',
    description:
      'Launched a full-featured user profile page with dedicated sections for personal information, education history, work experience, social links, and account settings. Each section is independently editable and persisted to the backend.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/profile',
    issueDescription: '',
    version: '1.5.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-18'),
  },
  {
    title: 'Platform Documentation Page',
    description:
      'Added a public documentation page covering platform features, API references, and onboarding guides for users, mentors, and administrators. The page is accessible from the main navigation.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/docs',
    issueDescription: '',
    version: '1.5.0',
    priority: 'Low',
    updateType: 'Feature',
    createdAt: new Date('2025-12-18'),
  },

  // ── 2025-12-19 (client) ─────────────────────────────────────────────────
  {
    title: 'Environment-Based API Configuration',
    description:
      'All API base URLs and environment-specific configuration were extracted from hardcoded values into .env files. The frontend config module now reads from environment variables, enabling separate staging and production configurations.',
    allowedRoles: ['Admin'],
    redirectUrl: '/admin/server-logs',
    issueDescription:
      'API URLs were hardcoded, making it difficult to switch between local, staging, and production environments.',
    version: '1.6.0',
    priority: 'Medium',
    updateType: 'Security',
    createdAt: new Date('2025-12-19'),
  },

  // ── 2025-12-20 (client) ─────────────────────────────────────────────────
  {
    title: 'Password Change and OTP Reset Flow',
    description:
      'Users can change their password from the profile settings page using OTP email verification. A dedicated forgot-password flow sends a time-limited OTP to the registered email address. Both web and mobile applications support this flow.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/profile',
    issueDescription: '',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'In-App Notification System',
    description:
      'Real-time in-app notifications for booking confirmations, session reminders, reschedule requests, and admin announcements. Notifications are displayed in a dedicated inbox accessible from the navbar. Push notifications are delivered to the mobile app.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/notifications',
    issueDescription: '',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'Dynamic Mentor Slot Fetching in Booking Modal',
    description:
      'The booking modal now fetches available mentor time slots from the API in real time instead of showing static options. Loading and error states are handled gracefully, preventing users from booking unavailable slots.',
    allowedRoles: ['User'],
    redirectUrl: '/mentors',
    issueDescription:
      'Mentor availability was previously shown as a static list that did not reflect actual booked slots.',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Bug Fix',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'Mentor Profile Social Section',
    description:
      'Mentor profiles now display a social links section with links to LinkedIn, GitHub, Twitter, and personal websites. Mentors can update their social links from the mentor profile editor.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '1.7.0',
    priority: 'Low',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },
  {
    title: 'Advanced Mentor Search with Filters and Sorting',
    description:
      'The mentor discovery page gained advanced filtering by domain, experience, rating, price range, and language. Results can be sorted by rating, price, or relevance. A campaign banner highlights featured mentors.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '1.7.0',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2025-12-20'),
  },

  // ── 2026-02-05 (client) ─────────────────────────────────────────────────
  {
    title: 'Mentor Card Display Improvements',
    description:
      'Mentor listing cards now conditionally render data fields only when present, preventing empty placeholders. Company logo logic was removed in favor of a cleaner display. Text truncation and layout spacing were refined across all card variants.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription:
      'Mentor cards showed empty containers for missing fields such as company name and logo.',
    version: '1.8.1',
    priority: 'Medium',
    updateType: 'Bug Fix',
    createdAt: new Date('2026-02-05'),
  },

  // ── 2026-02-11 (client) ─────────────────────────────────────────────────
  {
    title: 'Footer Redesign with Structured Navigation',
    description:
      'The site footer was redesigned with organized navigation columns covering platform features, resources, and social links. The footer is now integrated consistently across all pages in the main application layout.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/',
    issueDescription: '',
    version: '1.8.2',
    priority: 'Low',
    updateType: 'UI/UX',
    createdAt: new Date('2026-02-11'),
  },
  {
    title: 'Pathfinder Rebranding for Assessment Navigation',
    description:
      'The Assessment and Assessment Info navigation links were renamed to Pathfinder across the Navbar and Footer to better reflect the career guidance purpose of the RIASEC feature.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/Assesmentinfo',
    issueDescription: '',
    version: '1.8.2',
    priority: 'Low',
    updateType: 'UI/UX',
    createdAt: new Date('2026-02-11'),
  },

  // ── 2026-03-14 (client) ─────────────────────────────────────────────────
  {
    title: 'Mentor Onboarding, Public Profiles, and Direct Messaging',
    description:
      'Introduced a guided mentor onboarding flow for new mentors to complete their profile, set availability, and list services. Public mentor profile pages are now accessible to all users. Direct messaging between students and mentors was launched.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '2.0.0',
    priority: 'Critical',
    updateType: 'Feature',
    createdAt: new Date('2026-03-14'),
  },

  // ── 2026-03-16 (client) ─────────────────────────────────────────────────
  {
    title: 'Assessment History View with Gemini AI Insights',
    description:
      'The assessment results page now shows a history of past assessments with score progression charts. Gemini AI generates personalized insights summarizing the user career trajectory and suggesting next steps based on historical RIASEC trends.',
    allowedRoles: ['Admin', 'User'],
    redirectUrl: '/assessment',
    issueDescription: '',
    version: '2.0.1',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-03-16'),
  },
  {
    title: 'Direct Messaging Inbox for Students and Mentors',
    description:
      'A dedicated DM inbox was introduced for both students and mentors. Students can initiate conversations with mentors, and mentors have a separate inbox view. All message threads are persisted and accessible from the navigation.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-dms',
    issueDescription: '',
    version: '2.0.1',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-03-16'),
  },
  {
    title: 'Reschedule Request UI with AI Feedback Suggestions',
    description:
      'Students can accept or reject reschedule proposals from mentors directly from the My Bookings page. Mentor feedback forms include AI-generated suggestion prompts to help mentors write more structured and useful session summaries.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-bookings',
    issueDescription: '',
    version: '2.0.1',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-03-16'),
  },
  {
    title: 'Modern Mentor Dashboard UI with Sidebar Navigation',
    description:
      'The mentor dashboard was rebuilt with a new sidebar layout, persistent header, and modular overview cards for sessions, earnings, and student activity. URL-based tab navigation allows deep linking to specific dashboard sections.',
    allowedRoles: ['Mentor', 'Admin'],
    redirectUrl: '/mentor-dashboard',
    issueDescription: '',
    version: '2.0.1',
    priority: 'High',
    updateType: 'UI/UX',
    createdAt: new Date('2026-03-16'),
  },

  // ── 2026-03-17 (client) ─────────────────────────────────────────────────
  {
    title: 'Global Currency Context for Dynamic Price Conversion',
    description:
      'A global currency context was introduced to allow users to view mentor service prices in their preferred currency. Conversion rates are applied dynamically across all pricing displays on mentor listings, profile pages, and checkout.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/mentors',
    issueDescription: '',
    version: '2.0.2',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2026-03-17'),
  },

  // ── 2026-03-22 (client) ─────────────────────────────────────────────────
  {
    title: 'Booking Success Page and Modular Profile Components',
    description:
      'A dedicated booking confirmation page was added that displays session details, Jitsi link, and next steps after a successful booking. The user profile page was refactored into smaller reusable section components for better maintainability.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-bookings',
    issueDescription: '',
    version: '2.0.3',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2026-03-22'),
  },
  {
    title: 'New Holland RIASEC Assessment UI with Domain Insights',
    description:
      'The RIASEC assessment interface was redesigned with a cleaner question flow and improved progress indicators. The results page now shows detailed domain breakdowns for each of the six Holland codes with descriptions and career match explanations.',
    allowedRoles: ['Admin', 'User'],
    redirectUrl: '/Assesmentinfo',
    issueDescription: '',
    version: '2.0.3',
    priority: 'High',
    updateType: 'UI/UX',
    createdAt: new Date('2026-03-22'),
  },
  {
    title: 'Session Countdown Timers on My Bookings Page',
    description:
      'Live countdown timers were added to upcoming session cards on the My Bookings page. Users can see exactly how long until their next session starts, and the Jitsi join button activates automatically when the session window opens.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/my-bookings',
    issueDescription: '',
    version: '2.0.3',
    priority: 'Medium',
    updateType: 'Feature',
    createdAt: new Date('2026-03-22'),
  },
  {
    title: 'Community Section Launch with Group Pages',
    description:
      'The community section was introduced with group discovery, group home pages, post detail views, and group management. Users can browse and join existing groups or create new ones. Group admins have a dedicated management panel.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/community',
    issueDescription: '',
    version: '2.0.3',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-03-22'),
  },

  // ── 2026-04-03 (client) ─────────────────────────────────────────────────
  {
    title: 'Community Section Redesign with Group Chat and Post Detail Pages',
    description:
      'The community section received a comprehensive redesign. New group home pages, threaded post detail views, and a real-time group chat interface were introduced. Navigation and group management flows were updated to support the expanded structure.',
    allowedRoles: ['Admin', 'User', 'Mentor'],
    redirectUrl: '/community',
    issueDescription: '',
    version: '2.0.5',
    priority: 'High',
    updateType: 'UI/UX',
    createdAt: new Date('2026-04-03'),
  },

  // ── 2026-04-14 (client) ─────────────────────────────────────────────────
  {
    title: 'Matched Mentors on RIASEC Results Page',
    description:
      'The RIASEC assessment results page now displays a list of platform mentors whose expertise matches the user detected career domains. Mentor cards link directly to their public profiles, enabling immediate outreach after assessment completion.',
    allowedRoles: ['Admin', 'User'],
    redirectUrl: '/Assesmentinfo',
    issueDescription: '',
    version: '2.1.1',
    priority: 'High',
    updateType: 'Feature',
    createdAt: new Date('2026-04-14'),
  },

  // ── 2026-04-16 (client) ─────────────────────────────────────────────────
  {
    title: 'Navigation Link Updates and Mentor Dashboard Layout Optimization',
    description:
      'Navigation links were updated across the platform to reflect current route structure. The mentor dashboard layout was optimized for smaller screens with improved sidebar collapse behavior. Demo login credentials were refreshed for testing environments.',
    allowedRoles: ['Admin', 'Mentor'],
    redirectUrl: '/mentor-dashboard',
    issueDescription: '',
    version: '2.1.2',
    priority: 'Low',
    updateType: 'Enhancement',
    createdAt: new Date('2026-04-16'),
  },

  // ── 2026-05-08 (client) ─────────────────────────────────────────────────
  {
    title: 'Server-Side Pagination for Mentor Sessions',
    description:
      'Mentor session lists now use server-side pagination instead of loading all records at once. Session expiration logic was corrected to use the session end time rather than start time for accurate status determination. Load More support was added for past sessions.',
    allowedRoles: ['Admin', 'Mentor'],
    redirectUrl: '/mentor-sessions',
    issueDescription:
      'All past sessions were loaded in a single request causing performance degradation for mentors with many completed sessions.',
    version: '2.3.0',
    priority: 'High',
    updateType: 'Enhancement',
    createdAt: new Date('2026-05-08'),
  },
];

async function seedUpdatesFromCommits() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Locate the admin user
    const adminUser = await User.findOne({
      $or: [{ email: 'ujjwaljha744@gmail.com' }, { username: 'Ujjwaljha_12' }, { role: 'Admin' }],
    });

    if (!adminUser) {
      console.error('Admin user not found. Aborting.');
      process.exit(1);
    }
    console.log(`Admin user: ${adminUser.name || adminUser.username} (${adminUser.email})`);
    console.log(`Admin ID:   ${adminUser._id}`);

    // Clear existing updates
    const existingCount = await Update.countDocuments();
    console.log(`Existing updates: ${existingCount} — clearing...`);
    await Update.deleteMany({});
    console.log('Cleared.');

    // Insert commit-based changelog entries
    let inserted = 0;
    const errors = [];

    for (const entry of commitChangelog) {
      try {
        const doc = new Update({
          title: entry.title,
          description: entry.description,
          allowedRoles: entry.allowedRoles,
          redirectUrl: entry.redirectUrl,
          issueDescription: entry.issueDescription || '',
          version: entry.version,
          priority: entry.priority,
          updateType: entry.updateType,
          isActive: true,
          createdBy: adminUser._id,
          createdAt: entry.createdAt,
          updatedAt: entry.createdAt,
        });
        await doc.save();
        console.log(`  Inserted: [${entry.version}] ${entry.title}`);
        inserted++;
      } catch (err) {
        console.error(`  Failed:   ${entry.title} — ${err.message}`);
        errors.push({ title: entry.title, error: err.message });
      }
    }

    const total = await Update.countDocuments();
    console.log('\n--- Summary ---');
    console.log(`Inserted: ${inserted}`);
    console.log(`Errors:   ${errors.length}`);
    console.log(`Total in DB: ${total}`);

    if (errors.length > 0) {
      console.log('\nFailed entries:');
      errors.forEach(e => console.log(`  - ${e.title}: ${e.error}`));
    }

    console.log('\nDone. Visit /updates to verify the changelog.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedUpdatesFromCommits();
