// server/controllers/collegeController.js

const { College } = require('../models/College');

// Get all colleges with filters
exports.getFilteredColleges = async (req, res) => {
  try {
    const {
      search,
      ownership,
      listingType,
      location,
      minFees,
      maxFees,
      minSalary,
      maxSalary,
      minRating,
      exams,
      minEligibilityX,
      minEligibilityXII,
      workExpMin,
      workExpMax,
      page = 1,
      limit = 12
    } = req.query;

    // Build query object
    let query = {};

    // Search by college name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Ownership filter (multi-select)
    if (ownership) {
      const ownershipArray = ownership.split(',').map(o => o.trim());
      query.ownership = { $in: ownershipArray };
    }

    // Listing Type filter (multi-select)
    if (listingType) {
      const listingTypeArray = listingType.split(',').map(l => l.trim());
      query.listingType = { $in: listingTypeArray };
    }

    // Location filter
    if (location) {
      query.displayLocationString = { $regex: location, $options: 'i' };
    }

    // Fees range filter
    if (minFees || maxFees) {
      query.$and = query.$and || [];
      if (minFees) {
        query.$and.push({ minFees: { $gte: parseFloat(minFees) } });
      }
      if (maxFees) {
        query.$and.push({ maxFees: { $lte: parseFloat(maxFees) } });
      }
    }

    // Salary range filter
    if (minSalary || maxSalary) {
      query.$and = query.$and || [];
      if (minSalary) {
        query.$and.push({ minMedianSalary: { $gte: parseFloat(minSalary) } });
      }
      if (maxSalary) {
        query.$and.push({ maxMedianSalary: { $lte: parseFloat(maxSalary) } });
      }
    }

    // Rating filter
    if (minRating) {
      query.averageCourseRating = { $gte: parseFloat(minRating) };
    }

    // Exams accepted filter
    if (exams) {
      const examArray = exams.split(',').map(e => e.trim());
      query['exams.name'] = { $in: examArray };
    }

    // Eligibility filters
    if (minEligibilityX) {
      query.minEligibilityX = { $lte: parseFloat(minEligibilityX) };
    }
    if (minEligibilityXII) {
      query.minEligibilityXII = { $lte: parseFloat(minEligibilityXII) };
    }

    // Work experience filter
    if (workExpMin !== undefined || workExpMax !== undefined) {
      query.$and = query.$and || [];
      if (workExpMin !== undefined) {
        query.$and.push({ workExpMin: { $lte: parseFloat(workExpMin) } });
      }
      if (workExpMax !== undefined) {
        query.$and.push({ workExpMax: { $gte: parseFloat(workExpMax) } });
      }
    }

    // Remove empty $and if exists
    if (query.$and && query.$and.length === 0) {
      delete query.$and;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const colleges = await College.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ averageCourseRating: -1 }); // Sort by rating

    // Get total count for pagination
    const total = await College.countDocuments(query);

    res.status(200).json({
      success: true,
      data: colleges,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error filtering colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Error filtering colleges',
      error: error.message
    });
  }
};

// Get filter options (for dropdowns)
exports.getFilterOptions = async (req, res) => {
  try {
    // Get unique ownership types
    const ownershipTypes = await College.distinct('ownership');
    
    // Get unique listing types
    const listingTypes = await College.distinct('listingType');
    
    // Get unique locations
    const locations = await College.distinct('displayLocationString');
    
    // Get all unique exams
    const examsData = await College.aggregate([
      { $unwind: '$exams' },
      { $group: { _id: '$exams.name' } },
      { $sort: { _id: 1 } }
    ]);
    const exams = examsData.map(e => e._id).filter(Boolean);

    // Get fee range
    const feeRange = await College.aggregate([
      {
        $group: {
          _id: null,
          minFee: { $min: '$minFees' },
          maxFee: { $max: '$maxFees' }
        }
      }
    ]);

    // Get salary range
    const salaryRange = await College.aggregate([
      {
        $group: {
          _id: null,
          minSalary: { $min: '$minMedianSalary' },
          maxSalary: { $max: '$maxMedianSalary' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ownership: ownershipTypes.filter(Boolean),
        listingType: listingTypes.filter(Boolean),
        locations: locations.filter(Boolean).sort(),
        exams: exams,
        feeRange: feeRange[0] || { minFee: 0, maxFee: 1000000 },
        salaryRange: salaryRange[0] || { minSalary: 0, maxSalary: 2000000 }
      }
    });

  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting filter options',
      error: error.message
    });
  }
};

// Get college by ID
exports.getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.status(200).json({
      success: true,
      data: college
    });

  } catch (error) {
    console.error('Error getting college:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting college',
      error: error.message
    });
  }
};