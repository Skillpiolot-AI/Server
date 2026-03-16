require('dotenv').config();
const mongoose = require('mongoose');
const Career = require('./models/Career'); // Mongoose model 'CareerResult'

const careers = [
  // ── R: Realistic (Practical, Hands-on)
  {
    id: 1, name: 'Software Developer', slug: 'software-developer', career_type: 'Professional',
    career_cluster_name: 'Information Technology',
    holland_codes: ['I', 'R', 'C'], primary_holland_code: 'I',
    salary_range: { '0_2': { salary_from: 600000, salary_to: 1500000 } },
    future_growth: { very_long_term: { text: "High", value: 90 } },
  },
  {
    id: 2, name: 'Mechanical Engineer', slug: 'mechanical-engineer', career_type: 'Professional',
    career_cluster_name: 'Engineering',
    holland_codes: ['R', 'I', 'C'], primary_holland_code: 'R',
    salary_range: { '0_2': { salary_from: 400000, salary_to: 900000 } },
    future_growth: { very_long_term: { text: "Average", value: 65 } },
  },
  
  // ── I: Investigative (Analytical, Scientific)
  {
    id: 3, name: 'Data Scientist', slug: 'data-scientist', career_type: 'Professional',
    career_cluster_name: 'Information Technology',
    holland_codes: ['I', 'C', 'R'], primary_holland_code: 'I',
    salary_range: { '0_2': { salary_from: 800000, salary_to: 1800000 } },
    future_growth: { very_long_term: { text: "Very High", value: 95 } },
  },
  {
    id: 4, name: 'Medical Doctor', slug: 'medical-doctor', career_type: 'Professional',
    career_cluster_name: 'Healthcare',
    holland_codes: ['I', 'S', 'R'], primary_holland_code: 'I',
    salary_range: { '0_2': { salary_from: 1000000, salary_to: 2000000 } },
    future_growth: { very_long_term: { text: "High", value: 85 } },
  },

  // ── A: Artistic (Creative, Unstructured)
  {
    id: 5, name: 'UX/UI Designer', slug: 'ux-ui-designer', career_type: 'Professional',
    career_cluster_name: 'Information Technology',
    holland_codes: ['A', 'I', 'E'], primary_holland_code: 'A',
    salary_range: { '0_2': { salary_from: 500000, salary_to: 1200000 } },
    future_growth: { very_long_term: { text: "High", value: 88 } },
  },
  {
    id: 6, name: 'Graphic Designer', slug: 'graphic-designer', career_type: 'Professional',
    career_cluster_name: 'Arts & Design',
    holland_codes: ['A', 'R', 'E'], primary_holland_code: 'A',
    salary_range: { '0_2': { salary_from: 300000, salary_to: 700000 } },
    future_growth: { very_long_term: { text: "Average", value: 60 } },
  },

  // ── S: Social (Helping, Teaching)
  {
    id: 7, name: 'Teacher / Educator', slug: 'teacher', career_type: 'Professional',
    career_cluster_name: 'Education',
    holland_codes: ['S', 'A', 'E'], primary_holland_code: 'S',
    salary_range: { '0_2': { salary_from: 300000, salary_to: 800000 } },
    future_growth: { very_long_term: { text: "Stable", value: 70 } },
  },
  {
    id: 8, name: 'Clinical Psychologist', slug: 'clinical-psychologist', career_type: 'Professional',
    career_cluster_name: 'Healthcare',
    holland_codes: ['S', 'I', 'A'], primary_holland_code: 'S',
    salary_range: { '0_2': { salary_from: 400000, salary_to: 1000000 } },
    future_growth: { very_long_term: { text: "High", value: 80 } },
  },

  // ── E: Enterprising (Leading, Persuading)
  {
    id: 9, name: 'Product Manager', slug: 'product-manager', career_type: 'Professional',
    career_cluster_name: 'Business',
    holland_codes: ['E', 'I', 'C'], primary_holland_code: 'E',
    salary_range: { '0_2': { salary_from: 1000000, salary_to: 2500000 } },
    future_growth: { very_long_term: { text: "Very High", value: 92 } },
  },
  {
    id: 10, name: 'Marketing Director', slug: 'marketing-director', career_type: 'Professional',
    career_cluster_name: 'Business',
    holland_codes: ['E', 'A', 'S'], primary_holland_code: 'E',
    salary_range: { '0_2': { salary_from: 800000, salary_to: 1800000 } },
    future_growth: { very_long_term: { text: "High", value: 75 } },
  },

  // ── C: Conventional (Organizing, Data)
  {
    id: 11, name: 'Chartered Accountant', slug: 'chartered-accountant', career_type: 'Professional',
    career_cluster_name: 'Finance',
    holland_codes: ['C', 'E', 'I'], primary_holland_code: 'C',
    salary_range: { '0_2': { salary_from: 700000, salary_to: 1500000 } },
    future_growth: { very_long_term: { text: "Stable", value: 75 } },
  },
  {
    id: 12, name: 'Data Analyst', slug: 'data-analyst', career_type: 'Professional',
    career_cluster_name: 'Information Technology',
    holland_codes: ['C', 'I', 'E'], primary_holland_code: 'C',
    salary_range: { '0_2': { salary_from: 500000, salary_to: 1200000 } },
    future_growth: { very_long_term: { text: "High", value: 85 } },
  },

  // ── Mixed Profiles
  {
    id: 13, name: 'Cybersecurity Analyst', slug: 'cybersecurity-analyst', career_type: 'Professional',
    career_cluster_name: 'Information Technology',
    holland_codes: ['I', 'R', 'C'], primary_holland_code: 'I',
    salary_range: { '0_2': { salary_from: 700000, salary_to: 1400000 } },
    future_growth: { very_long_term: { text: "Very High", value: 95 } },
  },
  {
    id: 14, name: 'Human Resources Manager', slug: 'hr-manager', career_type: 'Professional',
    career_cluster_name: 'Business',
    holland_codes: ['E', 'S', 'C'], primary_holland_code: 'E',
    salary_range: { '0_2': { salary_from: 600000, salary_to: 1200000 } },
    future_growth: { very_long_term: { text: "Stable", value: 70 } },
  },
  {
    id: 15, name: 'Entrepreneur / Founder', slug: 'entrepreneur', career_type: 'Professional',
    career_cluster_name: 'Business',
    holland_codes: ['E', 'A', 'I'], primary_holland_code: 'E',
    salary_range: { '0_2': { salary_from: 0, salary_to: 5000000 } },
    future_growth: { very_long_term: { text: "Variable", value: 80 } },
  }
];

async function seedCareers() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');

    const deleted = await Career.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing careers`);

    const inserted = await Career.insertMany(careers);
    console.log(`✅ Successfully seeded ${inserted.length} careers for recommendations`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedCareers();
