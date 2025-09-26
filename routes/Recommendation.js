// // const express = require('express');
// // const router = express.Router();
// // const Recommendation = require('../models/Recommendation'); // You'll need to create this model

// // // Get all recommendations
// // router.post('/recommendation', async (req, res) => {
// //     try {
// //       const newRecommendation = new Recommendation(req.body);
// //       const savedRecommendation = await newRecommendation.save();
// //       res.json(savedRecommendation);
// //     } catch (error) {
// //       console.error('Error adding recommendation:', error);
// //       res.status(500).json({ message: 'Failed to add recommendation', error: error.message });
// //     }
// //   });

// // // Add new recommendation
// // router.post('/recommendations', async (req, res) => {
// //     try {
// //       console.log('Received recommendation data:', req.body);
// //       const newRecommendation = new Recommendation(req.body);
// //       const savedRecommendation = await newRecommendation.save();
// //       res.json(savedRecommendation);
// //     } catch (error) {
// //       console.error('Error adding recommendation:', error);
// //       res.status(500).json({ message: 'Failed to add recommendation', error: error.message });
// //     }
// //   });

// // // Update recommendation
// // router.put('/recommendations/:id', async (req, res) => {
// //   try {
// //     const updatedRecommendation = await Recommendation.findByIdAndUpdate(req.params.id, req.body, { new: true });
// //     res.json(updatedRecommendation);
// //   } catch (error) {
// //     res.status(500).json({ message: 'Failed to update recommendation' });
// //   }
// // });

// // // Delete recommendation
// // router.delete('/recommendations/:id', async (req, res) => {
// //   try {
// //     await Recommendation.findByIdAndDelete(req.params.id);
// //     res.json({ message: 'Recommendation deleted' });
// //   } catch (error) {
// //     res.status(500).json({ message: 'Failed to delete recommendation' });
// //   }
// // });

// // // Delete all recommendations
// // router.delete('/recommendations', async (req, res) => {
// //   try {
// //     await Recommendation.deleteMany({});
// //     res.json({ message: 'All recommendations deleted' });
// //   } catch (error) {
// //     res.status(500).json({ message: 'Failed to delete all recommendations' });
// //   }
// // });

// // module.exports = router;


// const express = require('express');
// const router = express.Router();
// const Recommendation = require('../models/Recommendation');

// // Get all recommendations
// router.get('/recommendations', async (req, res) => {
//   try {
//     const recommendations = await Recommendation.find();
//     res.json(recommendations);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch recommendations' });
//   }
// });

// // Get a single recommendation
// router.get('/recommendations/:id', async (req, res) => {
//   try {
//     const recommendation = await Recommendation.findById(req.params.id);
//     if (!recommendation) {
//       return res.status(404).json({ message: 'Recommendation not found' });
//     }
//     res.json(recommendation);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch recommendation' });
//   }
// });

// // Add new recommendation
// router.post('/recommendations', async (req, res) => {
//   try {
//     console.log('Received recommendation data:', req.body);
//     const newRecommendation = new Recommendation(req.body);
//     const savedRecommendation = await newRecommendation.save();
//     res.json(savedRecommendation);
//   } catch (error) {
//     console.error('Error adding recommendation:', error);
//     res.status(500).json({ message: 'Failed to add recommendation', error: error.message });
//   }
// });

// // Update recommendation
// router.put('/recommendations/:id', async (req, res) => {
//   try {
//     const updatedRecommendation = await Recommendation.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!updatedRecommendation) {
//       return res.status(404).json({ message: 'Recommendation not found' });
//     }
//     res.json(updatedRecommendation);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update recommendation' });
//   }
// });

// // Delete recommendation
// router.delete('/recommendations/:id', async (req, res) => {
//   try {
//     const deletedRecommendation = await Recommendation.findByIdAndDelete(req.params.id);
//     if (!deletedRecommendation) {
//       return res.status(404).json({ message: 'Recommendation not found' });
//     }
//     res.json({ message: 'Recommendation deleted' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete recommendation' });
//   }
// });

