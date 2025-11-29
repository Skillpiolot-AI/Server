const Assessment = require('../models/Assessment');
const Career = require('../models/Career');

const calculateScores = (answers) => {
  const domainScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  Object.entries(answers).forEach(([questionId, value]) => {
    const domain = questionId.charAt(0);
    if (domainScores.hasOwnProperty(domain)) {
      domainScores[domain] += value;
    }
  });

  const total = Object.values(domainScores).reduce((a, b) => a + b, 0);
  const percentages = {};

  Object.keys(domainScores).forEach(domain => {
    percentages[domain] = Math.round((domainScores[domain] / total) * 100);
  });

  const sorted = Object.entries(percentages)
    .sort((a, b) => b[1] - a[1])
    .map(([domain]) => domain);

  const hollandCode = sorted.slice(0, 3).join('');

  return {
    domainScores,
    percentages,
    hollandCode,
    topThreeDomains: sorted.slice(0, 3)
  };
};

const calculateMatchScore = (userHollandCode, careerHollandCodes) => {
  if (!careerHollandCodes || careerHollandCodes.length === 0) return 0;

  const userCodes = userHollandCode.split('');
  let score = 0;
  let matchedPositions = 0;

  // First pass: Check for matches and position bonuses
  userCodes.forEach((code, userIndex) => {
    const careerIndex = careerHollandCodes.indexOf(code);

    if (careerIndex !== -1) {
      // Base points for matching (weighted by user's priority)
      if (userIndex === 0) score += 50;      // User's primary trait
      else if (userIndex === 1) score += 30; // User's secondary trait
      else if (userIndex === 2) score += 20; // User's tertiary trait

      // Bonus points if positions match exactly
      if (careerIndex === userIndex) {
        score += 15;
        matchedPositions++;
      }
      // Smaller bonus if within one position
      else if (Math.abs(careerIndex - userIndex) === 1) {
        score += 5;
      }
    }
  });

  // Additional bonus for multiple exact position matches
  if (matchedPositions === 3) score += 10; // Perfect match bonus
  else if (matchedPositions === 2) score += 5;

  // Penalty if no matches at all
  if (score === 0) return 0;

  // Cap at 100 and ensure minimum variance
  return Math.min(Math.round(score), 100);
};

exports.createAssessment = async (req, res) => {
  try {
    const { userId, answers } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    const results = calculateScores(answers);

    // Get career recommendations
    const allCareers = await Career.find()
      .select('id name career_cluster_name career_type salary_range future_growth holland_codes minimum_expense icon');

    const careersWithScores = allCareers
      .map(career => {
        const matchScore = calculateMatchScore(results.hollandCode, career.holland_codes);
        return {
          careerId: career.id,
          name: career.name,
          cluster: career.career_cluster_name,
          career_type: career.career_type,
          salary_range: career.salary_range,
          future_growth: career.future_growth,
          minimum_expense: career.minimum_expense,
          icon: career.icon,
          holland_codes: career.holland_codes, // Include this for frontend recalculation if needed
          matchScore
        };
      })
      .filter(career => career.matchScore > 0)
      .sort((a, b) => {
        // Sort by match score, then by name for consistency
        if (b.matchScore === a.matchScore) {
          return a.name.localeCompare(b.name);
        }
        return b.matchScore - a.matchScore;
      })
      .slice(0, 15);

    results.recommendedCareers = careersWithScores;

    const assessment = new Assessment({
      userId,
      answers,
      results,
      shareableLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/results/${Date.now()}`
    });

    await assessment.save();

    res.status(201).json({
      success: true,
      data: assessment,
      message: 'Assessment completed successfully'
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({
      userId: req.params.userId
    })
      .sort({ completedAt: -1 })
      .select('-answers');

    res.json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
