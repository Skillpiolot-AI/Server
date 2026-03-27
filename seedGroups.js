require('dotenv').config();
const mongoose = require('mongoose');
const Group = require('./models/Group');
const User = require('./models/User');

const seedGroups = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB');

    // Find a user to act as the owner
    const user = await User.findOne();
    if (!user) {
      console.error('No users found in the database. Please create a user first.');
      process.exit(1);
    }

    const mockGroups = [
      {
        name: 'Web3 & Blockchain Innovators',
        description:
          'A community for exploring decentralized applications, smart contracts, and the future of web3 technologies. We host weekly workshops and hackathons.',
        type: 'Public',
        owner: user._id,
        category: 'Technology',
        membersCount: 142,
        settings: {
          allowMemberInvites: true,
          autoModerationEnabled: true,
          contentFiltering: true,
        },
        rules: [
          { title: 'Rule 1', description: 'Be respectful to everyone.' },
          {
            title: 'Rule 2',
            description: 'No spamming or self-promotion outside of designated channels.',
          },
        ],
      },
      {
        name: 'AI Engineering Hub',
        description:
          'Deep dive into Machine Learning, Neural Networks, and AI capabilities. Join us as we build models and discuss cutting-edge research.',
        type: 'Public',
        owner: user._id,
        category: 'Artificial Intelligence',
        membersCount: 305,
        settings: {
          allowMemberInvites: true,
          autoModerationEnabled: true,
          contentFiltering: true,
        },
        rules: [
          { title: 'Collaborate', description: 'Share your findings and code.' },
          { title: 'Stay Relevant', description: 'Keep discussions related to AI/ML.' },
        ],
      },
      {
        name: 'Design Systems Architects',
        description:
          'For UI/UX designers and frontend developers interested in creating robust, scalable, and premium design systems.',
        type: 'Public',
        owner: user._id,
        category: 'Design',
        membersCount: 89,
        settings: {
          allowMemberInvites: true,
          autoModerationEnabled: true,
          contentFiltering: true,
        },
        rules: [
          {
            title: 'Constructive Feedback',
            description: 'Always provide constructive design critiques.',
          },
        ],
      },
      {
        name: 'Cybersecurity Network',
        description:
          'Zero-day exploits, penetration testing, and ethical hacking discussions. A safe place for cyber professionals to network.',
        type: 'Public',
        owner: user._id,
        category: 'Security',
        membersCount: 56,
        settings: {
          allowMemberInvites: true,
          autoModerationEnabled: true,
          contentFiltering: true,
        },
        rules: [{ title: 'Legal Only', description: 'Only discuss ethical hacking techniques.' }],
      },
    ];

    console.log('Inserting mock groups...');
    // We can clear existing groups optionally, but let's just insert to avoid deleting user logic
    // await Group.deleteMany({});

    for (let group of mockGroups) {
      await Group.create(group);
      console.log(`Created group: ${group.name}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding groups:', error);
    process.exit(1);
  }
};

seedGroups();
