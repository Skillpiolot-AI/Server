const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const Application = require('../models/Application');

const fixMentors = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://ujjwal:123@cluster0.w3h2a.mongodb.net/SIH?retryWrites=true&w=majority&appName=Cluster0 ")

        // Find all users who are mentors and should be verified (already approved)
        const approvedApplications = await Application.find({ status: 'Approved' });
        console.log(`Found ${approvedApplications.length} approved applications.`);

        for (const app of approvedApplications) {
            if (app.mentorUserId) {
                console.log(`Fixing mentor: ${app.name} (${app.email})`);

                // Update User
                await User.findByIdAndUpdate(app.mentorUserId, {
                    isVerified: true,
                    mentorStatus: 'verified',
                    mentorBadge: 'verified',
                    'mentorVerification.emailVerified': true,
                    'mentorVerification.phoneVerified': true
                });

                // Update Profile
                if (app.mentorProfileId) {
                    await MentorProfile.findByIdAndUpdate(app.mentorProfileId, {
                        isVisible: true
                    });
                }
            }
        }

        console.log('Finished fixing mentors!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing mentors:', error);
        process.exit(1);
    }
};

fixMentors();
