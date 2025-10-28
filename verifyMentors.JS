// verifyMentors.js
// Run with: node verifyMentors.js
// This script checks all created mentors and their verification status

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3001/api';
const ADMIN_EMAIL = 'ujjwaljha744@gmail.com';
const ADMIN_PASSWORD = 'Ujjwaljha_12';

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

async function verifyMentors() {
  console.log('\n' + '='.repeat(60));
  log.info('🔍 Skill-Pilot Mentor Verification Tool');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Login as Admin
    log.info('Logging in as Admin...');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.token) {
      log.error('Login failed!');
      process.exit(1);
    }

    const token = loginResponse.data.token;
    log.success('Admin login successful!\n');

    // Step 2: Get all mentors
    log.info('Fetching all mentors...\n');
    
    const mentorsResponse = await axios.get(
      `${API_URL}/mentors?limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!mentorsResponse.data.success) {
      log.error('Failed to fetch mentors');
      process.exit(1);
    }

    const mentors = mentorsResponse.data.mentors;
    const totalMentors = mentorsResponse.data.totalMentors;

    console.log('='.repeat(60));
    log.success(`Total Mentors Found: ${totalMentors}\n`);

    // Statistics
    const stats = {
      total: mentors.length,
      verified: 0,
      unverified: 0,
      active: 0,
      inactive: 0
    };

    console.log('📊 MENTOR DETAILS:\n');
    console.log('─'.repeat(60));

    mentors.forEach((mentor, index) => {
      const status = [];
      
      if (mentor.isVerified) {
        stats.verified++;
        status.push(`${colors.green}✓ Verified${colors.reset}`);
      } else {
        stats.unverified++;
        status.push(`${colors.red}✗ Not Verified${colors.reset}`);
      }

      if (mentor.isActive) {
        stats.active++;
        status.push(`${colors.green}✓ Active${colors.reset}`);
      } else {
        stats.inactive++;
        status.push(`${colors.red}✗ Inactive${colors.reset}`);
      }

      console.log(`\n${index + 1}. ${colors.cyan}${mentor.name}${colors.reset}`);
      console.log(`   Username: ${mentor.username}`);
      console.log(`   Email: ${mentor.email}`);
      console.log(`   Job Title: ${mentor.jobTitle || 'N/A'}`);
      console.log(`   Experience: ${mentor.experience || 'N/A'} years`);
      console.log(`   Status: ${status.join(' | ')}`);
      
      if (mentor.companiesJoined && mentor.companiesJoined.length > 0) {
        console.log(`   Companies: ${mentor.companiesJoined.join(', ')}`);
      }
    });

    console.log('\n' + '─'.repeat(60));
    console.log('\n📈 STATISTICS:\n');
    console.log(`   Total Mentors: ${stats.total}`);
    console.log(`   ${colors.green}Verified: ${stats.verified}${colors.reset}`);
    console.log(`   ${colors.red}Unverified: ${stats.unverified}${colors.reset}`);
    console.log(`   ${colors.green}Active: ${stats.active}${colors.reset}`);
    console.log(`   ${colors.red}Inactive: ${stats.inactive}${colors.reset}`);

    console.log('\n' + '='.repeat(60));

    // Check if all mentors are verified
    if (stats.unverified > 0) {
      console.log('\n');
      log.warning(`${stats.unverified} mentor(s) are not verified!`);
      log.info('You can verify them using the bulk verify endpoint\n');
    } else {
      console.log('\n');
      log.success('All mentors are verified! ✨\n');
    }

    // Show login credentials reminder
    console.log('🔐 LOGIN CREDENTIALS:\n');
    console.log('   Default Password: Mentor@123');
    console.log('   Login URL: http://localhost:5173/login');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    log.error('Error occurred:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message || error.response.data);
    } else if (error.request) {
      log.error('No response from server. Is the server running?');
    } else {
      console.log('Error:', error.message);
    }
    
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Run verification
verifyMentors();