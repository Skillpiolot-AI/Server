
const Application = require('../models/Application');

exports.submitApplication = async (req, res) => {
    try {
      const { name, email, phone, jobTitle, companiesWorked, experience } = req.body;
  
      const newApplication = new Application({
        name,
        email,
        phone,
        jobTitle,
        companiesWorked,
        experience,
      });
  
      const savedApplication = await newApplication.save();
  
      res.status(201).json({
        message: 'Application submitted successfully',
        trackingId: savedApplication.trackingId,
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      res.status(500).json({ error: 'An error occurred while submitting the application' });
    }
  };
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find().sort({ submittedAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'An error occurred while fetching applications' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.status(200).json({
      message: 'Application status updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'An error occurred while updating application status' });
  }
};



exports.getApplicationByTrackingId = async (req, res) => {
    try {
      const { trackingId } = req.params;
      const application = await Application.findOne({ trackingId });
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      res.status(200).json({
        trackingId: application.trackingId,
        status: application.status,
        submittedAt: application.submittedAt,
      });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ error: 'An error occurred while fetching the application' });
    }
  };