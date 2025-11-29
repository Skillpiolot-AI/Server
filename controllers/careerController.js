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
              ...job
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
      .select('jobTitle averageSalary description skills companies education workEnvironment jobOutlook challenges rewards topColleges hiringTrends salaryTrends')
      .limit(10);

    console.log('Suggestions found:', suggestions.length);

    if (suggestions.length === 0) {
      delete query.category;
      const flexibleSuggestions = await Career.find(query)
        .select('jobTitle averageSalary description skills companies education workEnvironment jobOutlook challenges rewards topColleges hiringTrends salaryTrends')
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
      jobTitle: { $regex: new RegExp('^' + jobTitle + '$', 'i') }
    }).select('jobTitle averageSalary description skills companies education workEnvironment jobOutlook challenges rewards topColleges hiringTrends salaryTrends');

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
    const career = await Career.findOne({ jobTitle: { $regex: new RegExp('^' + jobTitle + '$', 'i') } });
    res.json({ exists: !!career });
  } catch (error) {
    console.error('Error checking job title:', error);
    res.status(500).json({ error: 'An error occurred while checking the job title' });
  }
};
