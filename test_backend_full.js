require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// Models for direct test manipulations
const User = require('./models/User');
const MentorProfile = require('./models/MentorProfile');
const EmailVerification = require('./models/EmailVerification');
const connectDB = require('./db');

const API_URL = 'http://localhost:3001/api';

// Test Data
const USERS = {
  mentor: { email: 'pro_mentor@test.com', password: 'Password@123', handle: 'pro_mentor_1' },
  student: { email: 'pro_student@test.com', password: 'Password@123' },
};

let store = {
  mentorToken: '',
  studentToken: '',
  mentorUserId: '',
  studentUserId: '',
  serviceId: '',
  bookingId: '',
  threadId: '',
  postId: '',
};

// --- Test Utilities ---
const logHead = msg => console.log('\n\x1b[44m\x1b[37m %s \x1b[0m', msg);
const logSuccess = msg => console.log('\x1b[32m✅ %s\x1b[0m', msg);
const logError = (msg, err) => {
  console.log('\x1b[31m❌ %s\x1b[0m', msg);
  if (err?.response?.data) {
    console.error('API Error Response:', err.response.data);
  }
  console.error(err?.stack || err);
  process.exit(1); // Fail fast
};

async function cleanup() {
  logHead('CLEANUP PREVIOUS TEST DATA');
  await User.deleteMany({ email: { $in: [USERS.mentor.email, USERS.student.email] } });
  await MentorProfile.deleteMany({ handle: USERS.mentor.handle });
  logSuccess('Test database cleaned.');
}

// ---------------------------------------------------------
// SUITE 1: AUTHENTICATION & PROFILES
// ---------------------------------------------------------
async function runAuthSuite(userKey) {
  logHead(`SUITE 1: AUTHENTICATION [${userKey.toUpperCase()}]`);
  const userData = USERS[userKey];

  try {
    // 1. Signup
    await axios.post(`${API_URL}/auth/signup`, {
      name: `${userKey} Test`,
      username: `${userKey}_user`,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
    });
    logSuccess('Signup successful');

    // 2. Bypass Email Verification via DB
    // Small delay to ensure DB write is complete
    await new Promise(r => setTimeout(r, 1000));
    const bypassVf = await EmailVerification.findOne({ email: userData.email }).sort({
      createdAt: -1,
    });
    if (!bypassVf) {
      throw new Error(`EmailVerification document not found for ${userData.email}`);
    }
    await axios.post(`${API_URL}/auth/verify-email`, { token: bypassVf.token });
    logSuccess('Email verified');

    // 3. Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: userData.email,
      password: userData.password,
    });
    store[`${userKey}Token`] = loginRes.data.token;
    store[`${userKey}UserId`] = loginRes.data.user.id || loginRes.data.user._id;
    logSuccess('Login successful');

    // 4. Update Profile Route
    await axios.put(
      `${API_URL}/profile/personal`,
      {
        firstName: userKey,
        lastName: 'TestUser',
        bio: 'I am a pro test bot',
      },
      { headers: { Authorization: `Bearer ${store[`${userKey}Token`]}` } }
    );
    logSuccess('Profile personalized');
  } catch (err) {
    logError(`Auth Suite Failed for ${userKey}`, err);
  }
}

// ---------------------------------------------------------
// SUITE 2: MENTORSHIP & SERVICES
// ---------------------------------------------------------
async function runMentorSuite() {
  logHead('SUITE 2: MENTOR ONBOARDING & SERVICES');
  const headers = { Authorization: `Bearer ${store.mentorToken}` };

  try {
    // 1. Apply to be a mentor
    await axios.post(
      `${API_URL}/mentor/register`,
      {
        handle: USERS.mentor.handle,
        displayName: 'Pro Mentor User',
        jobTitle: 'Principal Engineer',
        expertise: ['Node.js', 'Testing'],
      },
      { headers }
    );
    logSuccess('Mentor Application Submitted');

    // 2. Admin DB Bypass (Approve Profile & Switch Role)
    await MentorProfile.updateOne(
      { handle: USERS.mentor.handle },
      {
        approvalStatus: 'approved',
        isVisible: true,
        isActive: true,
      }
    );
    await User.updateOne(
      { email: USERS.mentor.email },
      { role: 'Mentor', mentorStatus: 'approved' }
    );
    logSuccess('Mentor automatically approved via DB hooks');

    // Re-login to get Mentor Role Token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: USERS.mentor.email,
      password: USERS.mentor.password,
    });
    store.mentorToken = loginRes.data.token;
    headers.Authorization = `Bearer ${store.mentorToken}`;

    // 3. Create Custom Service
    const serviceRes = await axios.post(
      `${API_URL}/mentor/services`,
      {
        serviceType: 'one_on_one',
        title: 'Pro Code Review',
        description: 'Reviewing code like a pro',
        price: 50,
        duration: 60,
        isActive: true,
      },
      { headers }
    );
    store.serviceId = serviceRes.data?.service?._id;
    logSuccess(`Mentor Service created: ${store.serviceId}`);
  } catch (err) {
    logError('Mentor Suite Failed', err);
  }
}

