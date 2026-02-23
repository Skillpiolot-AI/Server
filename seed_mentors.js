const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const connectDB = require('./db');
const User = require('./models/User');
const MentorProfile = require('./models/MentorProfile');

const mentorsData = [
    {
        name: "Dr. Ananya Sharma",
        expertise: ["Power Systems", "Renewable Energy", "Circuit Design"],
        targetingDomains: ["Electrical Engineering", "Core Engineering"],
        city: "Delhi",
        bio: "10+ years of experience in Power Systems and smart grid technologies.",
        tagline: "Empowering next-gen Electrical Engineers",
        rating: 4.8,
        placements: 45
    },
    {
        name: "Rahul Verma",
        expertise: ["Data Structures", "System Design", "Backend Development"],
        targetingDomains: ["Computer Science", "IT", "Software Engineering"],
        city: "Bangalore",
        bio: "SDE-3 at a top MNC. Passionate about teaching algorithms and system design.",
        tagline: "Crack your dream tech interview",
        rating: 4.9,
        placements: 120
    },
    {
        name: "Priya Patel",
        expertise: ["Machine Learning", "NLP", "Python"],
        targetingDomains: ["Artificial Intelligence", "Data Science"],
        city: "Mumbai",
        bio: "AI Researcher transitioning students to data scientists.",
        tagline: "Making AI accessible to all",
        rating: 4.7,
        placements: 80
    },
    {
        name: "Vikram Singh",
        expertise: ["Thermodynamics", "AutoCAD", "Fluid Mechanics"],
        targetingDomains: ["Mechanical Engineering", "Automotive"],
        city: "Chennai",
        bio: "Senior Mechanical Engineer with extensive design and manufacturing experience.",
        tagline: "Building machines of the future",
        rating: 4.6,
        placements: 35
    },
    {
        name: "Neha Gupta",
        expertise: ["Structural Analysis", "AutoCAD Civil 3D", "Construction Management"],
        targetingDomains: ["Civil Engineering", "Architecture"],
        city: "Hyderabad",
        bio: "Structural engineer working on mega infrastructure projects.",
        tagline: "Solid foundations for your career",
        rating: 4.5,
        placements: 25
    },
    {
        name: "Amit Kumar",
        expertise: ["VLSI Design", "Embedded Systems", "IoT"],
        targetingDomains: ["Electronics Engineering", "ECE"],
        city: "Pune",
        bio: "Embedded systems expert with patents in IoT devices.",
        tagline: "Connecting the physical and digital",
        rating: 4.8,
        placements: 60
    },
    {
        name: "Sneha Reddy",
        expertise: ["React", "Node.js", "Full Stack Development"],
        targetingDomains: ["Web Development", "Computer Science"],
        city: "Bangalore",
        bio: "Full Stack Developer helping students build real-world applications.",
        tagline: "Building the web, one component at a time",
        rating: 4.9,
        placements: 150
    },
    {
        name: "Rohan Desai",
        expertise: ["Control Systems", "Robotics", "Automation"],
        targetingDomains: ["Electrical Engineering", "Mechatronics"],
        city: "Ahmedabad",
        bio: "Automation engineer specializing in industrial robotics.",
        tagline: "Automate your success",
        rating: 4.7,
        placements: 40
    },
    {
        name: "Meera Iyer",
        expertise: ["Cybersecurity", "Ethical Hacking", "Network Security"],
        targetingDomains: ["Computer Science", "Information Security"],
        city: "Chennai",
        bio: "Security analyst protecting critical infrastructure. Teaching ethical hacking.",
        tagline: "Securing the digital frontier",
        rating: 4.8,
        placements: 75
    },
    {
        name: "Karan Johar",
        expertise: ["Aerodynamics", "Propulsion", "Thermodynamics"],
        targetingDomains: ["Aerospace Engineering", "Mechanical Engineering"],
        city: "Bangalore",
        bio: "Aerospace engineer with experience in drone technology.",
        tagline: "Sky is not the limit",
        rating: 4.6,
        placements: 20
    },
    {
        name: "Anjali Rao",
        expertise: ["Bioprocessing", "Genetics", "Bioinformatics"],
        targetingDomains: ["Biotechnology", "Bioengineering"],
        city: "Hyderabad",
        bio: "Biotech researcher focusing on molecular biology and genetics.",
        tagline: "Engineering life for a better tomorrow",
        rating: 4.9,
        placements: 50
    },
    {
        name: "Sanjay Kapoor",
        expertise: ["Material Science", "Metallurgy", "Nanotechnology"],
        targetingDomains: ["Materials Engineering", "Chemical Engineering"],
        city: "Kolkata",
        bio: "Materials scientist developing advanced alloys.",
        tagline: "Strengthening your knowledge base",
        rating: 4.5,
        placements: 30
    },
    {
        name: "Divya Singh",
        expertise: ["React Native", "Flutter", "Mobile App Development"],
        targetingDomains: ["Software Engineering", "Mobile Development"],
        city: "Gurugram",
        bio: "Mobile app developer with multiple apps crossing 1M+ downloads.",
        tagline: "Appify your ideas",
        rating: 4.8,
        placements: 90
    },
    {
        name: "Surya Prakash",
        expertise: ["Cloud Computing", "AWS", "DevOps"],
        targetingDomains: ["Computer Science", "Cloud Architecture"],
        city: "Noida",
        bio: "AWS Certified Solutions Architect helping students master the cloud.",
        tagline: "Scale your career in the cloud",
        rating: 4.7,
        placements: 110
    },
    {
        name: "Pooja Banerjee",
        expertise: ["Digital Marketing", "SEO", "Content Strategy"],
        targetingDomains: ["Marketing", "Business Administration"],
        city: "Mumbai",
        bio: "Marketing strategist with 8 years of experience in digital growth.",
        tagline: "Market yourself effectively",
        rating: 4.6,
        placements: 65
    },
    {
        name: "Tarun Kumar",
        expertise: ["Microprocessors", "Signal Processing", "Digital Electronics"],
        targetingDomains: ["ECE", "Electronics Engineering"],
        city: "Jaipur",
        bio: "Electronics engineer focused on signal processing and communications.",
        tagline: "Tuning into your potential",
        rating: 4.7,
        placements: 55
    },
    {
        name: "Riya Sen",
        expertise: ["UI/UX Design", "Figma", "User Research"],
        targetingDomains: ["Design", "HCI"],
        city: "Pune",
        bio: "Product designer creating intuitive and beautiful user interfaces.",
        tagline: "Design your path to success",
        rating: 4.9,
        placements: 85
    },
    {
        name: "Arjun Nair",
        expertise: ["Supply Chain", "Operations Research", "Logistics"],
        targetingDomains: ["Industrial Engineering", "Management"],
        city: "Kochi",
        bio: "Operations manager optimizing supply chains for global brands.",
        tagline: "Optimizing your career trajectory",
        rating: 4.5,
        placements: 45
    },
    {
        name: "Snehal Kadam",
        expertise: ["Electric Vehicles", "Battery Management", "Power Electronics"],
        targetingDomains: ["Electrical Engineering", "Automotive"],
        city: "Pune",
        bio: "EV engineer working on next-gen battery management systems.",
        tagline: "Electrifying your engineering journey",
        rating: 4.8,
        placements: 70
    },
    {
        name: "Aditya Roy",
        expertise: ["Blockchain", "Smart Contracts", "Web3"],
        targetingDomains: ["Computer Science", "Cryptography"],
        city: "Bangalore",
        bio: "Web3 developer building decentralized applications.",
        tagline: "Decentralize your learning",
        rating: 4.6,
        placements: 50
    }
];

