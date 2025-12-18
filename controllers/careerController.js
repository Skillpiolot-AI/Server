const Career = require('../models/careerModel');

exports.createCareer = async (req, res) => {
  try {
    const careerData = req.body;
    const newCareer = new Career(careerData);
    const savedCareer = await newCareer.save();
    res.status(201).json(savedCareer);
  } catch (error) {
    console.error('Error creating career:', error);
    res.status(500).json({ error: 'An error occurred while creating the career' });
  }
};

exports.updateCareer = async (req, res) => {
  try {
    const { id } = req.params;
    const careerData = req.body;
    const updatedCareer = await Career.findByIdAndUpdate(id, careerData, { new: true });
    if (!updatedCareer) {
      return res.status(404).json({ error: 'Career not found' });
    }
    res.status(200).json(updatedCareer);
  } catch (error) {
    console.error('Error updating career:', error);
    res.status(500).json({ error: 'An error occurred while updating the career' });
  }
};

exports.deleteCareer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCareer = await Career.findByIdAndDelete(id);
    if (!deletedCareer) {
      return res.status(404).json({ error: 'Career not found' });
    }
    res.status(200).json({ message: 'Career deleted successfully' });
  } catch (error) {
    console.error('Error deleting career:', error);
    res.status(500).json({ error: 'An error occurred while deleting the career' });
  }
};

exports.getCareer = async (req, res) => {
  try {
    const { id } = req.params;
    const career = await Career.findById(id);
    if (!career) {
      return res.status(404).json({ error: 'Career not found' });
    }
    res.status(200).json(career);
  } catch (error) {
    console.error('Error fetching career:', error);
    res.status(500).json({ error: 'An error occurred while fetching the career' });
  }
};

exports.getAllCareers = async (req, res) => {
  try {
    const careers = await Career.find();
    res.status(200).json(careers);
  } catch (error) {
    console.error('Error fetching all careers:', error);
    res.status(500).json({ error: 'An error occurred while fetching all careers' });
  }
};

exports.insertCareerData = async (req, res) => {
  try {
    const careerData = req.body;

    for (const dataObject of careerData) {
      for (const industry in dataObject) {
        for (const category in dataObject[industry]) {
          for (const job of dataObject[industry][category]) {
            const newCareer = new Career({
              industry,
              category,
              ...job,
            });
            await newCareer.save();
          }
        }
      }
    }

    res.status(200).json({ message: 'Career data inserted successfully' });
  } catch (error) {
    console.error('Error inserting career data:', error);
    res.status(500).json({ error: 'An error occurred while inserting career data' });
  }
};

exports.getInterestsAndStrengths = async (req, res) => {
  try {
    const interests = await Career.distinct('industry');
    const strengths = await Career.distinct('category');
    res.status(200).json({ interests, strengths });
  } catch (error) {
    console.error('Error fetching interests and strengths:', error);
    res.status(500).json({ error: 'An error occurred while fetching interests and strengths' });
  }
};

exports.getCareerSuggestions = async (req, res) => {
  try {
    const { interest, strength } = req.body;
    console.log('Received request for:', { interest, strength });

    let query = {};
    if (interest) query.industry = interest;
    if (strength) query.category = strength;

    console.log('Query:', query);

    const suggestions = await Career.find(query)
      .select(
        'jobTitle averageSalary description skills companies education workEnvironment jobOutlook challenges rewards topColleges hiringTrends salaryTrends'
      )
      .limit(10);

    console.log('Suggestions found:', suggestions.length);

    if (suggestions.length === 0) {
      delete query.category;
      const flexibleSuggestions = await Career.find(query)
        .select(
          'jobTitle averageSalary description skills companies education workEnvironment jobOutlook challenges rewards topColleges hiringTrends salaryTrends'
        )
        .limit(10);

      console.log('Flexible suggestions found:', flexibleSuggestions.length);

      res.status(200).json(flexibleSuggestions);
    } else {
      res.status(200).json(suggestions);
    }
  } catch (error) {
    console.error('Error fetching career suggestions:', error);
    res.status(500).json({ error: 'An error occurred while fetching career suggestions' });
  }
};

exports.getAllJobTitles = async (req, res) => {
  try {
    const jobTitles = await Career.distinct('jobTitle');
    console.log('Retrieved job titles:', jobTitles);
    res.status(200).json(jobTitles);
  } catch (error) {
    console.error('Error fetching job titles:', error);
    res.status(500).json({ error: 'An error occurred while fetching job titles' });
  }
};

exports.getCareerSuggestion = async (req, res) => {
  try {
    const { jobTitle } = req.query;
    console.log('Received request for job title:', jobTitle);

    if (!jobTitle) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const career = await Career.findOne({
      jobTitle: { $regex: new RegExp('^' + jobTitle + '$', 'i') },
    }).select(
      'jobTitle averageSalary description skills companies education workEnvironment jobOutlook challenges rewards topColleges hiringTrends salaryTrends'
    );

    if (!career) {
      console.log('Career not found for job title:', jobTitle);
      return res.status(404).json({ error: 'Career not found' });
    }

    console.log('Found career:', career);
    res.status(200).json(career);
  } catch (error) {
    console.error('Error fetching career suggestion:', error);
    res.status(500).json({ error: 'An error occurred while fetching career suggestions' });
  }
};

exports.checkJobTitleExists = async (req, res) => {
  try {
    const { jobTitle } = req.query;
    console.log(jobTitle);
    const career = await Career.findOne({
      jobTitle: { $regex: new RegExp('^' + jobTitle + '$', 'i') },
    });
    res.json({ exists: !!career });
  } catch (error) {
    console.error('Error checking job title:', error);
    res.status(500).json({ error: 'An error occurred while checking the job title' });
  }
};

// Career recommendations based on Holland Code (uses CareerResult model)
const CareerResult = require('../models/Career');

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

exports.getRecommendations = async (req, res) => {
  try {
    const { hollandCode, limit = 15 } = req.query;

    if (!hollandCode) {
      return res.status(400).json({
        success: false,
        message: 'Holland code is required'
      });
    }

    const allCareers = await CareerResult.find().select(
      'id name career_cluster_name career_type salary_range future_growth holland_codes minimum_expense icon'
    );

    const careersWithScores = allCareers
      .map(career => {
        const matchScore = calculateMatchScore(hollandCode, career.holland_codes);
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
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      count: careersWithScores.length,
      data: careersWithScores,
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
};

exports.getAllClusters = async (req, res) => {
  try {
    const clusters = await CareerResult.distinct('career_cluster_name');
    res.json({
      success: true,
      data: clusters,
    });
  } catch (error) {
    console.error('Error fetching clusters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clusters'
    });
  }
};

