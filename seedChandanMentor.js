/**
 * seedChandanMentor.js
 * Creates a fully-loaded mentor "Chandan Jeena" with ALL 15 service types,
 * complete MentorProfile, and full 7-day availability.
 * Pricing is strictly between 50-599.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const User = require('./models/User');
const MentorProfile = require('./models/MentorProfile');
const MentorService = require('./models/MentorService');

async function seed() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to MongoDB');

  // 1. Create User
  const plain = 'Chandan@2024!';
  const hashed = await bcrypt.hash(plain, 10);
  const email_addr = 'chandan.jeena@skillpilot.dev';

  let user = await User.findOne({ email: email_addr });
  if (user) {
    console.log('⚠️  User already exists, deleting to re-seed cleanly...');
    await User.deleteOne({ _id: user._id });
    await MentorProfile.deleteOne({ userId: user._id });
    await MentorService.deleteMany({ mentorId: user._id });
  }

  user = await User.create({
    username: 'chandan_jeena',
    name: 'Chandan Jeena',
    email: email_addr,
    password: hashed,
    role: 'Mentor',
    jobTitle: 'Senior Data Scientist & AI Researcher',
    experience: 8,
    isActive: true,
    isVerified: true,
    authProvider: 'local',
    mentorStatus: 'approved',
    mentorBadge: 'premium',
    mentorVerification: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      documentVerified: true,
      documentVerifiedAt: new Date(),
    },
    totalPlacements: 35,
    mentorRating: 4.8,
    totalReviews: 85,
    companiesJoined: ['NVIDIA', 'Microsoft', 'TensorFlow Core'],
    securitySettings: {
      twoFactorEnabled: false,
      emailNotifications: true,
      loginAlerts: true,
      allowMultipleSessions: true,
    },
    phoneNumber: '+91 9876543210',
    newsletter: true,
    subscription: true,
  });
  console.log('✅ User created:', user._id);

  // 2. Create MentorProfile
  const profile = await MentorProfile.create({
    userId: user._id,
    displayName: 'Chandan Jeena',
    handle: 'chandan_jeena',
    tagline: 'AI Research Engineer | Python Expert | Data Science Mentor | NVIDIA Alumni',
    bio: "Passionate about bridging the gap between academic research and industrial application in Artificial Intelligence. With over 8 years of experience in Deep Learning and Computer Vision, I've mentored dozens of students into top-tier research labs and product companies. I specialize in Python-based scalable AI systems and ML-Ops.",
    profileImage: '',
    location: { city: 'Noida', state: 'Uttar Pradesh', country: 'India' },
    expertise: [
      'Python',
      'Machine Learning',
      'Deep Learning',
      'Natural Language Processing',
      'Computer Vision',
      'PyTorch',
      'Scikit-Learn',
      'Pandas',
      'AI-Ops',
    ],
    targetingDomains: ['Data Scientist', 'ML Engineer', 'Research Scientist', 'Data Analyst'],
    preferredMenteeType: ['Student', 'Fresher', 'Working Professional'],
    languages: ['English', 'Hindi', 'Odia'],
    totalPlacements: 35,
    totalMentees: 150,
    averageRating: 4.8,
    totalReviews: 85,
    sessionsPerWeek: 10,
    sessionDuration: 45,
    pricingType: 'paid',
    pricingPlans: [
      {
        duration: '1 Month',
        price: 599,
        discountPercent: 10,
        features: ['Weekly AI check-in', 'Code review', 'Project guidance'],
      },
      {
        duration: '3 Months',
        price: 1499,
        discountPercent: 15,
        features: ['12 sessions', 'Deep dive ML projects', 'Resume parsing help'],
      },
    ],
    trialSession: {
      available: true,
      price: 99,
      description: 'Quick 15-min AI roadmap discussion.',
    },
    sectorType: 'private',
    availabilitySlots: [
      { day: 'Monday', startTime: '10:00', endTime: '20:00', isAvailable: true },
      { day: 'Tuesday', startTime: '10:00', endTime: '20:00', isAvailable: true },
      { day: 'Wednesday', startTime: '10:00', endTime: '20:00', isAvailable: true },
      { day: 'Thursday', startTime: '10:00', endTime: '20:00', isAvailable: true },
      { day: 'Friday', startTime: '10:00', endTime: '20:00', isAvailable: true },
      { day: 'Saturday', startTime: '09:00', endTime: '18:00', isAvailable: true },
      { day: 'Sunday', startTime: '11:00', endTime: '15:00', isAvailable: true },
    ],
    referralsInTopCompanies: true,
    topCompanies: ['NVIDIA', 'Microsoft', 'Google', 'Amazon', 'Adobe'],
    curriculum: {
      available: true,
      description: 'Comprehensive 16-week AI & Data Science path.',
      topics: [
        'Advanced Python for Data Science',
        'Statistical Foundations',
        'Deep Learning with PyTorch',
        'Generative AI Fundamentals',
        'ML System Design',
      ],
    },
    socialLinks: {
      linkedIn: 'https://linkedin.com/in/chandan_jeena',
      github: 'https://github.com/chandan_jeena',
      twitter: 'https://twitter.com/chandan_ai',
      portfolio: 'https://chandan.ai',
    },
    featured: true,
    isVisible: true,
    searchTags: ['AI', 'ML', 'Python', 'NVIDIA', 'Data Science', 'PyTorch'],
    education: [
      {
        degree: 'Masters',
        field: 'Artificial Intelligence',
        institution: 'IIIT Hyderabad',
        year: 2018,
      },
      { degree: 'B.Tech', field: 'Comp-Sci', institution: 'NIT Rourkela', year: 2016 },
    ],
    certifications: [
      { name: 'NVIDIA Deep Learning Institute Instructor', issuer: 'NVIDIA', year: 2020 },
      { name: 'AWS Certified Machine Learning - Specialty', issuer: 'AWS', year: 2021 },
    ],
    reviews: [
      {
        userId: user._id,
        rating: 5,
        comment: 'Chandan is a wizard with Python. Helped me build my first GAN model.',
        createdAt: new Date('2024-11-10'),
      },
      {
        userId: user._id,
        rating: 5,
        comment: 'Very practical advice. Focused on what actually works in production AI.',
        createdAt: new Date('2025-01-05'),
      },
    ],
  });

  // Link back to user
  await User.findByIdAndUpdate(user._id, { mentorProfile: profile._id });
  console.log('✅ MentorProfile created:', profile._id);

  // 3. Create all 15 service types with prices between 50-599
  const servicesData = [
    { type: 'discovery_call', emoji: '🌱', title: 'AI Discovery Call', price: 99, dur: 20 },
    { type: 'one_on_one', emoji: '🎥', title: '1:1 ML Mentorship', price: 499, dur: 45 },
    { type: 'quick_chat', emoji: '⚡', title: 'Career Quick Chat', price: 149, dur: 15 },
    { type: 'mock_interview', emoji: '🎯', title: 'ML/Python Mock Interview', price: 599, dur: 60 },
    { type: 'career_guidance', emoji: '🧭', title: 'Data Science Roadmap', price: 299, dur: 30 },
    { type: 'coaching_series', emoji: '🗓️', title: 'AI Research Starter', price: 549, dur: 45 },
    { type: 'priority_dm', emoji: '💬', title: 'Priority DM Access', price: 399, dur: 0 },
    { type: 'resume_review', emoji: '📄', title: 'AI Resume Audit', price: 199, dur: 0 },
    { type: 'portfolio_review', emoji: '🖼️', title: 'GitHub Portfolio Review', price: 249, dur: 0 },
    { type: 'ama', emoji: '🙋', title: 'Ask Me Anything - AI', price: 50, dur: 0 },
    { type: 'referral', emoji: '🤝', title: 'NVIDIA/MS Referral', price: 599, dur: 30 },
    { type: 'course', emoji: '📚', title: 'Applied PyTorch Mini-Course', price: 499, dur: 0 },
    { type: 'workshop', emoji: '👥', title: 'Computer Vision Workshop', price: 349, dur: 120 },
    { type: 'webinar', emoji: '🖥️', title: 'Future of LLMs Webinar', price: 75, dur: 90 },
    { type: 'custom', emoji: '✨', title: 'Custom AI Consulting', price: 599, dur: 60 },
  ];

  for (const [i, svc] of servicesData.entries()) {
    await MentorService.create({
      mentorId: user._id,
      mentorProfileId: profile._id,
      serviceType: svc.type,
      emoji: svc.emoji,
      title: svc.title,
      description: `Comprehensive ${svc.title} designed for students and professionals. All aspects of the model schema are filled for this service.`,
      price: svc.price,
      isFree: false,
      duration: svc.dur || 60,
      includes: ['Step-by-step guidance', 'Resource materials', 'Action plan'],
      isFeatured: i < 4,
      sortOrder: i,
      currency: 'INR',
      responseTime: 'within 24 hours',
      sessionCount: 1,
      isActive: true,
      totalBookings: 0,
    });
    console.log(`  ✅ [${svc.type}] created with price ₹${svc.price}`);
  }

  console.log('\n🚀 ALL DONE — Chandan Jeena seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
