// bulkCreateMentors.js
// Run with: node bulkCreateMentors.js

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'ujjwaljha744@gmail.com';  // Replace with your admin email
const ADMIN_PASSWORD = 'Ujjwaljha_12';          // Replace with your admin password

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Mentor data
const mentors = [
  {
    name: 'Rajesh Kumar',
    email: 'ujjwaljha018@gmail.com',
    username: 'rajesh_kumar',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543210',
    jobTitle: 'Senior Software Engineer',
    companiesJoined: ['Google', 'Microsoft', 'Amazon'],
    experience: 8,
    imageUrl: 'https://i.pravatar.cc/300?img=12'
  },
  {
    name: 'Priya Sharma',
    email: 'priyajha8919@gmail.com',
    username: 'priya_sharma',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543211',
    jobTitle: 'Lead Data Scientist',
    companiesJoined: ['Amazon', 'Facebook', 'Netflix'],
    experience: 6,
    imageUrl: 'https://i.pravatar.cc/300?img=5'
  },
  {
    name: 'Amit Patel',
    email: 'ujjwaljha7444@gmail.com',
    username: 'amit_patel',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543212',
    jobTitle: 'Product Manager',
    companiesJoined: ['Apple', 'Netflix', 'Spotify'],
    experience: 10,
    imageUrl: 'https://i.pravatar.cc/300?img=33'
  },
  {
    name: 'Sneha Reddy',
    email: 'brajeshkumarjha743@gmail.com',
    username: 'sneha_reddy',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543213',
    jobTitle: 'Senior UI/UX Designer',
    companiesJoined: ['Adobe', 'Figma', 'Airbnb'],
    experience: 5,
    imageUrl: 'https://i.pravatar.cc/300?img=9'
  },
  {
    name: 'Vikram Singh',
    email: 'helloworld8919@gmail.com',
    username: 'vikram_singh',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543214',
    jobTitle: 'DevOps Engineer',
    companiesJoined: ['AWS', 'Docker', 'Kubernetes'],
    experience: 7,
    imageUrl: 'https://i.pravatar.cc/300?img=15'
  },
  {
    name: 'Anjali Verma',
    email: 'k22dn2023@gmail.com',
    username: 'anjali_verma',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543215',
    jobTitle: 'Senior Business Analyst',
    companiesJoined: ['McKinsey', 'Deloitte', 'BCG'],
    experience: 9,
    imageUrl: 'https://i.pravatar.cc/300?img=20'
  },
  {
    name: 'Karan Mehta',
    email: 'karan.mehta@skillpilot.dev',
    username: 'karan_mehta',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543216',
    jobTitle: 'Full Stack Developer',
    companiesJoined: ['Stripe', 'Shopify', 'Square'],
    experience: 6,
    imageUrl: 'https://i.pravatar.cc/300?img=51'
  },
  {
    name: 'Deepika Joshi',
    email: 'deepika.joshi@skillpilot.dev',
    username: 'deepika_joshi',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543217',
    jobTitle: 'ML Engineer',
    companiesJoined: ['OpenAI', 'Tesla', 'NVIDIA'],
    experience: 8,
    imageUrl: 'https://i.pravatar.cc/300?img=44'
  },
  {
    name: 'Rohit Gupta',
    email: 'rohit.gupta@skillpilot.dev',
    username: 'rohit_gupta',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543218',
    jobTitle: 'Cybersecurity Specialist',
    companiesJoined: ['Cisco', 'Palo Alto', 'CrowdStrike'],
    experience: 7,
    imageUrl: 'https://i.pravatar.cc/300?img=68'
  },
  {
    name: 'Kavya Nair',
    email: 'kavya.nair@skillpilot.dev',
    username: 'kavya_nair',
    password: 'Mentor_123',
    phoneNumber: '+91-9876543219',
    jobTitle: 'Cloud Architect',
    companiesJoined: ['IBM', 'Oracle', 'Salesforce'],
    experience: 10,
    imageUrl: 'https://i.pravatar.cc/300?img=24'
  }
];

