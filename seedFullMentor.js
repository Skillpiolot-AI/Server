/**
 * seedFullMentor.js
 * Creates ONE fully-loaded mentor with ALL 15 service types,
 * complete MentorProfile, and logs all credentials.
 *
 * Run: node seedFullMentor.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const fs       = require('fs');
const path     = require('path');

const User          = require('./models/User');
const MentorProfile = require('./models/MentorProfile');
const MentorService = require('./models/MentorService');

// ─── Connect ─────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to MongoDB');

  // ── 1. Create User ────────────────────────────────────────────────────────
  const plain     = 'FullMentor@2024!';
  const hashed    = await bcrypt.hash(plain, 10);
  const email_addr = 'rahul.kapoor@skillpilot.dev';

  let user = await User.findOne({ email: email_addr });
  if (user) {
    console.log('⚠️  Mentor user already exists, reusing...');
  } else {
    user = await User.create({
      username    : 'rahul_kapoor',
      name        : 'Rahul Kapoor',
      email       : email_addr,
      password    : hashed,
      role        : 'Mentor',
      jobTitle    : 'Staff Engineer & Career Coach',
      experience  : 10,
      isActive    : true,
      isVerified  : true,
      authProvider: 'local',
      mentorStatus: 'approved',
      mentorBadge : 'star',
      mentorVerification: {
        emailVerified   : true,
        emailVerifiedAt : new Date(),
        phoneVerified   : true,
        phoneVerifiedAt : new Date(),
        documentVerified: true,
        documentVerifiedAt: new Date(),
      },
      totalPlacements : 48,
      mentorRating    : 4.9,
      totalReviews    : 112,
      companiesJoined : ['Google', 'Atlassian', 'Swiggy'],
      securitySettings: {
        twoFactorEnabled    : false,
        emailNotifications  : true,
        loginAlerts         : true,
        allowMultipleSessions: true,
      },
    });
    console.log('✅ User created:', user._id);
  }

  // ── 2. Create / Reuse MentorProfile ──────────────────────────────────────
  let profile = await MentorProfile.findOne({ userId: user._id });
  if (profile) {
    console.log('⚠️  MentorProfile already exists, reusing...');
  } else {
    profile = await MentorProfile.create({
      userId      : user._id,
      displayName : 'Rahul Kapoor',
      handle      : 'rahul_kapoor',
      tagline     : 'Staff Engineer @ Google | 10 Yrs | 48 Placements | DSA + System Design',
      bio         : `Ex-Googler with 10 years in backend engineering and system design. I've helped 200+ engineers crack FAANG and top product companies. My sessions are results-first — we work backwards from your target role and build the fastest path there.`,
      profileImage: '',
      location    : { city: 'Bangalore', state: 'Karnataka', country: 'India' },
      expertise   : ['DSA', 'System Design', 'HLD', 'LLD', 'Java', 'Python', 'API Design', 'Distributed Systems'],
      targetingDomains: ['Backend Developer', 'Fullstack', 'Data Engineer', 'SDE-2 / SDE-3'],
      preferredMenteeType: ['Fresher', 'Working Professional', 'Career Switch'],
      languages   : ['English', 'Hindi'],
      totalPlacements  : 48,
      totalMentees     : 220,
      averageRating    : 4.9,
      totalReviews     : 112,
      sessionsPerWeek  : 5,
      sessionDuration  : 60,
      pricingType      : 'paid',
      pricingPlans: [
        { duration: '1 Month',  price: 3999, discountPercent: 0,  features: ['4 sessions', 'Resume review', 'Mock interview'] },
        { duration: '3 Months', price: 9999, discountPercent: 17, features: ['12 sessions', 'Resume review', '2x Mock interview', 'Referral support'] },
        { duration: '6 Months', price: 16999, discountPercent: 29, features: ['24 sessions', 'Resume review', '4x Mock interview', 'Referral support', 'Job tracking'] },
      ],
      trialSession: { available: true, price: 499, description: '30-min intro call to assess fit and create a personalised roadmap.' },
      sectorType  : 'private',
      availabilitySlots: [
        { day: 'Monday',    startTime: '18:00', endTime: '21:00', isAvailable: true },
        { day: 'Tuesday',   startTime: '19:00', endTime: '21:00', isAvailable: true },
        { day: 'Thursday',  startTime: '18:00', endTime: '21:00', isAvailable: true },
        { day: 'Saturday',  startTime: '09:00', endTime: '14:00', isAvailable: true },
        { day: 'Sunday',    startTime: '10:00', endTime: '13:00', isAvailable: true },
      ],
      referralsInTopCompanies: true,
      topCompanies: ['Google', 'Atlassian', 'Swiggy', 'Razorpay', 'Microsoft', 'Amazon'],
      curriculum: {
        available   : true,
        description : 'Structured 12-week curriculum from basics to FAANG-ready system design.',
        topics      : ['Arrays & Strings', 'Trees & Graphs', 'DP', 'System Design Fundamentals', 'HLD', 'LLD', 'Behavioural Interview Prep'],
      },
      socialLinks: {
        linkedIn : 'https://linkedin.com/in/rahul_kapoor',
        github   : 'https://github.com/rahul_kapoor',
        twitter  : 'https://twitter.com/rahul_kapoor',
        portfolio: 'https://rahulkapoor.dev',
        youtube  : 'https://youtube.com/@rahulkapoor',
      },
      featured   : true,
      isVisible  : true,
      searchTags : ['FAANG', 'DSA', 'System Design', 'Google', 'Backend', 'Java', 'HLD', 'LLD', 'Python'],
      education  : [
        { degree: 'B.Tech', field: 'Computer Science', institution: 'IIT Delhi', year: 2013 },
      ],
      certifications: [
        { name: 'Google Cloud Professional Architect', issuer: 'Google', year: 2021 },
        { name: 'AWS Solutions Architect', issuer: 'Amazon', year: 2022 },
      ],
      reviews: [
        {
          userId   : user._id,   // self-ref placeholder (replace with real userId in prod)
          rating   : 5,
          comment  : 'Rahul helped me crack SDE-2 at Razorpay in just 6 weeks. His system design sessions are top-notch!',
          createdAt: new Date('2024-08-15'),
        },
        {
          userId   : user._id,
          rating   : 5,
          comment  : 'Best mentor on the platform. Very structured approach, not generic advice.',
          createdAt: new Date('2024-10-02'),
        },
        {
          userId   : user._id,
          rating   : 4,
          comment  : 'Great DSA sessions. Helped me get into Atlassian.',
          createdAt: new Date('2025-01-20'),
        },
      ],
    });

    // Link back to user
    await User.findByIdAndUpdate(user._id, { mentorProfile: profile._id });
    console.log('✅ MentorProfile created:', profile._id);
  }

  // ── 3. Delete any stale services for this mentor (re-seed cleanly) ────────
  const existingCount = await MentorService.countDocuments({ mentorId: user._id });
  if (existingCount > 0) {
    await MentorService.deleteMany({ mentorId: user._id });
    console.log(`🗑️  Deleted ${existingCount} old services`);
  }

  // ── 4. Create ALL 15 service types ───────────────────────────────────────
  const services = [
    // ── Live Sessions ──────────────────────────────────────────────────────
    {
      serviceType : 'discovery_call',
      emoji       : '🌱',
      title       : 'Free Discovery Call',
      description : '30-min no-commitment intro to understand your goals and see if we are a good fit.',
      price       : 0,
      isFree      : true,
      duration    : 30,
      includes    : ['Goal assessment', 'Personalised roadmap preview', 'Q&A'],
      isFeatured  : true,
      sortOrder   : 0,
      weeklyLimit : 3,
    },
    {
      serviceType : 'one_on_one',
      emoji       : '🎥',
      title       : '1:1 Mentorship Session',
      description : 'Deep-dive 60-min live session. DSA problem solving, system design, or code review — you choose the topic.',
      price       : 1499,
      isFree      : false,
      duration    : 60,
      includes    : ['Session recording', 'Notes & action items', 'Slack follow-up for 24h'],
      isFeatured  : true,
      sortOrder   : 1,
      weeklyLimit : 5,
    },
    {
      serviceType : 'quick_chat',
      emoji       : '⚡',
      title       : 'Quick Chat — 15 Min',
      description : 'Rapid fire 15-min call for a specific doubt or quick career advice. Best value for simple questions.',
      price       : 399,
      isFree      : false,
      duration    : 15,
      includes    : ['Direct answer to your question', 'Resource links'],
      sortOrder   : 2,
    },
    {
      serviceType : 'mock_interview',
      emoji       : '🎯',
      title       : 'Mock Interview — DSA / System Design',
      description : 'Realistic 60-min FAANG-style mock interview followed by detailed written feedback.',
      price       : 1999,
      isFree      : false,
      duration    : 60,
      includes    : ['SWE-level question', 'Live feedback', 'Written debrief', 'Improvement plan'],
      isFeatured  : true,
      sortOrder   : 3,
      weeklyLimit : 4,
    },
    {
      serviceType  : 'career_guidance',
      emoji        : '🧭',
      title        : 'Career Strategy Call',
      description  : '45-min session to map out your career path — switching companies, negotiating offers, or transitioning roles.',
      price        : 1299,
      isFree       : false,
      duration     : 45,
      includes     : ['Role gap analysis', 'Roadmap document', 'Offer negotiation tips'],
      sortOrder    : 4,
    },
    {
      serviceType  : 'coaching_series',
      emoji        : '🗓️',
      title        : '6-Week FAANG Bootcamp',
      description  : 'Structured 6-week program with 12 live 1:1 sessions. From DSA basics to full system design mock interview.',
      price        : 14999,
      isFree       : false,
      duration     : 60,
      sessionCount : 12,
      includes     : ['12 live sessions', 'Custom study plan', '2 full mock interviews', 'Resume review', 'Referral consideration', 'Discord community access'],
      isFeatured   : true,
      sortOrder    : 5,
    },

    // ── Async / On-Demand ──────────────────────────────────────────────────
    {
      serviceType  : 'priority_dm',
      emoji        : '💬',
      title        : 'Priority DM — Monthly Inbox',
      description  : 'Send me unlimited messages for a month. I respond within 24 hours. Best for ongoing job searches.',
      price        : 999,
      isFree       : false,
      subscriptionMonths: 1,
      responseTime : 'within 24 hours',
      includes     : ['Unlimited messages / month', '24h response SLA', 'Code snippet reviews', 'Job referral requests'],
      sortOrder    : 6,
    },
    {
      serviceType  : 'resume_review',
      emoji        : '📄',
      title        : 'ATS Resume Review',
      description  : 'Upload your resume and get detailed written feedback with edits — formatted for FAANG ATS systems.',
      price        : 799,
      isFree       : false,
      responseTime : 'within 48 hours',
      includes     : ['Line-by-line review', 'ATS score improvement tips', 'Impact-driven bullet rewrites', 'PDF with comments'],
      sortOrder    : 7,
    },
    {
      serviceType  : 'portfolio_review',
      emoji        : '🖼️',
      title        : 'GitHub / Portfolio Review',
      description  : 'Share your GitHub or portfolio URL. I will review code quality, readme standards, and project presentation.',
      price        : 599,
      isFree       : false,
      responseTime : 'within 48 hours',
      includes     : ['Code quality review', 'Project README feedback', 'Recruiter-readiness score', 'Written action items'],
      sortOrder    : 8,
    },
    {
      serviceType  : 'ama',
      emoji        : '🙋',
      title        : 'Ask Me Anything — 1 Question',
      description  : 'Submit one detailed question. I send you a thorough written (or Loom video) response within 48 hours.',
      price        : 299,
      isFree       : false,
      responseTime : 'within 48 hours',
      includes     : ['Detailed written answer', 'Optional Loom video response', 'Follow-up allowed once'],
      sortOrder    : 9,
    },

    // ── Digital Products ───────────────────────────────────────────────────
    {
      serviceType  : 'referral',
      emoji        : '🤝',
      title        : 'Employee Referral — Google / Atlassian / Swiggy',
      description  : 'I will refer your profile internally at Google, Atlassian, or Swiggy after a 30-min screening call.',
      price        : 2499,
      isFree       : false,
      referralCompanies: ['Google', 'Atlassian', 'Swiggy'],
      includes     : ['30-min screening call', 'Internal referral submission', 'Interview prep tips for that company', 'Status follow-up'],
      sortOrder    : 10,
    },
    {
      serviceType  : 'course',
      emoji        : '📚',
      title        : 'Complete DSA + System Design Masterclass',
      description  : 'Self-paced video course: 80+ hours covering every LeetCode pattern + HLD/LLD for FAANG interviews.',
      price        : 4999,
      isFree       : false,
      courseUrl    : 'https://courses.rahulkapoor.dev/dsa-masterclass',
      includes     : ['80+ hours of video', 'LeetCode patterns cheatsheet', 'HLD + LLD case studies', 'Discord community', 'Lifetime access'],
      isFeatured   : true,
      sortOrder    : 11,
    },

    // ── Group Events ──────────────────────────────────────────────────────
    {
      serviceType  : 'workshop',
      emoji        : '👥',
      title        : 'System Design Workshop — Live (Batch)',
      description  : 'Live 3-hour interactive workshop (max 20 students). We design 3 real-world systems end-to-end.',
      price        : 1499,
      isFree       : false,
      duration     : 180,
      capacity     : 20,
      scheduledAt  : new Date('2025-04-05T11:00:00+05:30'),
      includes     : ['Live session recording', 'Design diagrams PDF', 'Q&A throughout', 'Discord access'],
      sortOrder    : 12,
    },
    {
      serviceType  : 'webinar',
      emoji        : '🖥️',
      title        : 'FAANG Interview Masterclass — Free Webinar',
      description  : 'Free 90-min live webinar: roadmap to crack top product companies in 2025. Q&A at the end.',
      price        : 0,
      isFree       : true,
      duration     : 90,
      capacity     : 200,
      scheduledAt  : new Date('2025-04-12T19:00:00+05:30'),
      includes     : ['Live recording', 'Slides PDF', 'Resource list', 'Q&A'],
      isFeatured   : true,
      sortOrder    : 13,
    },

    // ── Custom ──────────────────────────────────────────────────────────────
    {
      serviceType  : 'custom',
      emoji        : '✨',
      title        : 'Custom Engagement — Let\'s Design It Together',
      description  : 'Need something that doesn\'t fit the above? Team training, company workshops, long-term coaching — reach out and we\'ll scope it.',
      price        : 0,
      isFree       : true,
      includes     : ['Scoping call', 'Tailored proposal', 'Flexible delivery format'],
      sortOrder    : 14,
    },
  ];

  const created = [];
  for (const svc of services) {
    const doc = await MentorService.create({
      mentorId       : user._id,
      mentorProfileId: profile._id,
      currency       : 'INR',
      responseTime   : svc.responseTime || 'within 48 hours',
      sessionCount   : svc.sessionCount || 1,
      subscriptionMonths: svc.subscriptionMonths || 1,
      weeklyLimit    : svc.weeklyLimit || null,
      capacity       : svc.capacity || null,
      scheduledAt    : svc.scheduledAt || null,
      courseUrl      : svc.courseUrl || undefined,
      referralCompanies: svc.referralCompanies || [],
      isActive       : true,
      totalBookings  : 0,
      ...svc,
    });
    created.push(doc);
    console.log(`  ✅ [${svc.serviceType}] ${svc.title}`);
  }

  // ── 5. Write credentials + service summary ────────────────────────────────
  const lines = [
    '═'.repeat(70),
    '  SKILLPILOT — FULL MENTOR SEED',
    `  Generated: ${new Date().toISOString()}`,
    '═'.repeat(70),
    '',
    '── MENTOR CREDENTIALS ──────────────────────────────────────────────────',
    `Name        : Rahul Kapoor`,
    `Username    : rahul_kapoor`,
    `Email       : ${email_addr}`,
    `Password    : ${plain}`,
    `Role        : Mentor`,
    `Badge       : ⭐ Star`,
    `Status      : Approved & Verified`,
    `Handle      : /mentor/rahul_kapoor`,
    `Expertise   : DSA, System Design, HLD, LLD, Java, Python`,
    `Placements  : 48 | Rating: 4.9 ⭐ | Reviews: 112`,
    `Referrals   : Google, Atlassian, Swiggy, Razorpay, Microsoft, Amazon`,
    '',
    '── SERVICES CREATED (15 total) ──────────────────────────────────────────',
  ];

  const typeLabel = {
    discovery_call : '🌱 [LIVE]    Discovery Call',
    one_on_one     : '🎥 [LIVE]    1:1 Session',
    quick_chat     : '⚡ [LIVE]    Quick Chat',
    mock_interview : '🎯 [LIVE]    Mock Interview',
    career_guidance: '🧭 [LIVE]    Career Guidance',
    coaching_series: '🗓️  [LIVE]    Coaching Series',
    priority_dm    : '💬 [ASYNC]   Priority DM',
    resume_review  : '📄 [ASYNC]   Resume Review',
    portfolio_review:'🖼️  [ASYNC]   Portfolio Review',
    ama            : '🙋 [ASYNC]   Ask Me Anything',
    referral       : '🤝 [PRODUCT] Referral',
    course         : '📚 [PRODUCT] Course',
    workshop       : '👥 [GROUP]   Workshop',
    webinar        : '🖥️  [GROUP]   Webinar',
    custom         : '✨ [CUSTOM]  Custom',
  };

  created.forEach((svc, i) => {
    const label = typeLabel[svc.serviceType] || svc.serviceType;
    const price = svc.isFree ? 'FREE' : `₹${svc.price.toLocaleString('en-IN')}`;
    lines.push(`  ${String(i + 1).padStart(2, '0')}. ${label}`);
    lines.push(`       Title    : ${svc.title}`);
    lines.push(`       Price    : ${price}`);
    lines.push(`       Duration : ${svc.duration ? svc.duration + ' min' : svc.responseTime || '—'}`);
    if (svc.capacity) lines.push(`       Capacity : ${svc.capacity} attendees`);
    lines.push('');
  });

  lines.push('═'.repeat(70));
  lines.push('  END');
  lines.push('═'.repeat(70));

  const outPath = path.join(__dirname, 'seed_full_mentor.txt');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');

  console.log('\n' + '═'.repeat(55));
  console.log('✅ ALL DONE — 15 services created for Rahul Kapoor');
  console.log(`📄 Details saved to: ${outPath}`);
  console.log('═'.repeat(55));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
