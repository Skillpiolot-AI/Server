

const Resource = require('../models/Resource');

exports.addResource = async (req, res) => {
  try {
    const { imageLink, bookTitle, publishedDate, publisherName, pdfLink, description, manufactureCompanyName } = req.body;

    const resource = new Resource({
      imageLink,
      bookTitle,
      publishedDate,
      publisherName,
      pdfLink,
      description,
      manufactureCompanyName,
    });

    await resource.save();
    res.status(201).json({ message: 'Resource added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding resource', error: error.message });
  }
};

exports.getResources = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Resource.countDocuments();
    const books = await Resource.find().skip(skip).limit(limit);

    res.json({
      books,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources', error: error.message });
  }
};

exports.downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.redirect(resource.pdfLink); // Redirect to the PDF link instead of downloading
  } catch (error) {
    res.status(500).json({ message: 'Error accessing resource', error: error.message });
  }
};
