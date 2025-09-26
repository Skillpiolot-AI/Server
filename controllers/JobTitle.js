const JobTitle = require('../models/JobTitle');
const Company = require('../models/Company');

exports.addJobTitles = async (req, res) => {
  try {
    const { titles } = req.body;
    const newTitles = await JobTitle.create(titles.map(title => ({ title })));
    res.status(201).json(newTitles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getJobTitles = async (req, res) => {
  try {
    const jobTitles = await JobTitle.find();
    res.status(200).json(jobTitles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateJobTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const updatedTitle = await JobTitle.findByIdAndUpdate(id, { title }, { new: true });
    res.status(200).json(updatedTitle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteJobTitle = async (req, res) => {
  try {
    const { id } = req.params;
    await JobTitle.findByIdAndDelete(id);
    res.status(200).json({ message: 'Job title deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addCompanies = async (req, res) => {
  try {
    const { companies } = req.body;
    const newCompanies = await Company.create(companies.map(name => ({ name })));
    res.status(201).json(newCompanies);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedCompany = await Company.findByIdAndUpdate(id, { name }, { new: true });
    res.status(200).json(updatedCompany);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};