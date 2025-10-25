const Career = require('../models/Career');

// Cluster to Holland Code mapping
const CLUSTER_HOLLAND_MAPPING = {
  'Engineering & Technology': ['R', 'I', 'E'],
  'Engineering & Technical': ['R', 'I', 'C'],
  'Medical Sciences': ['I', 'S', 'R'],
  'Allied & Para Medical Sciences': ['I', 'S', 'C'],
  'Business Management': ['E', 'C', 'I'],
  'Finance & Banking': ['C', 'E', 'I'],
  'Banking, Financial Services & Insurance Operations': ['C', 'E', 'I'],
  'Agriculture & Food': ['R', 'I', 'E'],
  'Agricultural & Food Sciences': ['R', 'I', 'C'],
  'Performing Arts': ['A', 'S', 'E'],
  'Art & Design': ['A', 'I', 'E'],
  'Animation, Graphics & Design': ['A', 'I', 'R'],
  'Animation, Graphics & Visual Communication': ['A', 'I', 'C'],
  'Mass Communication': ['A', 'E', 'S'],
  'Journalism': ['A', 'I', 'S'],
  'Media & Entertainment': ['A', 'E', 'S'],
  'Electronics & Hardware': ['R', 'I', 'C'],
  'Information Technology & Computer Science': ['I', 'R', 'C'],
  'IT and IT Enabled Services': ['I', 'C', 'E'],
  'Hospitality & Tourism Services': ['E', 'S', 'C'],
  'Hospitality, Tourism & Transport Services': ['E', 'S', 'R'],
  'Defence, Security & Government Services': ['R', 'E', 'C'],
  'Government & Defence Services': ['R', 'E', 'C'],
  'Education & Teaching': ['S', 'I', 'C'],
  'Humanities, Liberal Arts & Social Sciences': ['S', 'A', 'I'],
  'Legal Services': ['I', 'E', 'C'],
  'Science & Mathematics': ['I', 'R', 'C'],
  'Architecture & Planning': ['A', 'R', 'I'],
  'Construction': ['R', 'E', 'C'],
  'Sports & Fitness': ['R', 'S', 'E'],
  'Fitness & Well-Being': ['S', 'R', 'E'],
  'Beauty & Wellness': ['A', 'S', 'E'],
  'Healthcare Support Services': ['S', 'C', 'R'],
  'Sales & Marketing': ['E', 'S', 'A'],
  'Sales & Marketing Operations': ['E', 'C', 'S'],
  'Business Operations & Entrepreneurship': ['E', 'I', 'C'],
  'Gems & Jewellery': ['A', 'R', 'E'],
  'Textile & Handloom': ['A', 'R', 'C'],
  'Apparel & Accessories': ['A', 'E', 'C']
};

// Calculate match score between user's Holland code and career
const calculateMatchScore = (userHollandCode, careerHollandCodes) => {
  if (!careerHollandCodes || careerHollandCodes.length === 0) return 0;
  
  const userCodes = userHollandCode.split('');
  let score = 0;
  
  userCodes.forEach((code, index) => {
    if (careerHollandCodes.includes(code)) {
      // Weight: first code = 50%, second = 30%, third = 20%
      const weight = index === 0 ? 0.5 : index === 1 ? 0.3 : 0.2;
      score += weight * 100;
    }
  });
  
  return Math.round(score);
};

exports.getCareerRecommendations = async (req, res) => {
  try {
    const { hollandCode, limit = 15 } = req.query;

    if (!hollandCode) {
      return res.status(400).json({ error: 'Holland code is required' });
    }

    // Get all careers and calculate match scores
    const allCareers = await Career.find()
      .select('id name career_cluster_name career_type salary_range future_growth holland_codes minimum_expense icon');

    const careersWithScores = allCareers
      .map(career => ({
        ...career.toObject(),
        matchScore: calculateMatchScore(hollandCode, career.holland_codes)
      }))
      .filter(career => career.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    res.json({
      success: true,
      count: careersWithScores.length,
      data: careersWithScores
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllClusters = async (req, res) => {
  try {
    const clusters = await Career.distinct('career_cluster_name');
    
    const clusterStats = await Promise.all(
      clusters.map(async (cluster) => {
        const count = await Career.countDocuments({ career_cluster_name: cluster });
        return {
          name: cluster,
          count,
          holland_codes: CLUSTER_HOLLAND_MAPPING[cluster] || []
        };
      })
    );

    res.json({
      success: true,
      count: clusters.length,
      data: clusterStats.sort((a, b) => b.count - a.count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCareersByCluster = async (req, res) => {
  try {
    const { cluster } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const careers = await Career.find({ career_cluster_name: cluster })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const count = await Career.countDocuments({ career_cluster_name: cluster });

    res.json({
      success: true,
      data: careers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};