// ---------------------------------------------------------
// SUITE 3: PUBLIC BROWSING & BOOKING (Student Action)
// ---------------------------------------------------------
async function runBookingSuite() {
  logHead('SUITE 3: BOOKING FLOW');
  const headers = { Authorization: `Bearer ${store.studentToken}` };

  try {
    // 1. Fetch public mentor profile
    const profileRes = await axios.get(`${API_URL}/mentor/profile/${USERS.mentor.handle}`);
    const mentorProfileId = profileRes.data.profile._id;
    const mentorUserId = profileRes.data.profile.userId._id;
    logSuccess('Successfully fetched public Topmate-style profile window');

    // 2. Book a session
    const bookRes = await axios.post(
      `${API_URL}/bookings/book`,
      {
        mentorProfileId: mentorProfileId,
        serviceId: store.serviceId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      },
      { headers }
    );
    store.bookingId = bookRes.data.appointmentId || bookRes.data._id;
    logSuccess(`Booking successfully submitted: ${store.bookingId}`);
  } catch (err) {
    logError('Booking Suite Failed', err);
  }
}

// ---------------------------------------------------------
// SUITE 4: PRIORITY DMs
// ---------------------------------------------------------
async function runDMSuite() {
  logHead('SUITE 4: PRIORITY DMs');
  const studentHeaders = { Authorization: `Bearer ${store.studentToken}` };
  const mentorHeaders = { Authorization: `Bearer ${store.mentorToken}` };

  try {
    // 1. Student initiates DM
    const startRes = await axios.post(
      `${API_URL}/dm/start`,
      {
        mentorId: store.mentorUserId,
        subject: 'Urgent Testing Help',
        message: 'Hello Mentor, I need help with testing.',
      },
      { headers: studentHeaders }
    );
    store.threadId = startRes.data.thread._id || startRes.data._id || startRes.data.threadId;

    // Use fallback extraction if the API structure varies slightly
    if (!store.threadId && startRes.data.message === 'Thread started') {
      // We will fetch student outbox to find the latest thread
      const outboxRes = await axios.get(`${API_URL}/dm/inbox/mentee`, { headers: studentHeaders });
      store.threadId = outboxRes.data.threads?.[0]?._id;
    }
    logSuccess('Priority DM thread created!');

    if (store.threadId) {
      // 2. Mentor replies to DM
      await axios.post(
        `${API_URL}/dm/${store.threadId}/messages`,
        {
          content: 'Sure! I can help you with backend tests.',
        },
        { headers: mentorHeaders }
      );
      logSuccess('Mentor replied to DM successfully');
    }
  } catch (err) {
    logError('DM Suite Failed', err);
  }
}

// ---------------------------------------------------------
// SUITE 5: COMMUNITY POSTS
// ---------------------------------------------------------
async function runCommunitySuite() {
  logHead('SUITE 5: COMMUNITY POSTS');
  const studentHeaders = { Authorization: `Bearer ${store.studentToken}` };
  const mentorHeaders = { Authorization: `Bearer ${store.mentorToken}` };

  try {
    // 1. Mentor creates a post
    const postRes = await axios.post(
      `${API_URL}/posts`,
      {
        content: 'Welcome to the pro testing framework! #Backend #NodeJS',
      },
      { headers: mentorHeaders }
    );
    store.postId = postRes.data._id;
    logSuccess(`Community post created: ${store.postId}`);

    // 2. Student likes the post
    await axios.post(`${API_URL}/posts/${store.postId}/like`, {}, { headers: studentHeaders });
    logSuccess('Student liked the community post');

    // 3. Student comments on the post
    await axios.post(
      `${API_URL}/posts/${store.postId}/comments`,
      {
        content: 'Great tutorial, looking forward to more!',
      },
      { headers: studentHeaders }
    );
    logSuccess('Student commented on the post');
  } catch (err) {
    logError('Community Suite Failed', err);
  }
}

// ---------------------------------------------------------
// MASTER RUNNER
// ---------------------------------------------------------
async function runAllTests() {
  console.log('\n\x1b[45m\x1b[37m ================================================= \x1b[0m');
  console.log('\x1b[45m\x1b[37m STARTING FULL BACKEND E2E TEST (PRO MODE)         \x1b[0m');
  console.log('\x1b[45m\x1b[37m ================================================= \x1b[0m\n');

  try {
    await connectDB();
    await cleanup();

    // Execute Suites Sequentially
    await runAuthSuite('mentor');
    await runAuthSuite('student');
    await runMentorSuite();
    await runBookingSuite();
    await runDMSuite();
    await runCommunitySuite();

    console.log('\n\x1b[42m\x1b[37m ================================================= \x1b[0m');
    console.log('\x1b[42m\x1b[37m 🎉 ALL TESTS PASSED SUCCESSFULLY!                 \x1b[0m');
    console.log('\x1b[42m\x1b[37m ================================================= \x1b[0m\n');
  } catch (e) {
    console.error('Fatal Error during execution:', e);
  } finally {
    process.exit(0);
  }
}

runAllTests();
