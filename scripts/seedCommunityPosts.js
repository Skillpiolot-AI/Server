/**
 * Seed script: Create subgroups and posts inside the first group found in DB
 * Usage: node scripts/seedCommunityPosts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Group = require('../models/Group');
const SubGroup = require('../models/SubGroup');
const GroupPost = require('../models/GroupPost');
const GroupMember = require('../models/GroupMember');
const User = require('../models/User');

const MONGO_URI =
  process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/skillpilot';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  // Get first group and owner
  const group = await Group.findOne().sort({ createdAt: -1 });
  if (!group) {
    console.log('No group found. Create one first.');
    process.exit(1);
  }
  console.log(`Seeding inside group: "${group.name}"`);

  const owner = await User.findById(group.owner);
  if (!owner) {
    console.log('Owner not found');
    process.exit(1);
  }

  // Create 2 subgroups
  const subs = await SubGroup.insertMany(
    [
      {
        name: 'General Discussion',
        slug: 'general',
        description: 'All general discussion',
        parentGroup: group._id,
        owner: owner._id,
      },
      {
        name: 'Resources & Links',
        slug: 'resources',
        description: 'Useful resources and links',
        parentGroup: group._id,
        owner: owner._id,
      },
    ].filter(async s => !(await SubGroup.findOne({ parentGroup: group._id, slug: s.slug })))
  ).catch(() => []);
  console.log(`Created ${subs.length} subgroups`);

  // Create 5 posts
  const posts = [
    {
      title: `Welcome to ${group.name}! 🎉`,
      body: `This is the official community for ${group.name}. Share resources, ask questions, and help each other grow!`,
      type: 'text',
      author: owner._id,
      group: group._id,
      flair: 'Announcement',
    },
    {
      title: 'What resources helped you the most?',
      body: 'Drop your best learning resources in the comments below. Courses, blogs, YouTube channels — everything counts!',
      type: 'text',
      author: owner._id,
      group: group._id,
    },
    {
      title: 'Weekly Check-in 📌 — What are you working on?',
      body: 'Share what you are learning or building this week. Let us keep each other accountable!',
      type: 'text',
      author: owner._id,
      group: group._id,
      isPinned: true,
    },
    {
      title: 'Roadmap suggestion: Add a mentorship tracker',
      body: 'Would love to see a feature where we can track mentor sessions and review them later.',
      type: 'text',
      author: owner._id,
      group: group._id,
    },
    {
      title: 'Check out this great tutorial',
      url: 'https://javascript.info',
      type: 'link',
      body: 'One of the best JS references I have found.',
      author: owner._id,
      group: group._id,
    },
  ];

  let created = 0;
  for (const p of posts) {
    const exists = await GroupPost.findOne({ title: p.title, group: group._id });
    if (!exists) {
      await GroupPost.create(p);
      created++;
    }
  }
  console.log(`Created ${created} posts`);

  mongoose.disconnect();
  console.log('Done. Visit /groups to see the feed!');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