const generateMentors = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Clean up previously seeded mentors if any exist
        const usersToDelete = await User.find({ email: /@mentor-seeder\.com$/ });
        const userIds = usersToDelete.map(u => u._id);
        if (userIds.length > 0) {
            await MentorProfile.deleteMany({ userId: { $in: userIds } });
            await User.deleteMany({ _id: { $in: userIds } });
            console.log(`Cleaned up ${userIds.length} existing seeded mentors.`);
        }

        const plainPassword = 'Mentor123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        let createdCount = 0;
        const credentialsList = [];

        for (let i = 0; i < mentorsData.length; i++) {
            const data = mentorsData[i];
            const email = `${data.name.split(' ')[0].toLowerCase()}.${i}@mentor-seeder.com`;
            const username = `mentor_${data.name.split(' ')[0].toLowerCase()}_${i}`;

            let user = new User({
                username,
                name: data.name,
                email,
                password: hashedPassword,
                role: 'Mentor',
                mentorStatus: 'approved',
                mentorBadge: 'verified',
                isActive: true,
                isVerified: true,
                totalPlacements: data.placements,
                mentorRating: data.rating,
                totalReviews: Math.floor(Math.random() * 50) + 10 // random reviews count
            });
            await user.save();

            let profile = new MentorProfile({
                userId: user._id,
                displayName: data.name,
                tagline: data.tagline,
                bio: data.bio,
                profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
                location: { city: data.city, state: "State", country: 'India' },
                expertise: data.expertise,
                targetingDomains: data.targetingDomains,
                preferredMenteeType: ['Student', 'Fresher', 'Career Switch'],
                languages: ['English', 'Hindi'],
                totalPlacements: data.placements,
                totalMentees: Math.floor(data.placements * 1.5),
                averageRating: data.rating,
                totalReviews: user.totalReviews,
                sessionsPerWeek: 5,
                sessionDuration: 60,
                pricingType: 'paid',
                pricingPlans: [
                    { duration: '1 Month', price: 1000, discountPercent: 0, features: ['1 session/week', 'Chat support'] },
                    { duration: '3 Months', price: 2500, discountPercent: 10, features: ['1 session/week', 'Chat support', 'Mock Interviews'] },
                    { duration: '6 Months', price: 4500, discountPercent: 20, features: ['2 sessions/week', 'Priority Chat support', 'Mock Interviews', 'Resume Review'] }
                ],
                trialSession: {
                    available: true,
                    price: 0,
                    description: "Free 15 min intro call to understand your goals."
                },
                sectorType: 'private',
                availabilitySlots: [
                    { day: 'Monday', startTime: '18:00', endTime: '21:00', isAvailable: true },
                    { day: 'Wednesday', startTime: '18:00', endTime: '21:00', isAvailable: true },
                    { day: 'Saturday', startTime: '10:00', endTime: '14:00', isAvailable: true },
                    { day: 'Sunday', startTime: '10:00', endTime: '14:00', isAvailable: true }
                ],
                busyDates: [
                    { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), reason: "Personal leave" }
                ],
                referralsInTopCompanies: true,
                topCompanies: ['Google', 'Microsoft', 'Amazon', 'Meta'].sort(() => 0.5 - Math.random()).slice(0, 2),
                curriculum: {
                    available: true,
                    description: `Comprehensive guide to mastering ${data.expertise[0]}`,
                    topics: ['Introduction & Basics', 'Advanced concepts & Theory', 'Hands-on Project building', 'Interview prep & Negotiation']
                },
                socialLinks: {
                    linkedIn: `https://linkedin.com/in/${username}`,
                    github: `https://github.com/${username}`,
                    twitter: `https://twitter.com/${username}`
                },
                featured: true,
                isVisible: true,
                searchTags: [...data.expertise, ...data.targetingDomains].map(tag => tag.toLowerCase()),
                education: [
                    {
                        degree: "B.Tech in Engineering",
                        field: data.targetingDomains[0] || "Engineering",
                        institution: "Top Tier Institute",
                        year: 2018
                    }
                ],
                certifications: [
                    {
                        name: `Certified ${data.expertise[0]} Expert`,
                        issuer: "Global Certification Board",
                        year: 2020,
                        credentialUrl: "https://credential.net/sample"
                    }
                ]
            });

            await profile.save();

            // Update user to link profile
            user.mentorProfile = profile._id;
            await user.save();

            createdCount++;
            credentialsList.push({
                name: data.name,
                email: email,
                password: plainPassword
            });
            console.log(`Created Mentor: ${data.name}`);
        }

        const outputPath = path.join(__dirname, 'mentor_credentials.json');
        fs.writeFileSync(outputPath, JSON.stringify(credentialsList, null, 2), 'utf-8');

        console.log(`Successfully created ${createdCount} mentors!`);
        console.log(`Credentials saved successfully to ${outputPath}`);
        process.exit(0);
    } catch (error) {
        console.error('Error generating mentors:', error);
        process.exit(1);
    }
};

generateMentors();
