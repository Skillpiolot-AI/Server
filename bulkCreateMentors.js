// bulkCreateMentors.js
// Run with: node bulkCreateMentors.js
// Creates 10 fully verified test mentors for frontend testing

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URL 

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  mentor: (msg) => console.log(`${colors.magenta}👨‍🏫 ${msg}${colors.reset}`)
};

// Common image URL for all mentors
const PROFILE_IMAGE = 'https://assets.vogue.in/photos/5f11296d7ef971dde92d95c2/2:3/w_2560%2Cc_limit/GettyImages-1153561513.jpg';

// 10 Diverse Test Mentors
const testMentors = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@skillpilot.test',
    username: 'rajesh_kumar_mentor',
    phone: '+91-9876543210',
    jobTitle: 'Senior Software Engineer',
    currentCompany: 'Google',
    companiesWorked: ['Google', 'Microsoft', 'Infosys'],
    experience: 10,
    sectorType: 'private',
    pricingType: 'paid',
    expertise: ['Java', 'System Design', 'DSA', 'Microservices'],
    targetingDomains: ['Backend Developer', 'System Architect'],
    targetAudience: ['Fresher', 'Working Professional'],
    languages: ['English', 'Hindi'],
    location: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    bio: 'Senior engineer at Google with 10+ years of experience. Helped 100+ students crack FAANG interviews.',
    tagline: 'FAANG Interview Expert | System Design Specialist',
    pricing: { monthlyPrice: 15000, threeMonthPrice: 40000, sixMonthPrice: 70000 },
    sessionsPerWeek: 2,
    referralsInTopCompanies: true,
    topCompanyReferrals: ['Google', 'Microsoft', 'Amazon'],
    totalPlacements: 45,
    rating: 4.9
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@skillpilot.test',
    username: 'priya_sharma_mentor',
    phone: '+91-9876543211',
    jobTitle: 'Lead Data Scientist',
    currentCompany: 'Amazon',
    companiesWorked: ['Amazon', 'Facebook', 'Flipkart'],
    experience: 8,
    sectorType: 'private',
    pricingType: 'paid',
    expertise: ['Python', 'Machine Learning', 'Deep Learning', 'Data Analytics'],
    targetingDomains: ['Data Scientist', 'ML Engineer', 'Data Analyst'],
    targetAudience: ['Working Professional', 'Career Switch'],
    languages: ['English', 'Hindi', 'Marathi'],
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    bio: 'Lead Data Scientist at Amazon with expertise in NLP and Computer Vision. Building AI solutions for millions.',
    tagline: 'AI/ML Expert | Data Science Mentor',
    pricing: { monthlyPrice: 12000, threeMonthPrice: 32000, sixMonthPrice: 55000 },
    sessionsPerWeek: 3,
    referralsInTopCompanies: true,
    topCompanyReferrals: ['Amazon', 'Meta', 'Netflix'],
    totalPlacements: 35,
    rating: 4.8
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@skillpilot.test',
    username: 'amit_patel_mentor',
    phone: '+91-9876543212',
    jobTitle: 'Product Manager',
    currentCompany: 'Microsoft',
    companiesWorked: ['Microsoft', 'Apple', 'Paytm'],
    experience: 12,
    sectorType: 'private',
    pricingType: 'freemium',
    expertise: ['Product Strategy', 'Agile', 'Roadmapping', 'User Research'],
    targetingDomains: ['Product Manager', 'Business Analyst', 'Project Manager'],
    targetAudience: ['Working Professional', 'Fresher'],
    languages: ['English', 'Hindi', 'Gujarati'],
    location: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    bio: 'Product Manager at Microsoft with 12 years in tech. Mentored 50+ aspiring PMs to land their dream roles.',
    tagline: 'PM Career Coach | Ex-Apple, Microsoft',
    pricing: { monthlyPrice: 0, threeMonthPrice: 25000, sixMonthPrice: 45000, trialAvailable: true, trialPrice: 199 },
    sessionsPerWeek: 2,
    referralsInTopCompanies: true,
    topCompanyReferrals: ['Microsoft', 'Apple', 'Google'],
    totalPlacements: 28,
    rating: 4.7
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@skillpilot.test',
    username: 'sneha_reddy_mentor',
    phone: '+91-9876543213',
    jobTitle: 'Government Officer (IAS)',
    currentCompany: 'Government of India',
    companiesWorked: ['Government of India', 'State Government'],
    experience: 7,
    sectorType: 'government',
    pricingType: 'free',
    expertise: ['UPSC Preparation', 'Public Administration', 'Essay Writing', 'Interview Skills'],
    targetingDomains: ['UPSC Aspirant', 'Government Jobs', 'Public Service'],
    targetAudience: ['Student', 'Fresher'],
    languages: ['English', 'Hindi', 'Telugu'],
    location: { city: 'Delhi', state: 'Delhi', country: 'India' },
    bio: 'IAS Officer (2018 batch). Cleared UPSC in first attempt with AIR 47. Volunteer mentor for aspirants.',
    tagline: 'IAS Mentor | Free Guidance for UPSC',
    pricing: { monthlyPrice: 0, threeMonthPrice: 0, sixMonthPrice: 0 },
    sessionsPerWeek: 1,
    referralsInTopCompanies: false,
    topCompanyReferrals: [],
    totalPlacements: 15,
    rating: 4.9
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@skillpilot.test',
    username: 'vikram_singh_mentor',
    phone: '+91-9876543214',
    jobTitle: 'DevOps Architect',
    currentCompany: 'Netflix',
    companiesWorked: ['Netflix', 'AWS', 'Uber'],
    experience: 9,
    sectorType: 'private',
    pricingType: 'paid',
    expertise: ['DevOps', 'Kubernetes', 'AWS', 'CI/CD', 'Docker', 'Terraform'],
    targetingDomains: ['DevOps Engineer', 'Cloud Architect', 'SRE'],
    targetAudience: ['Working Professional', 'Career Switch'],
    languages: ['English', 'Hindi', 'Punjabi'],
    location: { city: 'Gurgaon', state: 'Haryana', country: 'India' },
    bio: 'DevOps Architect at Netflix managing infrastructure for millions of users. AWS certified professional.',
    tagline: 'Cloud & DevOps Expert | Netflix Engineer',
    pricing: { monthlyPrice: 18000, threeMonthPrice: 48000, sixMonthPrice: 85000 },
    sessionsPerWeek: 2,
    referralsInTopCompanies: true,
    topCompanyReferrals: ['Netflix', 'Amazon', 'Uber'],
    totalPlacements: 22,
    rating: 4.8
  },
  {
    name: 'Anjali Verma',
    email: 'anjali.verma@skillpilot.test',
    username: 'anjali_verma_mentor',
    phone: '+91-9876543215',
    jobTitle: 'PSU Manager',
    currentCompany: 'ONGC',
    companiesWorked: ['ONGC', 'BHEL', 'NTPC'],
    experience: 15,
    sectorType: 'combined',
    pricingType: 'paid',
    expertise: ['PSU Preparation', 'GATE', 'Technical Interviews', 'Management'],
    targetingDomains: ['PSU Jobs', 'Engineering Manager', 'Technical Lead'],
    targetAudience: ['Fresher', 'Student'],
    languages: ['English', 'Hindi'],
    location: { city: 'Dehradun', state: 'Uttarakhand', country: 'India' },
    bio: 'Manager at ONGC with 15 years experience in PSUs. Expert in GATE and PSU interview preparation.',
    tagline: 'PSU Career Expert | GATE Mentor',
    pricing: { monthlyPrice: 8000, threeMonthPrice: 20000, sixMonthPrice: 35000 },
    sessionsPerWeek: 3,
    referralsInTopCompanies: false,
    topCompanyReferrals: ['ONGC', 'BHEL', 'IOCL'],
    totalPlacements: 40,
    rating: 4.6
  },
  {
    name: 'Karan Mehta',
    email: 'karan.mehta@skillpilot.test',
    username: 'karan_mehta_mentor',
    phone: '+91-9876543216',
    jobTitle: 'Startup Founder & CTO',
    currentCompany: 'TechStartup Inc',
    companiesWorked: ['Stripe', 'Razorpay', 'Own Startup'],
    experience: 6,
    sectorType: 'startup',
    pricingType: 'freemium',
    expertise: ['Full Stack', 'React', 'Node.js', 'Startup Building', 'Fundraising'],
    targetingDomains: ['Full Stack Developer', 'Startup Founder', 'Frontend Developer'],
    targetAudience: ['Student', 'Fresher', 'Career Switch'],
    languages: ['English', 'Hindi'],
    location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
    bio: 'Ex-Stripe engineer, now running my own funded startup. Love helping young developers build great products.',
    tagline: 'Startup Mentor | Full Stack Expert',
    pricing: { monthlyPrice: 5000, threeMonthPrice: 12000, sixMonthPrice: 20000, trialAvailable: true, trialPrice: 0 },
    sessionsPerWeek: 2,
    referralsInTopCompanies: true,
    topCompanyReferrals: ['Stripe', 'Razorpay'],
    totalPlacements: 18,
    rating: 4.7
  },
  {
    name: 'Deepika Joshi',
    email: 'deepika.joshi@skillpilot.test',
    username: 'deepika_joshi_mentor',
    phone: '+91-9876543217',
    jobTitle: 'Freelance Consultant',
    currentCompany: 'Self-Employed',
    companiesWorked: ['Accenture', 'TCS', 'Freelance'],
    experience: 11,
    sectorType: 'freelance',
    pricingType: 'paid',
    expertise: ['UI/UX Design', 'Figma', 'User Research', 'Design Systems'],
    targetingDomains: ['UI/UX Designer', 'Product Designer', 'Freelancer'],
    targetAudience: ['Fresher', 'Working Professional', 'Career Switch'],
    languages: ['English', 'Hindi', 'Bengali'],
    location: { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    bio: 'Freelance UX consultant working with Fortune 500 companies. Teaching design thinking and freelancing.',
    tagline: 'UX Design Expert | Freelance Coach',
    pricing: { monthlyPrice: 10000, threeMonthPrice: 25000, sixMonthPrice: 45000 },
    sessionsPerWeek: 4,
    referralsInTopCompanies: false,
    topCompanyReferrals: [],
    totalPlacements: 32,
    rating: 4.8
  },
  {
    name: 'Rohit Gupta',
    email: 'rohit.gupta@skillpilot.test',
    username: 'rohit_gupta_mentor',
    phone: '+91-9876543218',
    jobTitle: 'Cybersecurity Lead',
    currentCompany: 'Palo Alto Networks',
    companiesWorked: ['Palo Alto', 'Cisco', 'DRDO'],
    experience: 8,
    sectorType: 'combined',
    pricingType: 'paid',
    expertise: ['Cybersecurity', 'Ethical Hacking', 'CISSP', 'Network Security'],
    targetingDomains: ['Security Engineer', 'Ethical Hacker', 'Security Analyst'],
    targetAudience: ['Working Professional', 'Fresher'],
    languages: ['English', 'Hindi'],
    location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    bio: 'Cybersecurity Lead at Palo Alto. Ex-DRDO. CISSP, CEH certified. Protecting critical infrastructure.',
    tagline: 'Cybersecurity Expert | Defense Background',
    pricing: { monthlyPrice: 14000, threeMonthPrice: 38000, sixMonthPrice: 65000 },
    sessionsPerWeek: 2,
    referralsInTopCompanies: true,
    topCompanyReferrals: ['Palo Alto', 'Cisco', 'CrowdStrike'],
    totalPlacements: 25,
    rating: 4.9
  },
  {
    name: 'Kavya Nair',
    email: 'kavya.nair@skillpilot.test',
    username: 'kavya_nair_mentor',
    phone: '+91-9876543219',
    jobTitle: 'Mobile App Developer',
    currentCompany: 'Swiggy',
    companiesWorked: ['Swiggy', 'Zomato', 'PhonePe'],
    experience: 5,
    sectorType: 'startup',
    pricingType: 'freemium',
    expertise: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile UI'],
    targetingDomains: ['Mobile Developer', 'App Developer', 'React Native Developer'],
    targetAudience: ['Fresher', 'Student', 'Career Switch'],
    languages: ['English', 'Hindi', 'Malayalam'],
    location: { city: 'Kochi', state: 'Kerala', country: 'India' },
    bio: 'Mobile developer at Swiggy building apps used by millions. Passionate about teaching mobile development.',
    tagline: 'Mobile App Expert | React Native & Flutter',
    pricing: { monthlyPrice: 6000, threeMonthPrice: 15000, sixMonthPrice: 25000, trialAvailable: true, trialPrice: 99 },
    sessionsPerWeek: 3,
    referralsInTopCompanies: true,
    topCompanyReferrals: ['Swiggy', 'PhonePe', 'Flipkart'],
    totalPlacements: 20,
    rating: 4.7
  }
];

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    log.success('Connected to MongoDB');
    return true;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}

