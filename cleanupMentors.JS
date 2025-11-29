// cleanupMentors.js
// Run with: node cleanupMentors.js
// WARNING: This will DELETE all mentors! Use with caution!

const axios = require('axios');
const readline = require('readline');

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
  blue: '\x1b[34m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanupMentors() {
  console.log('\n' + '='.repeat(60));
  log.warning('🗑️  Skill-Pilot Mentor Cleanup Tool');
  console.log('='.repeat(60) + '\n');

  log.warning('WARNING: This will DELETE all mentor accounts!');
  console.log('');

  try {
    // Step 1: Login as Admin
    log.info('Logging in as Admin...');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (!loginResponse.data.token) {
      log.error('Login failed!');
      rl.close();
      process.exit(1);
    }

    const token = loginResponse.data.token;
    log.success('Admin login successful!\n');

    // Step 2: Get all mentors
    log.info('Fetching all mentors...');
    
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
      rl.close();
      process.exit(1);
    }

    const mentors = mentorsResponse.data.mentors;
    log.info(`Found ${mentors.length} mentors\n`);

    if (mentors.length === 0) {
      log.info('No mentors to delete!');
      rl.close();
      return;
    }

    // Show mentors that will be deleted
    console.log('📋 Mentors that will be DELETED:\n');
    mentors.forEach((mentor, index) => {
      console.log(`  ${index + 1}. ${mentor.name} (${mentor.username}) - ${mentor.email}`);
    });

    console.log('\n' + '='.repeat(60) + '\n');

    // Ask for confirmation
    const answer1 = await askQuestion(`${colors.red}Are you sure you want to delete ${mentors.length} mentors? (yes/no): ${colors.reset}`);
    
    if (answer1.toLowerCase() !== 'yes') {
      log.info('Cleanup cancelled.');
      rl.close();
      return;
    }

    const answer2 = await askQuestion(`${colors.red}Type 'DELETE' to confirm: ${colors.reset}`);
    
    if (answer2 !== 'DELETE') {
      log.info('Cleanup cancelled.');
      rl.close();
      return;
    }

    console.log('');
    log.warning('Starting deletion process...\n');

    // Step 3: Delete mentors one by one
    let deleted = 0;
    let failed = 0;

    for (const mentor of mentors) {
      try {
        // Note: You need to create this endpoint in your backend
        await axios.delete(
          `${API_URL}/admin/user/${mentor._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log(`${colors.green}✓${colors.reset} Deleted: ${mentor.name} (${mentor.username})`);
        deleted++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset} Failed: ${mentor.name} (${mentor.username})`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    log.success(`Cleanup completed!`);
    console.log(`\n  Deleted: ${deleted}`);
    console.log(`  Failed: ${failed}\n`);
    console.log('='.repeat(60) + '\n');

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
  } finally {
    rl.close();
  }
}

// Run cleanup
cleanupMentors();