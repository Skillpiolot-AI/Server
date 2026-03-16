/**
 * seedRiasecQuestions.js
 * Seeds all 42 RIASEC assessment questions into the Question collection.
 * Clears any existing questions first to avoid duplicates.
 *
 * RIASEC Domain mapping:
 *  R = Realistic    (likes working with tools, machines, outdoors)
 *  I = Investigative (likes science, analysis, solving puzzles)
 *  A = Artistic     (likes creating, writing, music, art)
 *  S = Social       (likes helping, teaching, working with people)
 *  E = Enterprising (likes leading, selling, persuading, business)
 *  C = Conventional (likes organizing, filing, working with data/numbers)
 *
 * Run: node seedRiasecQuestions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');

const questions = [
  // ── R: Realistic ──────────────────────────────────────────────────────────
  { id: 'q1', domain: 'R', order: 1, text: 'I like to work on cars' },
  { id: 'q7', domain: 'R', order: 7, text: 'I like to build things' },
  {
    id: 'q22',
    domain: 'R',
    order: 22,
    text: 'I like putting things together or assembling things',
  },
  { id: 'q30', domain: 'R', order: 30, text: 'I like to cook' },
  { id: 'q32', domain: 'R', order: 32, text: 'I am a practical person' },
  { id: 'q37', domain: 'R', order: 37, text: 'I like working outdoors' },

  // ── I: Investigative ──────────────────────────────────────────────────────
  { id: 'q11', domain: 'I', order: 11, text: 'I like to do experiments' },
  { id: 'q18', domain: 'I', order: 18, text: 'I enjoy science' },
  { id: 'q21', domain: 'I', order: 21, text: 'I enjoy trying to figure out how things work' },
  { id: 'q26', domain: 'I', order: 26, text: 'I like to analyze things (problems / situations)' },
  { id: 'q33', domain: 'I', order: 33, text: 'I like working with numbers or charts' },
  { id: 'q39', domain: 'I', order: 39, text: "I'm good at math" },

  // ── A: Artistic ───────────────────────────────────────────────────────────
  { id: 'q8', domain: 'A', order: 8, text: 'I like to read about art and music' },
  { id: 'q17', domain: 'A', order: 17, text: 'I enjoy creative writing' },
  { id: 'q23', domain: 'A', order: 23, text: 'I am a creative person' },
  { id: 'q27', domain: 'A', order: 27, text: 'I like to play instruments or sing' },
  { id: 'q31', domain: 'A', order: 31, text: 'I like acting in plays' },
  { id: 'q41', domain: 'A', order: 41, text: 'I like to draw' },

  // ── S: Social ─────────────────────────────────────────────────────────────
  { id: 'q12', domain: 'S', order: 12, text: 'I like to teach or train people' },
  { id: 'q13', domain: 'S', order: 13, text: 'I like trying to help people solve their problems' },
  { id: 'q14', domain: 'S', order: 14, text: 'I like to take care of animals' },
  { id: 'q20', domain: 'S', order: 20, text: 'I am interested in healing people' },
  { id: 'q28', domain: 'S', order: 28, text: 'I enjoy learning about other cultures' },
  { id: 'q40', domain: 'S', order: 40, text: 'I like helping people' },

  // ── E: Enterprising ───────────────────────────────────────────────────────
  { id: 'q10', domain: 'E', order: 10, text: 'I like to try to influence or persuade people' },
  { id: 'q16', domain: 'E', order: 16, text: 'I like selling things' },
  { id: 'q19', domain: 'E', order: 19, text: 'I am quick to take on new responsibilities' },
  { id: 'q29', domain: 'E', order: 29, text: 'I would like to start my own business' },
  { id: 'q34', domain: 'E', order: 34, text: 'I like to get into discussions about issues' },
  { id: 'q36', domain: 'E', order: 36, text: 'I like to lead' },
  { id: 'q42', domain: 'E', order: 42, text: 'I like to give speeches' },

  // ── C: Conventional ───────────────────────────────────────────────────────
  { id: 'q2', domain: 'C', order: 2, text: 'I like to do puzzles' },
  { id: 'q5', domain: 'C', order: 5, text: 'I am an ambitious person, I set goals for myself' },
  { id: 'q6', domain: 'C', order: 6, text: 'I like to organize things (files, desks/offices)' },
  { id: 'q9', domain: 'C', order: 9, text: 'I like to have clear instructions to follow' },
  {
    id: 'q15',
    domain: 'C',
    order: 15,
    text: "I wouldn't mind working 8 hours per day in an office",
  },
  { id: 'q24', domain: 'C', order: 24, text: 'I pay attention to details' },
  { id: 'q25', domain: 'C', order: 25, text: 'I like to do filing or typing' },
  { id: 'q35', domain: 'C', order: 35, text: 'I am good at keeping records of my work' },
  { id: 'q38', domain: 'C', order: 38, text: 'I would like to work in an office' },

  // ── Mixed / Crossover ─────────────────────────────────────────────────────
  // (questions that couldn't map to a single pure domain are placed in their
  //  closest match based on standard RIASEC literature)
  { id: 'q3', domain: 'R', order: 3, text: 'I am good at working independently' },
  { id: 'q4', domain: 'S', order: 4, text: 'I like to work in teams' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log('✅ Connected to MongoDB');

  // Clear existing questions
  const deleted = await Question.deleteMany({});
  console.log(`🗑️  Cleared ${deleted.deletedCount} existing question(s)`);

  // Insert all 42 questions
  const inserted = await Question.insertMany(questions);
  console.log(`✅ Inserted ${inserted.length} questions`);

  // Print summary by domain
  const domains = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const labels = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional',
  };
  inserted.forEach(q => {
    if (domains[q.domain] !== undefined) domains[q.domain]++;
  });

  console.log('\n📊 Questions per domain:');
  Object.entries(domains).forEach(([d, count]) => {
    console.log(`   ${d} (${labels[d]}): ${count} questions`);
  });

  console.log('\n✅ RIASEC Assessment Questions seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
