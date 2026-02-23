const Assessment = require('../models/Assessment');
const Career = require('../models/Career');

const calculateScores = answers => {
  const domainScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  Object.entries(answers).forEach(([questionId, value]) => {
    const domain = questionId.charAt(0);
    if (Object.hasOwn(domainScores, domain)) {
      domainScores[domain] += value;
    }
  });

  const total = Object.values(domainScores).reduce((a, b) => a + b, 0);
  const percentages = {};

  Object.keys(domainScores).forEach(domain => {
    percentages[domain] = total > 0 ? Math.round((domainScores[domain] / total) * 100) : 0;
  });

  const sorted = Object.entries(percentages)
    .sort((a, b) => b[1] - a[1])
    .map(([domain]) => domain);

  const hollandCode = sorted.slice(0, 3).join('');

  return {
    domainScores,
    percentages,
    hollandCode,
    topThreeDomains: sorted.slice(0, 3),
  };
};

const calculateMatchScore = (userHollandCode, careerHollandCodes) => {
  if (!careerHollandCodes || careerHollandCodes.length === 0) return 0;

  const userCodes = userHollandCode.split('');
  let score = 0;
  let matchedPositions = 0;

  userCodes.forEach((code, userIndex) => {
    const careerIndex = careerHollandCodes.indexOf(code);

    if (careerIndex !== -1) {
      if (userIndex === 0) score += 50;
      else if (userIndex === 1) score += 30;
      else if (userIndex === 2) score += 20;

      if (careerIndex === userIndex) {
        score += 15;
        matchedPositions++;
      } else if (Math.abs(careerIndex - userIndex) === 1) {
        score += 5;
      }
    }
  });

  if (matchedPositions === 3) score += 10;
  else if (matchedPositions === 2) score += 5;

  if (score === 0) return 0;

  return Math.min(Math.round(score), 100);
};

// Calculate improvement from previous assessment
const calculateImprovement = (currentResults, previousResults) => {
  if (!previousResults) {
    return { hasImproved: null, percentageChange: 0, dominantTraitChange: null };
  }

  const currentTop = currentResults.topThreeDomains[0];
  const previousTop = previousResults.topThreeDomains[0];

  const currentTopScore = currentResults.percentages[currentTop] || 0;
  const previousTopScore = previousResults.percentages[previousTop] || 0;

  const percentageChange = currentTopScore - previousTopScore;
  const dominantTraitChange = currentTop !== previousTop ? `${previousTop} → ${currentTop}` : null;

  return {
    hasImproved: percentageChange > 0,
    percentageChange,
    dominantTraitChange,
  };
};

exports.createAssessment = async (req, res) => {
  try {
    const { userId, answers } = req.body;

    // Get authenticated user if available (from token)
    const authenticatedUserId = req.user?._id || null;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    const results = calculateScores(answers);

    // Get career recommendations
    const allCareers = await Career.find().select(
      'id name career_cluster_name career_type salary_range future_growth holland_codes minimum_expense icon'
    );

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
          holland_codes: career.holland_codes,
          matchScore,
        };
      })
      .filter(career => career.matchScore > 0)
      .sort((a, b) => {
        if (b.matchScore === a.matchScore) {
          return a.name.localeCompare(b.name);
        }
        return b.matchScore - a.matchScore;
      })
      .slice(0, 15);

    results.recommendedCareers = careersWithScores;

    // Find previous assessment for improvement tracking
    let previousAssessment = null;
    let improvement = { hasImproved: null, percentageChange: 0, dominantTraitChange: null };

    if (authenticatedUserId) {
      previousAssessment = await Assessment.findOne({ user: authenticatedUserId })
        .sort({ completedAt: -1 })
        .select('results');

      if (previousAssessment) {
        improvement = calculateImprovement(results, previousAssessment.results);
      }
    }

    const assessment = new Assessment({
      user: authenticatedUserId,
      // Store the real user ObjectId as string too — ensures history queries find it by either field
      userId: authenticatedUserId ? authenticatedUserId.toString() : (userId || `anon-${Date.now()}`),
      answers,
      results,
      previousAssessmentId: previousAssessment?._id,
      improvement,
      shareableLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/results/${Date.now()}`,
    });

    await assessment.save();

    res.status(201).json({
      success: true,
      data: assessment,
      message: 'Assessment completed successfully',
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
      data: assessment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({
      userId: req.params.userId,
    })
      .sort({ completedAt: -1 })
      .select('-answers');

    res.json({
      success: true,
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get authenticated user's assessment history with trends
exports.getMyAssessmentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = userId.toString();

    // Query by ObjectId ref (for new assessments) OR userId string (for older records)
    let assessments = await Assessment.find({ user: userId })
      .sort({ completedAt: -1 })
      .select('-answers')
      .limit(10);

    // Fallback: also check by userId string for assessments saved before the fix
    if (assessments.length === 0) {
      assessments = await Assessment.find({ userId: userIdStr })
        .sort({ completedAt: -1 })
        .select('-answers')
        .limit(10);

      // Back-fill the `user` field on these old records so future fetches hit the fast path
      if (assessments.length > 0) {
        await Assessment.updateMany({ userId: userIdStr, user: null }, { $set: { user: userId } });
      }
    }

    if (assessments.length === 0) {
      return res.json({
        success: true,
        data: {
          assessments: [],
          latestResult: null,
          trends: null,
          totalAssessments: 0,
        },
      });
    }

    const latest = assessments[0];
    const previous = assessments[1] || null;

    // Calculate trends
    let trends = null;
    if (previous) {
      const latestPercentages = latest.results.percentages;
      const previousPercentages = previous.results.percentages;

      trends = {
        dominantTraitChange: latest.improvement?.dominantTraitChange || null,
        hasImproved: latest.improvement?.hasImproved,
        percentageChange: latest.improvement?.percentageChange || 0,
        domainChanges: {},
      };

      // Calculate change for each domain
      Object.keys(latestPercentages).forEach(domain => {
        trends.domainChanges[domain] = {
          current: latestPercentages[domain],
          previous: previousPercentages[domain] || 0,
          change: latestPercentages[domain] - (previousPercentages[domain] || 0),
        };
      });
    }

    res.json({
      success: true,
      data: {
        assessments,
        latestResult: latest,
        trends,
        totalAssessments: await Assessment.countDocuments({ user: userId }),
      },
    });
  } catch (error) {
    console.error('Error fetching assessment history:', error);
    res.status(500).json({ error: error.message });
  }
};