async function deleteExistingMentors() {
  const User = require('./models/User');
  const MentorProfile = require('./models/MentorProfile');
  const Application = require('./models/Application');

  log.info('Deleting existing mentors...');

  // Delete all mentor profiles
  const profileResult = await MentorProfile.deleteMany({});
  log.warning(`Deleted ${profileResult.deletedCount} mentor profiles`);

  // Delete all mentor users
  const userResult = await User.deleteMany({ role: 'Mentor' });
  log.warning(`Deleted ${userResult.deletedCount} mentor users`);

  // Delete all applications
  const appResult = await Application.deleteMany({});
  log.warning(`Deleted ${appResult.deletedCount} applications`);

  return true;
}

async function createTestMentors() {
  const User = require('./models/User');
  const MentorProfile = require('./models/MentorProfile');
  const bcrypt = require('bcryptjs');

  const createdMentors = [];

  for (const mentorData of testMentors) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash('Mentor_123', 10);

      // Create User with Mentor role - FULLY VERIFIED
      const newUser = new User({
        username: mentorData.username,
        name: mentorData.name,
        email: mentorData.email,
        password: hashedPassword,
        phoneNumber: mentorData.phone,
        jobTitle: mentorData.jobTitle,
        companiesJoined: mentorData.companiesWorked,
        experience: mentorData.experience,
        role: 'Mentor',
        imageUrl: PROFILE_IMAGE,
        isVerified: true,
        isActive: true,
        mentorStatus: 'verified', // Fully verified
        mentorBadge: 'verified',  // Verified badge
        mentorVerification: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          documentVerified: true,
          documentVerifiedAt: new Date()
        },
        totalPlacements: mentorData.totalPlacements,
        mentorRating: mentorData.rating,
        totalReviews: Math.floor(Math.random() * 50) + 10
      });

      const savedUser = await newUser.save();

      // Create MentorProfile
      const mentorProfile = new MentorProfile({
        userId: savedUser._id,
        displayName: mentorData.name,
        tagline: mentorData.tagline,
        bio: mentorData.bio,
        profileImage: PROFILE_IMAGE,
        location: mentorData.location,
        expertise: mentorData.expertise,
        targetingDomains: mentorData.targetingDomains,
        preferredMenteeType: mentorData.targetAudience,
        languages: mentorData.languages,
        totalPlacements: mentorData.totalPlacements,
        totalMentees: Math.floor(Math.random() * 80) + 20,
        averageRating: mentorData.rating,
        totalReviews: Math.floor(Math.random() * 50) + 10,
        sessionsPerWeek: mentorData.sessionsPerWeek,
        sessionDuration: 60,
        pricingType: mentorData.pricingType,
        pricingPlans: [
          mentorData.pricing.monthlyPrice > 0 ? { duration: '1 Month', price: mentorData.pricing.monthlyPrice } : null,
          mentorData.pricing.threeMonthPrice > 0 ? { duration: '3 Months', price: mentorData.pricing.threeMonthPrice, discountPercent: 10 } : null,
          mentorData.pricing.sixMonthPrice > 0 ? { duration: '6 Months', price: mentorData.pricing.sixMonthPrice, discountPercent: 20 } : null
        ].filter(Boolean),
        trialSession: {
          available: mentorData.pricing.trialAvailable || false,
          price: mentorData.pricing.trialPrice || 0,
          description: 'Try a session before committing'
        },
        sectorType: mentorData.sectorType,
        referralsInTopCompanies: mentorData.referralsInTopCompanies,
        topCompanies: mentorData.topCompanyReferrals,
        curriculum: {
          available: true,
          description: 'Structured learning path',
          topics: mentorData.expertise.slice(0, 5)
        },
        socialLinks: {
          linkedIn: `https://linkedin.com/in/${mentorData.username}`,
          github: `https://github.com/${mentorData.username}`,
          twitter: `https://twitter.com/${mentorData.username}`
        },
        education: [
          { degree: 'B.Tech', field: 'Computer Science', institution: 'IIT Delhi', year: 2015 }
        ],
        certifications: [
          { name: 'AWS Solutions Architect', issuer: 'Amazon', year: 2022 }
        ],
        featured: mentorData.rating >= 4.8,
        isVisible: true,
        searchTags: [...mentorData.expertise, ...mentorData.targetingDomains, mentorData.sectorType]
      });

      const savedProfile = await mentorProfile.save();

      // Update user with profile link
      savedUser.mentorProfile = savedProfile._id;
      await savedUser.save();

      createdMentors.push({
        name: mentorData.name,
        username: mentorData.username,
        email: mentorData.email,
        sector: mentorData.sectorType,
        pricingType: mentorData.pricingType
      });

      log.mentor(`Created: ${mentorData.name} (${mentorData.sectorType} | ${mentorData.pricingType})`);

    } catch (error) {
      log.error(`Failed to create ${mentorData.name}: ${error.message}`);
    }
  }

  return createdMentors;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log.info('🚀 Skill-Pilot Bulk Mentor Creation Tool');
  log.info('   Creating 10 Fully Verified Test Mentors');
  console.log('='.repeat(60) + '\n');

  // Connect to MongoDB
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Step 1: Delete existing mentors
    log.info('Step 1: Cleaning up existing mentors...');
    await deleteExistingMentors();
    console.log('');

    // Step 2: Create new test mentors
    log.info('Step 2: Creating 10 verified test mentors...');
    const createdMentors = await createTestMentors();
    console.log('');

    // Summary
    console.log('='.repeat(60));
    log.success(`🎉 Created ${createdMentors.length} fully verified mentors!\n`);

    console.log('📊 Mentor Summary:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ Name                  │ Sector      │ Pricing          │');
    console.log('├─────────────────────────────────────────────────────────┤');
    createdMentors.forEach(m => {
      const name = m.name.padEnd(21);
      const sector = m.sector.padEnd(11);
      const pricing = m.pricingType.padEnd(16);
      console.log(`│ ${name} │ ${sector} │ ${pricing} │`);
    });
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');

    console.log('🔐 Default Credentials:');
    console.log('   Password: Mentor_123');
    console.log('');

    console.log('📸 Profile Image: Same professional image for all mentors');
    console.log('');

    console.log('✅ All mentors are:');
    console.log('   • Fully verified (email + phone + document)');
    console.log('   • Visible in search');
    console.log('   • Have complete profiles');
    console.log('');

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
main();