// // Delete all recommendations
// router.delete('/recommendations', async (req, res) => {
//   try {
//     await Recommendation.deleteMany({});
//     res.json({ message: 'All recommendations deleted' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete all recommendations' });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const Recommendation = require('../models/Recommendation');

// Get all recommendations (for admin purposes)
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await Recommendation.find();
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recommendations' });
  }
});
router.post('/recommendations', async (req, res) => {
    try {
      const userAnswers = req.body;
      console.log('Received user answers:', userAnswers);
  
      const query = {
        afterTenthStream: userAnswers.afterTenthStream
      };
  
      if (userAnswers.workEnvironment) {
        query.workEnvironment = userAnswers.workEnvironment;
      }
  
      // Only include interest and strength if they exist in the database
      const interestsInDb = await Recommendation.distinct('interest');
      const strengthsInDb = await Recommendation.distinct('strength');
  
      if (interestsInDb.includes(userAnswers.interest)) {
        query.interest = userAnswers.interest;
      }
      if (strengthsInDb.includes(userAnswers.strength)) {
        query.strength = userAnswers.strength;
      }
  
      console.log('Query:', query);
  
      const recommendations = await Recommendation.find(query);
      console.log('Found recommendations:', recommendations);
  
      if (recommendations.length === 0) {
        return res.status(404).json({ message: 'No recommendations found for the given criteria' });
      }
  
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch recommendations', error: error.message });
    }
  });
  
  // Get interests (for populating the form)
  router.get('/job/interests', async (req, res) => {
    try {
      const interests = await Recommendation.distinct('interest');
      res.json(interests.map(interest => ({ name: interest })));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch interests' });
    }
  });
  
  // Get strengths (for populating the form)
  router.get('/job/strengths', async (req, res) => {
    try {
      const strengths = await Recommendation.distinct('strength');
      res.json(strengths.map(strength => ({ name: strength })));
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch strengths' });
    }
  });
  
// Add new recommendation (for admin purposes)
router.post('/recommendation', async (req, res) => {
  try {
    const newRecommendation = new Recommendation(req.body);
    const savedRecommendation = await newRecommendation.save();
    res.json(savedRecommendation);
  } catch (error) {
    console.error('Error adding recommendation:', error);
    res.status(500).json({ message: 'Failed to add recommendation', error: error.message });
  }
});

// Update recommendation (for admin purposes)
router.put('/recommendations/:id', async (req, res) => {
  try {
    const updatedRecommendation = await Recommendation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRecommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    res.json(updatedRecommendation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update recommendation' });
  }
});

// Delete recommendation (for admin purposes)
router.delete('/recommendations/:id', async (req, res) => {
  try {
    const deletedRecommendation = await Recommendation.findByIdAndDelete(req.params.id);
    if (!deletedRecommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    res.json({ message: 'Recommendation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete recommendation' });
  }
});

// Get interests (for populating the form)
router.get('/job/interests', async (req, res) => {
  try {
    const interests = await Recommendation.distinct('interest');
    res.json(interests.map(interest => ({ name: interest })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch interests' });
  }
});

// Get strengths (for populating the form)
router.get('/job/strengths', async (req, res) => {
  try {
    const strengths = await Recommendation.distinct('strength');
    res.json(strengths.map(strength => ({ name: strength })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch strengths' });
  }
});

router.get('/recommendations/job-titles', async (req, res) => {
  try {
    console.log('Fetching job titles...');
    const jobTitles = await Recommendation.distinct('jobTitle');
    console.log('Retrieved job titles:', jobTitles);
    
    if (jobTitles.length === 0) {
      console.log('No job titles found in the database.');
    }
    
    res.json(jobTitles);
  } catch (error) {
    console.error('Error fetching job titles:', error);
    res.status(500).json({ message: 'Error fetching job titles', error: error.message });
  }
});

module.exports = router;