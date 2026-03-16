/**
 * seedUsers.js
 * Creates seed data for ALL roles:
 *   - 1 Admin
 *   - 10 Mentors (with MentorProfile)
 *   - 10 Regular Users (with Profile)
 *   - 1 University (document)
 *   - 1 UniAdmin (with Profile)
 *   - 1 UniTeach (with Profile)
 *
 * Saves all credentials to: seed_credentials.txt
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Models ──────────────────────────────────────────────────────────────────
const User = require('./models/User');
const MentorProfile = require('./models/MentorProfile');
const Profile = require('./models/Profile');
const University = require('./models/University');

// ── Helpers ──────────────────────────────────────────────────────────────────
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

// ── Data pools ──────────────────────────────────────────────────────────────

const mentorData = [
  {
    name: 'Arjun Sharma',
    username: 'arjun_sharma',
    email: 'arjun.sharma@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'Senior Software Engineer',
    expertise: ['DSA', 'Java', 'System Design'],
    targetingDomains: ['Backend Developer', 'Fullstack'],
    handle: 'arjun_sharma',
    tagline: 'Helping you crack FAANG interviews',
    bio: 'Ex-Google engineer with 7 years of experience. Specialized in DSA, Java and System Design.',
    city: 'Bangalore',
    state: 'Karnataka',
    topCompanies: ['Google', 'Facebook'],
    experience: 7,
  },
  {
    name: 'Priya Nair',
    username: 'priya_nair',
    email: 'priya.nair@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'Lead Frontend Engineer',
    expertise: ['React', 'TypeScript', 'CSS'],
    targetingDomains: ['Frontend Developer', 'UI/UX'],
    handle: 'priya_nair',
    tagline: 'React & TypeScript specialist',
    bio: 'Led front-end teams at Swiggy and Zomato. Passionate about accessible, performant UIs.',
    city: 'Mumbai',
    state: 'Maharashtra',
    topCompanies: ['Swiggy', 'Zomato'],
    experience: 6,
  },
  {
    name: 'Rohan Mehta',
    username: 'rohan_mehta',
    email: 'rohan.mehta@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'ML Engineer',
    expertise: ['Machine Learning', 'Python', 'TensorFlow'],
    targetingDomains: ['Data Science', 'AI/ML'],
    handle: 'rohan_mehta',
    tagline: 'From notebooks to production ML',
    bio: 'Working at Amazon AI. Mentored 50+ data science transitions.',
    city: 'Hyderabad',
    state: 'Telangana',
    topCompanies: ['Amazon', 'Microsoft'],
    experience: 5,
  },
  {
    name: 'Sneha Patel',
    username: 'sneha_patel',
    email: 'sneha.patel@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'DevOps Architect',
    expertise: ['Kubernetes', 'AWS', 'CI/CD'],
    targetingDomains: ['DevOps', 'Cloud'],
    handle: 'sneha_patel',
    tagline: 'Ship faster, fail safely',
    bio: 'AWS Certified Architect. Built CI/CD pipelines for 30+ enterprise teams.',
    city: 'Pune',
    state: 'Maharashtra',
    topCompanies: ['Infosys', 'Wipro'],
    experience: 8,
  },
  {
    name: 'Vikram Reddy',
    username: 'vikram_reddy',
    email: 'vikram.reddy@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'Product Manager',
    expertise: ['Product Strategy', 'Agile', 'User Research'],
    targetingDomains: ['Product Management'],
    handle: 'vikram_reddy',
    tagline: 'Build products people love',
    bio: 'PM at Flipkart. Launched 5 products with 1M+ DAU.',
    city: 'Chennai',
    state: 'Tamil Nadu',
    topCompanies: ['Flipkart', 'Paytm'],
    experience: 9,
  },
  {
    name: 'Ananya Singh',
    username: 'ananya_singh',
    email: 'ananya.singh@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'Data Engineer',
    expertise: ['Apache Spark', 'SQL', 'Databricks'],
    targetingDomains: ['Data Engineering', 'Analytics'],
    handle: 'ananya_singh',
    tagline: 'Making data pipelines elegant',
    bio: 'Data Engineer at Razorpay. Expert in building scalable data platforms.',
    city: 'Delhi',
    state: 'Delhi',
    topCompanies: ['Razorpay', 'PhonePe'],
    experience: 5,
  },
  {
    name: 'Kiran Kumar',
    username: 'kiran_kumar',
    email: 'kiran.kumar@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'Cybersecurity Consultant',
    expertise: ['Penetration Testing', 'OWASP', 'ISO 27001'],
    targetingDomains: ['Cybersecurity'],
    handle: 'kiran_kumar',
    tagline: 'Hack defensively, protect offensively',
    bio: 'CEH certified. Has secured systems for banks and fintech.',
    city: 'Kolkata',
    state: 'West Bengal',
    topCompanies: ['HDFC', 'SBI Tech'],
    experience: 7,
  },
  {
    name: 'Megha Joshi',
    username: 'megha_joshi',
    email: 'megha.joshi@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'Mobile Developer',
    expertise: ['React Native', 'Flutter', 'iOS'],
    targetingDomains: ['Mobile Developer'],
    handle: 'megha_joshi',
    tagline: 'Cross-platform mobile expert',
    bio: 'Built apps with 4M+ downloads. Expert in React Native & Flutter.',
    city: 'Ahmedabad',
    state: 'Gujarat',
    topCompanies: ["BYJU'S", 'Unacademy'],
    experience: 6,
  },
  {
    name: 'Suresh Babu',
    username: 'suresh_babu',
    email: 'suresh.babu@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'Blockchain Developer',
    expertise: ['Solidity', 'Web3', 'Ethereum'],
    targetingDomains: ['Blockchain', 'Web3'],
    handle: 'suresh_babu',
    tagline: 'Decentralize everything',
    bio: 'Smart contract developer. Audited $100M+ DeFi protocols.',
    city: 'Jaipur',
    state: 'Rajasthan',
    topCompanies: ['Polygon', 'CoinDCX'],
    experience: 4,
  },
  {
    name: 'Deepika Rao',
    username: 'deepika_rao',
    email: 'deepika.rao@skillpilot.dev',
    password: 'Mentor@1234',
    jobTitle: 'UX Designer',
    expertise: ['Figma', 'User Research', 'Design Systems'],
    targetingDomains: ['UI/UX Design'],
    handle: 'deepika_rao',
    tagline: 'Design that delights users',
    bio: 'Senior UX Designer at Meesho. Advocate for inclusive design.',
    city: 'Bangalore',
    state: 'Karnataka',
    topCompanies: ['Meesho', 'OYO'],
    experience: 5,
  },
];

const userData = [
  {
    name: 'Ravi Gupta',
    username: 'ravi_gupta',
    email: 'ravi.gupta@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Pooja Verma',
    username: 'pooja_verma',
    email: 'pooja.verma@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Akash Tiwari',
    username: 'akash_tiwari',
    email: 'akash.tiwari@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Neha Malhotra',
    username: 'neha_malhotra',
    email: 'neha.malhotra@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Siddharth Das',
    username: 'siddharth_das',
    email: 'siddharth.das@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Kavita Pandey',
    username: 'kavita_pandey',
    email: 'kavita.pandey@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Amit Saxena',
    username: 'amit_saxena',
    email: 'amit.saxena@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Rekha Mishra',
    username: 'rekha_mishra',
    email: 'rekha.mishra@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Nikhil Jain',
    username: 'nikhil_jain',
    email: 'nikhil.jain@user.dev',
    password: 'User@1234',
  },
  {
    name: 'Swati Yadav',
    username: 'swati_yadav',
    email: 'swati.yadav@user.dev',
    password: 'User@1234',
  },
];

// ── Main Seed Function ───────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to MongoDB');

  const credLines = [];
  const line = txt => credLines.push(txt);
  const sep = () => line('─'.repeat(65));

  // ── 1. ADMIN ──────────────────────────────────────────────────────────────
  sep();
  line('ROLE: Admin');
  sep();

  const adminPlain = 'Admin@Skill2024!';
  const adminData = {
    username: 'super_admin',
    name: 'Super Admin',
    email: 'admin@skillpilot.dev',
    password: await hashPassword(adminPlain),
    role: 'Admin',
    isActive: true,
    isVerified: true,
    authProvider: 'local',
    jobTitle: 'Platform Administrator',
    universityPermissions: [
      { permission: 'manage_teachers', granted: true },
      { permission: 'manage_students', granted: true },
      { permission: 'view_reports', granted: true },
      { permission: 'manage_courses', granted: true },
      { permission: 'manage_library', granted: true },
      { permission: 'manage_fees', granted: true },
    ],
    securitySettings: {
      twoFactorEnabled: false,
      emailNotifications: true,
      loginAlerts: true,
      allowMultipleSessions: true,
    },
  };

  const existingAdmin = await User.findOne({ email: adminData.email });
  let adminUser;
  if (existingAdmin) {
    console.log('⚠️  Admin already exists, skipping...');
    adminUser = existingAdmin;
  } else {
    adminUser = await User.create(adminData);
    console.log('✅ Admin created');
  }

  line(`Name     : ${adminData.name}`);
  line(`Username : ${adminData.username}`);
  line(`Email    : ${adminData.email}`);
  line(`Password : ${adminPlain}`);
  line('Role     : Admin');
  line('Status   : Active & Verified');
  line(
    'Permissions: ALL (manage_teachers, manage_students, view_reports, manage_courses, manage_library, manage_fees)'
  );

  // ── 2. UNIVERSITY ─────────────────────────────────────────────────────────
  sep();
  line('ENTITY: University');
  sep();

  const uniDoc = {
    name: 'SkillPilot University of Technology',
    url: 'https://sput.skillpilot.dev',
    location: { state: 'Karnataka', city: 'Bangalore' },
    accessMethod: 'registration',
    registrationNumbers: ['SPUT2024001', 'SPUT2024002', 'SPUT2024003'],
    passwordMethod: 'manual',
    defaultPassword: 'UniDefault@123',
    isActive: true,
    createdBy: adminUser._id,
  };

  const existingUni = await University.findOne({ name: uniDoc.name });
  let uni;
  if (existingUni) {
    console.log('⚠️  University already exists, skipping...');
    uni = existingUni;
  } else {
    uni = await University.create(uniDoc);
    console.log('✅ University created');
  }

  line(`University Name    : ${uniDoc.name}`);
  line(`URL                : ${uniDoc.url}`);
  line(`Location           : ${uniDoc.location.city}, ${uniDoc.location.state}`);
  line('Access Method      : registration');
  line('Password Method    : manual');
  line(`Default Password   : ${uniDoc.defaultPassword}`);
  line(`Registration Nos   : ${uniDoc.registrationNumbers.join(', ')}`);

  // ── 3. UniAdmin ───────────────────────────────────────────────────────────
  sep();
  line('ROLE: UniAdmin (University Administrator)');
  sep();

  const uniAdminPlain = 'UniAdmin@2024!';
  const uniAdminData = {
    username: 'uni_admin_sput',
    name: 'Dr. Ramesh Krishnamurthy',
    email: 'uniadmin@sput.skillpilot.dev',
    password: await hashPassword(uniAdminPlain),
    role: 'UniAdmin',
    isActive: true,
    isVerified: true,
    authProvider: 'local',
    jobTitle: 'University Administrator',
    universityId: uni._id,
    registrationNumber: 'SPUT2024001',
    universityPermissions: [
      { permission: 'manage_teachers', granted: true },
      { permission: 'manage_students', granted: true },
      { permission: 'view_reports', granted: true },
      { permission: 'manage_courses', granted: true },
      { permission: 'manage_library', granted: true },
      { permission: 'manage_fees', granted: true },
    ],
    securitySettings: {
      twoFactorEnabled: false,
      emailNotifications: true,
      loginAlerts: true,
      allowMultipleSessions: true,
    },
  };

  const existingUniAdmin = await User.findOne({ email: uniAdminData.email });
  let uniAdminUser;
  if (existingUniAdmin) {
    console.log('⚠️  UniAdmin already exists, skipping...');
    uniAdminUser = existingUniAdmin;
  } else {
    uniAdminUser = await User.create(uniAdminData);
    // Create Profile for UniAdmin
    await Profile.create({
      user: uniAdminUser._id,
      firstName: 'Ramesh',
      lastName: 'Krishnamurthy',
      country: 'India',
      bio: 'University administrator responsible for managing all academic operations.',
      undergraduate: {
        status: 'completed',
        courseName: 'B.Tech Computer Science',
        collegeName: 'IIT Bombay',
        university: 'IIT Bombay',
        startYear: 1998,
        passoutYear: 2002,
        cgpa: 9.2,
      },
    });
    console.log('✅ UniAdmin created');
  }

  line(`Name              : ${uniAdminData.name}`);
  line(`Username          : ${uniAdminData.username}`);
  line(`Email             : ${uniAdminData.email}`);
  line(`Password          : ${uniAdminPlain}`);
  line('Role              : UniAdmin');
  line(`University        : ${uniDoc.name}`);
  line(`Registration No   : ${uniAdminData.registrationNumber}`);
  line('Permissions       : ALL university permissions');

  // ── 4. UniTeach ───────────────────────────────────────────────────────────
  sep();
  line('ROLE: UniTeach (University Teacher)');
  sep();

  const uniTeachPlain = 'UniTeach@2024!';
  const uniTeachData = {
    username: 'uni_teacher_sput',
    name: 'Prof. Sunita Desai',
    email: 'uniteach@sput.skillpilot.dev',
    password: await hashPassword(uniTeachPlain),
    role: 'UniTeach',
    isActive: true,
    isVerified: true,
    authProvider: 'local',
    jobTitle: 'Associate Professor — Computer Science',
    universityId: uni._id,
    registrationNumber: 'SPUT2024002',
    universityPermissions: [
      { permission: 'manage_students', granted: true },
      { permission: 'view_reports', granted: true },
      { permission: 'manage_courses', granted: true },
    ],
    securitySettings: {
      twoFactorEnabled: false,
      emailNotifications: true,
      loginAlerts: true,
      allowMultipleSessions: true,
    },
  };

  const existingUniTeach = await User.findOne({ email: uniTeachData.email });
  let uniTeachUser;
  if (existingUniTeach) {
    console.log('⚠️  UniTeach already exists, skipping...');
    uniTeachUser = existingUniTeach;
  } else {
    uniTeachUser = await User.create(uniTeachData);
    await Profile.create({
      user: uniTeachUser._id,
      firstName: 'Sunita',
      lastName: 'Desai',
      country: 'India',
      bio: 'Associate professor with 15 years of experience in Computer Science education.',
      undergraduate: {
        status: 'completed',
        courseName: 'B.Tech Computer Science',
        collegeName: 'NIT Suratkhal',
        university: 'NIT Karnataka',
        startYear: 2001,
        passoutYear: 2005,
        cgpa: 8.9,
      },
    });
    console.log('✅ UniTeach created');
  }

  line(`Name              : ${uniTeachData.name}`);
  line(`Username          : ${uniTeachData.username}`);
  line(`Email             : ${uniTeachData.email}`);
  line(`Password          : ${uniTeachPlain}`);
  line('Role              : UniTeach');
  line(`University        : ${uniDoc.name}`);
  line(`Registration No   : ${uniTeachData.registrationNumber}`);
  line('Permissions       : manage_students, view_reports, manage_courses');

  // ── 5. MENTORS ────────────────────────────────────────────────────────────
  sep();
  line('ROLE: Mentor (10 Mentors)');
  sep();

  for (let i = 0; i < mentorData.length; i++) {
    const m = mentorData[i];

    const existing = await User.findOne({ email: m.email });
    if (existing) {
      console.log(`⚠️  Mentor ${m.name} already exists, skipping...`);
      line(`[${i + 1}] ${m.name} — ALREADY EXISTS`);
      line(`    Email: ${m.email} | Password: ${m.password}`);
      continue;
    }

    const mentorUser = await User.create({
      username: m.username,
      name: m.name,
      email: m.email,
      password: await hashPassword(m.password),
      role: 'Mentor',
      jobTitle: m.jobTitle,
      experience: m.experience,
      isActive: true,
      isVerified: true,
      authProvider: 'local',
      mentorStatus: 'approved',
      mentorBadge: 'verified',
      mentorVerification: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        documentVerified: true,
        documentVerifiedAt: new Date(),
      },
      totalPlacements: Math.floor(Math.random() * 30) + 5,
      mentorRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
      totalReviews: Math.floor(Math.random() * 50) + 10,
      companiesJoined: m.topCompanies,
      securitySettings: {
        twoFactorEnabled: false,
        emailNotifications: true,
        loginAlerts: true,
        allowMultipleSessions: true,
      },
    });

    // Create MentorProfile
    const mentorProfile = await MentorProfile.create({
      userId: mentorUser._id,
      displayName: m.name,
      handle: m.handle,
      tagline: m.tagline,
      bio: m.bio,
      location: { city: m.city, state: m.state, country: 'India' },
      expertise: m.expertise,
      targetingDomains: m.targetingDomains,
      preferredMenteeType: ['Fresher', 'Working Professional', 'Student'],
      languages: ['English', 'Hindi'],
      totalPlacements: Math.floor(Math.random() * 30) + 5,
      totalMentees: Math.floor(Math.random() * 80) + 20,
      averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
      totalReviews: Math.floor(Math.random() * 50) + 10,
      sessionsPerWeek: 3,
      sessionDuration: 60,
      pricingType: 'paid',
      pricingPlans: [
        {
          duration: '1 Month',
          price: 2999,
          discountPercent: 0,
          features: ['4 sessions', 'Resume review', 'Mock interview'],
        },
        {
          duration: '3 Months',
          price: 7999,
          discountPercent: 11,
          features: ['12 sessions', 'Resume review', 'Mock interview', 'Referral support'],
        },
        {
          duration: '6 Months',
          price: 14999,
          discountPercent: 17,
          features: [
            '24 sessions',
            'Resume review',
            'Mock interview',
            'Referral support',
            'Job application tracking',
          ],
        },
      ],
      trialSession: { available: true, price: 499, description: '30-minute introductory call' },
      sectorType: 'private',
      availabilitySlots: [
        { day: 'Monday', startTime: '18:00', endTime: '21:00', isAvailable: true },
        { day: 'Wednesday', startTime: '18:00', endTime: '21:00', isAvailable: true },
        { day: 'Saturday', startTime: '10:00', endTime: '14:00', isAvailable: true },
      ],
      referralsInTopCompanies: true,
      topCompanies: m.topCompanies,
      curriculum: {
        available: true,
        description: `Structured path to master ${m.expertise.join(', ')}`,
        topics: m.expertise,
      },
      socialLinks: {
        linkedIn: `https://linkedin.com/in/${m.handle}`,
        github: `https://github.com/${m.handle}`,
      },
      featured: i < 3, // first 3 mentors are featured
      isVisible: true,
      searchTags: [...m.expertise, ...m.targetingDomains],
      education: [
        { degree: 'B.Tech', field: 'Computer Science', institution: 'NIT Trichy', year: 2015 },
      ],
    });

    // Link profile back to user
    await User.findByIdAndUpdate(mentorUser._id, { mentorProfile: mentorProfile._id });

    console.log(`✅ Mentor [${i + 1}] ${m.name} created`);

    line(`[${i + 1}] ${m.name}`);
    line(`    Username    : ${m.username}`);
    line(`    Email       : ${m.email}`);
    line(`    Password    : ${m.password}`);
    line('    Role        : Mentor');
    line(`    Job Title   : ${m.jobTitle}`);
    line(`    Expertise   : ${m.expertise.join(', ')}`);
    line(`    Location    : ${m.city}, ${m.state}`);
    line(`    Handle      : /mentor/${m.handle}`);
    line('    Status      : Approved & Verified | Badge: verified');
    line(`    Featured    : ${i < 3 ? 'Yes' : 'No'}`);
  }

  // ── 6. REGULAR USERS ───────────────────────────────────────────────────────
  sep();
  line('ROLE: User (10 Regular Users)');
  sep();

  const userSkills = [
    ['JavaScript', 'React', 'Node.js'],
    ['Python', 'Django', 'SQL'],
    ['Java', 'Spring Boot', 'MySQL'],
    ['C++', 'DSA', 'Competitive Programming'],
    ['Flutter', 'Dart', 'Firebase'],
    ['Data Analysis', 'Pandas', 'Tableau'],
    ['UI/UX', 'Figma', 'Adobe XD'],
    ['DevOps', 'Docker', 'Kubernetes'],
    ['Cybersecurity', 'Kali Linux', 'Wireshark'],
    ['Blockchain', 'Solidity', 'Ethereum'],
  ];

  for (let i = 0; i < userData.length; i++) {
    const u = userData[i];

    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`⚠️  User ${u.name} already exists, skipping...`);
      line(`[${i + 1}] ${u.name} — ALREADY EXISTS`);
      line(`    Email: ${u.email} | Password: ${u.password}`);
      continue;
    }

    const regularUser = await User.create({
      username: u.username,
      name: u.name,
      email: u.email,
      password: await hashPassword(u.password),
      role: 'User',
      isActive: true,
      isVerified: true,
      authProvider: 'local',
      newsletter: i % 2 === 0,
      subscription: false,
      securitySettings: {
        twoFactorEnabled: false,
        emailNotifications: true,
        loginAlerts: true,
        allowMultipleSessions: true,
      },
    });

    // Create Profile for User
    const skills = userSkills[i].map(s => ({ name: s, level: 'Intermediate' }));
    await Profile.create({
      user: regularUser._id,
      firstName: u.name.split(' ')[0],
      lastName: u.name.split(' ')[1] || '',
      country: 'India',
      bio: `Aspiring ${userSkills[i][0]} developer. Looking for mentorship to advance my career.`,
      skills: skills,
      undergraduate: {
        status: 'pursuing',
        courseName: 'B.Tech Computer Science',
        collegeName: `Tech College ${i + 1}`,
        university: 'Mumbai University',
        startYear: 2022,
        expectedPassoutYear: 2026,
        cgpa: parseFloat((Math.random() * 2.5 + 7.0).toFixed(1)),
      },
      goals: [
        {
          title: 'Get placed at a top tech company',
          description: 'Land a software engineering role at a top product company',
          status: 'In Progress',
          targetDate: new Date('2025-06-01'),
        },
      ],
      socialLinks: {
        github: `https://github.com/${u.username}`,
        linkedin: `https://linkedin.com/in/${u.username}`,
      },
    });

    console.log(`✅ User [${i + 1}] ${u.name} created`);

    line(`[${i + 1}] ${u.name}`);
    line(`    Username    : ${u.username}`);
    line(`    Email       : ${u.email}`);
    line(`    Password    : ${u.password}`);
    line('    Role        : User');
    line(`    Skills      : ${userSkills[i].join(', ')}`);
    line('    Status      : Active & Verified');
  }

  // ── Write credentials file ────────────────────────────────────────────────
  const header = [
    '═'.repeat(65),
    '  SKILLPILOT — SEED CREDENTIALS',
    `  Generated: ${new Date().toISOString()}`,
    '═'.repeat(65),
    '',
    'ALL PASSWORDS ARE PRE-HASHED IN THE DATABASE.',
    'USE THE PLAIN-TEXT PASSWORDS BELOW TO LOG IN.',
    '',
  ];
  const footer = ['', '═'.repeat(65), '  END OF CREDENTIALS FILE', '═'.repeat(65)];

  const content = [...header, ...credLines, ...footer].join('\n');
  const outPath = path.join(__dirname, 'seed_credentials.txt');
  fs.writeFileSync(outPath, content, 'utf-8');

  console.log('\n' + '═'.repeat(50));
  console.log('✅ ALL SEED DATA CREATED SUCCESSFULLY');
  console.log(`📄 Credentials saved to: ${outPath}`);
  console.log('═'.repeat(50));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
