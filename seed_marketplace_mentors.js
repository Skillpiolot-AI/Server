/**
 * seed_marketplace_mentors.js
 * Seeds 4 realistic Topmate-style mentor profiles with:
 *   - User accounts
 *   - MentorProfile (with handle, customSections)
 *   - MentorService (diverse service types per mentor)
 *   - MentorCoupon (one coupon per mentor)
 *
 * Run: node seed_marketplace_mentors.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const connectDB = require('./db');
const User = require('./models/User');
const MentorProfile = require('./models/MentorProfile');
const MentorService = require('./models/MentorService');
const MentorCoupon = require('./models/MentorCoupon');

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MENTOR_DATA = [
  {
    name: 'Rahul Verma',
    handle: 'rahul_verma',
    email: 'rahul.mock@mentor-marketplace.com',
    jobTitle: 'SDE-3',
    company: 'Google',
    tagline: '🚀 Crack your dream FAANG interview | Ex-Amazon | 5 Years SDE',
    bio: "Hi! I'm Rahul, a Senior Software Engineer at Google with 5+ years of experience in distributed systems and algorithms.\n\nI've helped 200+ engineers land jobs at top tech companies including Google, Amazon, Microsoft, and Adobe.\n\nI specialize in:\n• DSA & Competitive Programming\n• System Design (LLD + HLD)\n• Mock Interviews with real feedback\n• Referrals at Google & Amazon",
    expertise: [
      'Data Structures',
      'System Design',
      'Backend Development',
      'Algorithms',
      'Java',
      'Python',
    ],
    targetingDomains: ['Computer Science', 'Software Engineering', 'IT'],
    city: 'Bangalore',
    rating: 4.9,
    totalMentees: 230,
    totalPlacements: 120,
    topCompanies: ['Google', 'Amazon', 'Microsoft'],
    languages: ['English', 'Hindi'],
    featured: true,
    couponCode: 'RAHUL15',
    services: [
      {
        serviceType: 'mock_interview',
        title: 'Full Mock Interview (DSA + System Design)',
        description:
          'A complete 90-min mock interview simulating the real FAANG process. DSA round + System Design + detailed written feedback.',
        emoji: '🎯',
        price: 1500,
        duration: 90,
        includes: [
          'DSA coding round',
          'System Design round',
          'Detailed feedback doc',
          'Improvement roadmap',
        ],
        isFeatured: true,
        sortOrder: 0,
      },
      {
        serviceType: 'one_on_one',
        title: '1:1 Mentorship Session',
        description:
          'A focused 60-min session on DSA, System Design, or career guidance. You set the agenda.',
        emoji: '💡',
        price: 999,
        duration: 60,
        sortOrder: 1,
      },
      {
        serviceType: 'resume_review',
        title: 'Resume Review + ATS Optimization',
        description:
          'I will review your resume, optimize for ATS, and rewrite key sections with strong impact statements.',
        emoji: '📄',
        price: 499,
        responseTime: 'Within 48 hours',
        sortOrder: 2,
      },
      {
        serviceType: 'referral',
        title: 'Job Referral at Google / Amazon',
        description:
          'I can refer you to open positions at Google or Amazon. Strong profile required. Limited slots per month.',
        emoji: '🤝',
        price: 0,
        isFree: true,
        referralCompanies: ['Google', 'Amazon'],
        weeklyLimit: 2,
        sortOrder: 3,
      },
      {
        serviceType: 'priority_dm',
        title: 'Priority DM Access',
        description:
          'Ask me anything about interviews, career decisions, or tech concepts. I reply within 24 hours.',
        emoji: '💬',
        price: 299,
        responseTime: 'Within 24 hours',
        sortOrder: 4,
      },
    ],
    customSections: [
      {
        title: '🏆 Success Stories',
        content:
          '✅ Akash — Google SWE (Hyderabad)\n✅ Priya — Amazon SDE-2 (Bangalore)\n✅ Rohit — Microsoft SDET (Noida)\n✅ Ananya — Flipkart SDE-1 (Bangalore)\n\n200+ placements in 3 years. DM me if you want to be next!',
        sortOrder: 0,
      },
    ],
    reviews: [
      {
        rating: 5,
        comment: 'Rahul is absolutely incredible. Got into Google after 3 months of mentorship!',
        createdAt: new Date('2024-11-15'),
      },
      {
        rating: 5,
        comment:
          'Best mock interviews I have ever had. Very detailed feedback and realistic interview simulation.',
        createdAt: new Date('2024-12-01'),
      },
      {
        rating: 4,
        comment: 'Very knowledgeable. Helped me crack Amazon system design rounds.',
        createdAt: new Date('2025-01-10'),
      },
    ],
  },

  {
    name: 'Priya Patel',
    handle: 'priya_ai',
    email: 'priya.mock@mentor-marketplace.com',
    jobTitle: 'ML Engineer',
    company: 'DeepMind',
    tagline: '🤖 Making AI accessible | ML Engineer at DeepMind | Ex-Microsoft Research',
    bio: "I'm Priya, an ML Engineer at DeepMind with a PhD in NLP from IIT Bombay.\n\nI help students and professionals break into the AI/ML field through structured learning paths, hands-on projects, and interview prep.\n\nAreas I mentor:\n• Machine Learning & Deep Learning\n• NLP & LLMs (GPT, BERT)\n• Python for Data Science\n• ML Research → Industry transition",
    expertise: ['Machine Learning', 'NLP', 'Deep Learning', 'Python', 'TensorFlow', 'PyTorch'],
    targetingDomains: ['Artificial Intelligence', 'Data Science', 'Computer Science'],
    city: 'Mumbai',
    rating: 4.8,
    totalMentees: 180,
    totalPlacements: 90,
    topCompanies: ['DeepMind', 'Microsoft', 'Meta AI'],
    languages: ['English', 'Hindi', 'Gujarati'],
    featured: true,
    couponCode: 'AISTART20',
    services: [
      {
        serviceType: 'coaching_series',
        title: 'ML Bootcamp — 8 Week Intensive',
        description:
          '8 weekly 60-min sessions covering everything from basics to production ML. Build 2 real projects.',
        emoji: '🧠',
        price: 5999,
        sessionCount: 8,
        includes: [
          '8 x 60-min live sessions',
          '2 hands-on projects',
          'GitHub portfolio',
          'Interview prep',
          'NLP specialization module',
        ],
        isFeatured: true,
        sortOrder: 0,
      },
      {
        serviceType: 'one_on_one',
        title: 'AI Career Guidance Session',
        description:
          'Personalized roadmap for breaking into ML/AI. Review your background and chart a learning plan.',
        emoji: '🗺️',
        price: 799,
        duration: 45,
        sortOrder: 1,
      },
      {
        serviceType: 'portfolio_review',
        title: 'ML Project / Portfolio Review',
        description:
          'I review your ML projects, Kaggle notebooks, or GitHub repos with in-depth written feedback.',
        emoji: '🖼️',
        price: 599,
        responseTime: 'Within 72 hours',
        sortOrder: 2,
      },
      {
        serviceType: 'ama',
        title: 'Ask Me Anything — AI/ML',
        description:
          'Submit your questions about AI careers, research, tools, or concepts. Get detailed async answers.',
        emoji: '🙋',
        price: 199,
        responseTime: 'Within 48 hours',
        sortOrder: 3,
      },
    ],
    customSections: [
      {
        title: '📚 What We Will Cover',
        content:
          'Week 1-2: Python, NumPy, Pandas, Data Preprocessing\nWeek 3-4: Supervised & Unsupervised Learning\nWeek 5: Deep Learning & Neural Networks\nWeek 6: NLP & Transformers\nWeek 7: MLOps & Model Deployment\nWeek 8: Mock Interviews & Portfolio Review',
        sortOrder: 0,
      },
    ],
    reviews: [
      {
        rating: 5,
        comment:
          'Priya helped me go from zero ML knowledge to landing an ML Intern role at Swiggy in 3 months!',
        createdAt: new Date('2024-10-20'),
      },
      {
        rating: 5,
        comment: 'Her explanations of transformers and attention mechanisms are phenomenal.',
        createdAt: new Date('2024-12-12'),
      },
      {
        rating: 4,
        comment: 'Very structured and knowledgeable. Highly recommend the 8-week bootcamp.',
        createdAt: new Date('2025-02-01'),
      },
    ],
  },

  {
    name: 'Sneha Reddy',
    handle: 'sneha_fullstack',
    email: 'sneha.mock@mentor-marketplace.com',
    jobTitle: 'Senior Product Engineer',
    company: 'Razorpay',
    tagline: '⚡ Full Stack Dev | React + Node.js | Helping you build real-world apps',
    bio: "I'm Sneha, a Senior Product Engineer at Razorpay with 6 years of experience in full-stack development.\n\nI've built large-scale fintech apps and love teaching others how to do the same — with clean code, good architecture, and real-world patterns.\n\nWhat I can help with:\n• React, TypeScript, Next.js\n• Node.js, Express, MongoDB\n• System Architecture & Code Review\n• Landing your first dev job",
    expertise: ['React', 'Node.js', 'Full Stack Development', 'TypeScript', 'MongoDB', 'Next.js'],
    targetingDomains: ['Web Development', 'Computer Science', 'Software Engineering'],
    city: 'Bangalore',
    rating: 4.9,
    totalMentees: 260,
    totalPlacements: 160,
    topCompanies: ['Razorpay', 'PhonePe', 'Zepto'],
    languages: ['English', 'Telugu', 'Hindi'],
    featured: true,
    couponCode: 'CODE10',
    services: [
      {
        serviceType: 'one_on_one',
        title: '1:1 Full Stack Mentorship',
        description:
          'Hands-on 60-min session where we solve your actual coding problems, review your project, or design architecture.',
        emoji: '💻',
        price: 899,
        duration: 60,
        isFeatured: true,
        sortOrder: 0,
      },
      {
        serviceType: 'mock_interview',
        title: 'SDE Mock Interview (Frontend/Backend)',
        description:
          'Real-world interview simulation with JavaScript fundamentals, React concepts, and take-home challenge review.',
        emoji: '🎯',
        price: 1299,
        duration: 75,
        sortOrder: 1,
      },
      {
        serviceType: 'resume_review',
        title: 'Developer Resume & LinkedIn Review',
        description:
          'Comprehensive review of your resume and LinkedIn. Rewrites, ATS tips, project descriptions, GitHub cleanup checklist.',
        emoji: '📋',
        price: 399,
        responseTime: 'Within 48 hours',
        sortOrder: 2,
      },
      {
        serviceType: 'course',
        title: 'Full Stack Crash Course (Self-Paced)',
        description:
          'Pre-recorded 12-hour course: React + Node.js + MongoDB. Build a complete todo + auth + payment app.',
        emoji: '📚',
        price: 1999,
        courseUrl: 'https://courses.skillpilot.com/sneha-fullstack',
        sortOrder: 3,
      },
      {
        serviceType: 'priority_dm',
        title: 'Priority DM — Monthly',
        description:
          'Stuck on a bug? Need code review? Architecture advice? Subscribe for unlimited async questions monthly.',
        emoji: '💬',
        price: 499,
        responseTime: 'Within 12 hours',
        sortOrder: 4,
      },
    ],
    customSections: [],
    reviews: [
      {
        rating: 5,
        comment:
          'Sneha is the best mentor I ever had! Clear explanations and very patient with beginners.',
        createdAt: new Date('2025-01-05'),
      },
      {
        rating: 5,
        comment:
          'Her code review sessions are gold. Learned more in 1 hour than weeks of tutorials.',
        createdAt: new Date('2025-02-14'),
      },
      {
        rating: 5,
        comment: "Got my first dev job at a startup thanks to Sneha's guidance!",
        createdAt: new Date('2025-03-01'),
      },
    ],
  },

  {
    name: 'Riya Sen',
    handle: 'riya_design',
    email: 'riya.mock@mentor-marketplace.com',
    jobTitle: 'Lead UX Designer',
    company: 'Meesho',
    tagline: '🎨 UX & Product Designer | Figma Expert | Career Switcher Specialist',
    bio: "Hey! I'm Riya, Lead UX Designer at Meesho and a Figma community advocate.\n\nI switched from mechanical engineering to UX design 5 years ago — so I know exactly how overwhelming the switch feels. I've helped 50+ career switchers get their first design job.\n\nI can help with:\n• UX Design Fundamentals\n• Portfolio Building (from scratch)\n• Figma advanced workflows\n• Design thinking & user research\n• Case study writing for job applications",
    expertise: [
      'UI/UX Design',
      'Figma',
      'User Research',
      'Design Thinking',
      'Prototyping',
      'Product Design',
    ],
    targetingDomains: ['Design', 'HCI', 'Product Management'],
    city: 'Pune',
    rating: 4.9,
    totalMentees: 140,
    totalPlacements: 85,
    topCompanies: ['Meesho', 'Zomato', 'CRED'],
    languages: ['English', 'Bengali', 'Hindi'],
    featured: false,
    couponCode: 'DESIGN25',
    services: [
      {
        serviceType: 'career_guidance',
        title: 'Career Switch into UX Design',
        description:
          '45-min session: we evaluate your background, identify transferable skills, and create a 90-day plan to get your first design role.',
        emoji: '🗺️',
        price: 699,
        duration: 45,
        isFeatured: true,
        sortOrder: 0,
      },
      {
        serviceType: 'portfolio_review',
        title: 'UX Portfolio Review',
        description:
          'Detailed async review of your design portfolio. I score each case study and give rewrite suggestions to impress top companies.',
        emoji: '🎨',
        price: 799,
        responseTime: 'Within 72 hours',
        includes: [
          'Case study structure feedback',
          'Visual design critique',
          'Story-telling improvement',
          'Hiring manager perspective',
        ],
        sortOrder: 1,
      },
      {
        serviceType: 'workshop',
        title: 'Figma Masterclass — Live Group Workshop',
        description:
          'Live 3-hour Figma workshop covering components, auto-layout, prototyping, and dev handoff. Limited to 15 participants.',
        emoji: '🖥️',
        price: 999,
        duration: 180,
        capacity: 15,
        scheduledAt: new Date('2025-04-05T14:00:00Z'),
        sortOrder: 2,
      },
      {
        serviceType: 'one_on_one',
        title: 'Design Feedback Session',
        description:
          'Share your current designs or wireframes. I give live critiques and suggest improvements based on UX best practices.',
        emoji: '✏️',
        price: 599,
        duration: 45,
        sortOrder: 3,
      },
      {
        serviceType: 'priority_dm',
        title: 'DM Me — Design Questions',
        description:
          'Got a quick design question? Figma issue? Portfolio confusion? Subscribe and ping me any time.',
        emoji: '💬',
        price: 249,
        responseTime: 'Within 24 hours',
        sortOrder: 4,
      },
    ],
    customSections: [
      {
        title: '💼 My Design Journey',
        content:
          "2018 — Graduated Mechanical Engineering, felt lost\n2019 — Discovered UX design by accident, took a free Google course\n2020 — First design internship at a Pune startup\n2021 — Joined Meesho as Junior UX Designer\n2023 — Promoted to Lead UX Designer\n\nIf I could make the switch, so can you! Book a career guidance session and let's map out your path.",
        sortOrder: 0,
      },
    ],
    reviews: [
      {
        rating: 5,
        comment:
          'Riya completely transformed my portfolio. Got interview calls from 3 top companies within a week!',
        createdAt: new Date('2024-09-10'),
      },
      {
        rating: 5,
        comment:
          'As a career switcher, her guidance was invaluable. She understood my situation perfectly.',
        createdAt: new Date('2024-11-22'),
      },
      {
        rating: 4,
        comment: 'The Figma workshop was excellent. Very practical and well-structured.',
        createdAt: new Date('2025-01-30'),
      },
    ],
  },
];

// ─── Seed Function ─────────────────────────────────────────────────────────────

async function seed() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Mentor@123', salt);

    // Clean previous marketplace seed
    const oldUsers = await User.find({ email: /@mentor-marketplace\.com$/ });
    if (oldUsers.length > 0) {
      const ids = oldUsers.map(u => u._id);
      await Promise.all([
        MentorProfile.deleteMany({ userId: { $in: ids } }),
        MentorService.deleteMany({ mentorId: { $in: ids } }),
        MentorCoupon.deleteMany({ mentorId: { $in: ids } }),
        User.deleteMany({ _id: { $in: ids } }),
      ]);
      console.log(`🗑️  Cleaned up ${oldUsers.length} previous mock mentors`);
    }

    const credentials = [];

    for (const data of MENTOR_DATA) {
      // ── User ──
      const username = `mock_${data.handle}`;
      const user = new User({
        username,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'Mentor',
        mentorStatus: 'approved',
        mentorBadge: 'verified',
        isActive: true,
        isVerified: true,
        jobTitle: data.jobTitle,
        company: data.company,
        totalPlacements: data.totalPlacements,
        mentorRating: data.rating,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random&size=128&bold=true&color=fff`,
      });
      await user.save();

      // ── Reviews ──
      const reviews = data.reviews.map(r => ({
        userId: user._id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      }));

      // ── MentorProfile ──
      const profile = new MentorProfile({
        userId: user._id,
        displayName: data.name,
        handle: data.handle,
        tagline: data.tagline,
        bio: data.bio,
        profileImage: user.imageUrl,
        location: { city: data.city, country: 'India' },
        expertise: data.expertise,
        targetingDomains: data.targetingDomains,
        preferredMenteeType: ['Student', 'Fresher', 'Career Switch'],
        languages: data.languages,
        totalPlacements: data.totalPlacements,
        totalMentees: data.totalMentees,
        averageRating: data.rating,
        totalReviews: data.reviews.length,
        totalEarnings: 0,
        pricingType: 'paid',
        pricingPlans: [],
        trialSession: { available: true, price: 0, description: 'Free 15-min intro call.' },
        sectorType: 'private',
        referralsInTopCompanies: true,
        topCompanies: data.topCompanies,
        socialLinks: {
          linkedIn: `https://linkedin.com/in/${data.handle}`,
          github: `https://github.com/${data.handle}`,
          twitter: `https://twitter.com/${data.handle}`,
          portfolio: `https://skillpilot.app/mentor/${data.handle}`,
        },
        featured: data.featured,
        isVisible: true,
        searchTags: [...data.expertise, ...data.targetingDomains].map(t => t.toLowerCase()),
        education: [
          {
            degree: 'B.Tech',
            field: data.targetingDomains[0],
            institution: 'Premier Institute of Technology',
            year: 2018,
          },
        ],
        certifications: [
          {
            name: `Certified ${data.expertise[0]} Professional`,
            issuer: 'Global Board',
            year: 2020,
            credentialUrl: 'https://credential.net',
          },
        ],
        reviews,
        customSections: data.customSections.map(s => ({ ...s, isVisible: true })),
        availabilitySlots: [
          { day: 'Monday', startTime: '19:00', endTime: '22:00', isAvailable: true },
          { day: 'Wednesday', startTime: '19:00', endTime: '22:00', isAvailable: true },
          { day: 'Saturday', startTime: '10:00', endTime: '14:00', isAvailable: true },
        ],
      });
      await profile.save();

      // Link profile to user
      user.mentorProfile = profile._id;
      await user.save();

      // ── MentorService ──
      for (const svc of data.services) {
        const service = new MentorService({
          mentorId: user._id,
          mentorProfileId: profile._id,
          isActive: true,
          isFree: svc.isFree || svc.price === 0,
          currency: 'INR',
          ...svc,
        });
        await service.save();
      }
      console.log(`  ✔ Created ${data.services.length} services for ${data.name}`);

      // ── MentorCoupon ──
      const coupon = new MentorCoupon({
        mentorId: user._id,
        code: data.couponCode,
        discountType: 'percentage',
        discountValue: parseInt(data.couponCode.match(/\d+/)?.[0] || '10'),
        appliesTo: 'all_services',
        maxUses: 100,
        perUserLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true,
      });
      await coupon.save();
      console.log(`  🎟️  Coupon: ${data.couponCode} (${coupon.discountValue}% off)`);

      credentials.push({
        name: data.name,
        handle: data.handle,
        email: data.email,
        password: 'Mentor@123',
        coupon: data.couponCode,
      });
      console.log(`✅ Created mentor: ${data.name} (@${data.handle})`);
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('📋 Mentor credentials:');
    credentials.forEach(c => {
      console.log(`  ${c.name} (@${c.handle})`);
      console.log(`    Email: ${c.email}`);
      console.log(`    Password: ${c.password}`);
      console.log(`    Test coupon: ${c.coupon}`);
      console.log(`    Profile URL: /mentor/${c.handle}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
