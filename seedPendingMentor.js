const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');

require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/college-predictor';

async function seedMentorApplication() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create a dummy User first (or find one)
    let user = await User.findOne({ email: 'seed.mentor@example.com' });
    if (!user) {
      user = new User({
        name: 'Seed Mentor',
        username: 'seedmentor',
        email: 'seed.mentor@example.com',
        phone: '9876543210',
        role: 'User', // Applies as User, promotes to Mentor on approve
        password: 'Password123!', // Hashing is bypassed for seed if direct, but let's assume valid
      });
      await user.save();
      console.log('Created dummy user for application');
    }

    // 2. Clear out any existing pending applications for this user
    await Application.deleteMany({ email: 'seed.mentor@example.com' });

    // 3. Construct rich application data
    const applicationData = {
      name: 'Arjun Mehta',
      email: 'seed.mentor@example.com',
      phone: '9876543210',
      jobTitle: 'Senior Product Designer',
      currentCompany: 'Groww',
      companiesWorked: ['Swiggy', 'Zomato', 'Paytm'],
      experience: 6,
      profileImage:
        'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=200',
      bio: 'Solving complex design problems for FinTech & Hyper-local delivery apps. Passionate about mentoring upcoming UI/UX designers.',
      tagline: 'Crafting interfaces that scale into ecosystems',
      expertise: ['UI/UX Design', 'Product Strategy', 'Figma', 'System Design'],
      targetingDomains: ['Product Management', 'Design', 'Front-end'],
      targetAudience: ['Fresher', 'Working Professional', 'Student'],
      languages: ['English', 'Hindi'],
      location: {
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      },
      sessionsPerWeek: 4,
      sessionDuration: 45,
      availabilitySlots: [
        { day: 'Saturday', startTime: '10:00', endTime: '13:00' },
        { day: 'Sunday', startTime: '14:00', endTime: '18:00' },
      ],
      pricingType: 'paid',
      pricing: {
        monthlyPrice: 1500,
        threeMonthPrice: 4000,
        sixMonthPrice: 7500,
        hourlyRate: 500,
        trialAvailable: true,
        trialPrice: 0,
      },
      sectorType: 'startup',
      referralsInTopCompanies: true,
      topCompanyReferrals: ['Swiggy', 'Zomato'],
      education: [
        { degree: 'B.Des', field: 'Industrial Design', institution: 'NID Ahmedabad', year: 2018 },
      ],
      certifications: [{ name: 'Nielsen Norman UX Certification', issuer: 'NN/g', year: 2021 }],
      socialLinks: {
        linkedIn: 'https://linkedin.com/in/dummy',
        twitter: 'https://twitter.com/dummy',
        portfolio: 'https://dribbble.com/dummy',
      },
      curriculum: {
        available: true,
        description:
          'Comprehensive UI/UX Roadmap covering heuristic evaluations, prototyping, and user testing metrics.',
        topics: ['Heuristics', 'Design Systems', 'Advanced Prototyping'],
      },
      status: 'Pending',
      mentorUserId: user._id,
      preferredCurrency: 'INR',
    };

    const application = new Application(applicationData);
    await application.save();

    console.log('✅ Seeded Mentor Application successfully!');
    console.log('Tracking ID:', application.trackingId);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seedMentorApplication();