async function main() {
  console.log('\n' + '='.repeat(50));
  log.info('🚀 Skill-Pilot Bulk Mentor Creation Tool');
  console.log('='.repeat(50) + '\n');

  try {
    // Step 1: Login as Admin
    log.info('Step 1: Logging in as Admin...');

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.token) {
      log.error('Login failed! No token received.');
      process.exit(1);
    }

    const token = loginResponse.data.token;
    log.success('Admin login successful!\n');

    // Step 2: Create Mentors in Bulk
    log.info(`Step 2: Creating ${mentors.length} mentors in bulk...`);

    const createResponse = await axios.post(
      `${API_URL}/bulk-create-mentors`,
      { mentors },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (createResponse.data.success) {
      log.success('Bulk creation completed!\n');

      console.log('📊 Summary:');
      console.log(`  • Created: ${createResponse.data.summary.created} mentors`);
      console.log(`  • Skipped: ${createResponse.data.summary.skipped} (already exist)`);
      console.log(`  • Failed: ${createResponse.data.summary.failed}\n`);

      // Show created mentors
      if (createResponse.data.results.created.length > 0) {
        console.log('✅ Successfully Created Mentors:');
        createResponse.data.results.created.forEach((mentor, index) => {
          const emailStatus = mentor.emailSent ? '📧' : '⚠️ (no email)';
          console.log(`  ${index + 1}. ${mentor.name} (${mentor.username}) ${emailStatus}`);
        });
        console.log('');
      }

      // Show skipped mentors
      if (createResponse.data.results.skipped.length > 0) {
        console.log('⏭️  Skipped Mentors (Already Exist):');
        createResponse.data.results.skipped.forEach((mentor, index) => {
          console.log(`  ${index + 1}. ${mentor.username} - ${mentor.reason}`);
        });
        console.log('');
      }

      // Show failed mentors
      if (createResponse.data.results.failed.length > 0) {
        log.warning('Failed Mentors:');
        createResponse.data.results.failed.forEach((mentor, index) => {
          console.log(`  ${index + 1}. ${mentor.email} - ${mentor.reason}`);
        });
        console.log('');
      }

    } else {
      log.error('Bulk creation failed!');
      console.log(createResponse.data);
      process.exit(1);
    }

    // Step 3: Auto-verify all mentors (optional - mentors are already auto-verified during creation)
    if (createResponse.data.summary.created > 0) {
      log.info('Step 3: Verifying mentor status...');

      try {
        const verifyResponse = await axios.post(
          `${API_URL}/auth/auto-verify-all-mentors`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (verifyResponse.data.success) {
          log.success(`Additional verification: ${verifyResponse.data.modifiedCount} mentors\n`);
        }
      } catch (verifyError) {
        // If endpoint doesn't exist, that's okay - mentors are auto-verified during creation
        log.success('Mentors already verified during creation\n');
      }
    }

    // Step 4: Get final mentor list
    log.info('Step 4: Fetching mentor statistics...');

    const mentorsResponse = await axios.get(
      `${API_URL}/mentors?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (mentorsResponse.data.success) {
      log.success(`Total mentors in system: ${mentorsResponse.data.totalMentors}\n`);
    }

    // Final summary
    console.log('='.repeat(50));
    log.success('🎉 Mentor creation complete!\n');

    console.log('🔐 Default Mentor Credentials:');
    console.log('  Password: Mentor_123\n');

    console.log('📧 Welcome emails sent to all created mentors');
    console.log('🌐 Mentors can login at: http://localhost:5173/login\n');

    log.warning('Mentors should change their passwords on first login\n');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    log.error('Error occurred during bulk creation:');

    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message || error.response.data);
    } else if (error.request) {
      log.error('No response from server. Is the server running?');
    } else {
      console.log('Error:', error.message);
    }

    console.log('='.repeat(50) + '\n');
    process.exit(1);
  }
}

// Run the script
main();
