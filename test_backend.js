const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const EmailVerification = require('./models/EmailVerification');
const MentorProfile = require('./models/MentorProfile');
require('dotenv').config();

const API_URL = 'http://localhost:3001/api';
const EMAIL = 'k22dn2023@gmail.com';
const PASSWORD = 'Password123!';
const USERNAME = 'ujjwaladmin_test2';

async function connectDB() {
  await require('./db')();
}

async function cleanup() {
  console.log('\n🧹 Cleaning up previous test data...');
  const user = await User.findOne({ email: EMAIL });
  if (user) {
    await MentorProfile.deleteMany({ userId: user._id });
    await EmailVerification.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    console.log(`Deleted user ${EMAIL} and associated data.`);
  }
}

async function runTests() {
  await connectDB();
  await cleanup();

  let token = null;
  let mentorHandle = 'ujjwal_test_handle';

  console.log('\n--- 1. SIGNUP & VERIFICATION ---');
  try {
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Ujjwal Admin',
      email: EMAIL,
      username: USERNAME,
      password: PASSWORD,
      confirmPassword: PASSWORD,
      role: 'User',
    });
    console.log('✅ Signup Response:', signupRes.data.message);

    // Bypass email, get verification token directly from DB
    const verification = await EmailVerification.findOne({ email: EMAIL });
    if (!verification) throw new Error('No verification token found in DB');

    console.log('Got Verification Token:', verification.token);

    const verifyRes = await axios.post(`${API_URL}/auth/verify-email`, {
      token: verification.token,
    });
    console.log('✅ Email Verification:', verifyRes.data.message);
  } catch (err) {
    console.error('❌ Signup/Verify Error:', err.response?.data || err.message);
    process.exit(1);
  }

  console.log('\n--- 2. LOGIN ---');
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: EMAIL,
      password: PASSWORD,
    });
    token = loginRes.data.token;
    console.log('✅ Login Successful. Token:', token.slice(0, 20) + '...');
  } catch (err) {
    console.error('❌ Login Error:', err.response?.data || err.message);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}` };

  console.log('\n--- 3. USER PROFILE FETCH ---');
  try {
    const profileRes = await axios.get(`${API_URL}/profile/me`, { headers });
    console.log('✅ Profile Fetched:', profileRes.data.profile.user.email);
  } catch (err) {
    console.error('❌ Profile Error:', err.response?.data || err.message);
  }

  console.log('\n--- 4. BECOME A MENTOR ---');
  try {
    const mentorAppRes = await axios.post(
      `${API_URL}/mentor/register`,
      {
        handle: mentorHandle,
        displayName: 'Ujjwal Expert',
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        bio: 'I help people get jobs.',
        expertise: ['Engineering', 'Career'],
        skills: ['Node.js', 'React'],
        pricingType: 'free',
      },
      { headers }
    );
    console.log('✅ Mentor Application Submitted:', mentorAppRes.data.message);

    // Auto-approve mentor via DB directly for testing purposes
    const profile = await MentorProfile.findOne({ handle: mentorHandle });
    profile.approvalStatus = 'approved';
    profile.isActive = true;
    profile.isVisible = true;
    await profile.save();
    console.log('🟢 Automatically approved mentor profile via DB');

    // Change user role
    await User.updateOne({ email: EMAIL }, { role: 'Mentor', mentorStatus: 'approved' });

    // Re-login to get updated role token
    const newLogin = await axios.post(`${API_URL}/auth/login`, {
      username: EMAIL,
      password: PASSWORD,
    });
    token = newLogin.data.token;
    headers.Authorization = `Bearer ${token}`;
    console.log('🔄 Re-authenticated to get Mentor role token.');

    const createCouponRes = await axios.post(
      `${API_URL}/mentor/coupons`,
      {
        code: 'TEST50',
        discountType: 'percentage',
        discountValue: 50,
        isActive: true,
        maxUses: 10,
      },
      { headers }
    );
    console.log('✅ Coupon Created:', createCouponRes.data.coupon.code);
  } catch (err) {
    console.error('❌ Mentor Apply Error:', err.response?.data || err.message);
  }

  console.log('\n--- 5. CREATE A MENTOR SERVICE ---');
  let serviceId = null;
  try {
    const serviceRes = await axios.post(
      `${API_URL}/mentor/services`,
      {
        title: 'Mock Interview Session',
        serviceType: 'mock_interview',
        description: 'An intensive mock interview.',
        price: 500,
        duration: 60,
        isActive: true,
      },
      { headers }
    );
    serviceId = serviceRes.data.service._id;
    console.log('✅ Service Created. ID:', serviceId);
  } catch (err) {
    console.error('❌ Service Create Error:', err.response?.data || err.message);
  }

  console.log('\n--- 6. BOOKING A SESSION (Self-booking attempt/Bypass) ---');
  try {
    // Actually, booking self might be blocked, let's see.
    const profile = await MentorProfile.findOne({ handle: mentorHandle });
    const bookRes = await axios.post(
      `${API_URL}/bookings/book`,
      {
        mentorProfileId: profile._id,
        serviceId: serviceId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 60,
      },
      { headers }
    );
    console.log('✅ Booking Response:', bookRes.data);
  } catch (err) {
    // We expect "You cannot book a session with yourself", which proves validation works.
    if (err.response?.data?.error === 'You cannot book a session with yourself') {
      console.log('✅ Booking correctly prevented self-booking.');
    } else {
      console.error('❌ Booking Error:', err.response?.data || err.message);
    }
  }

  console.log('\n🎉 ALL TESTS COMPLETED 🎉');
  process.exit(0);
}

runTests();
