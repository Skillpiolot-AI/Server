const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  industry: String,
  category: String,
  jobTitle: String,
  averageSalary: String,
  description: String,
  skills: [String],
  companies: [String],
  education: [String],
  workEnvironment: String,
  jobOutlook: String,
  challenges: [String],
  rewards: [String],
  topColleges: [{
    name: String,
    fees: String,
    duration: String
  }],
  hiringTrends: [{
    year: Number,
    hires: Number
  }],
  salaryTrends: [{
    year: Number,
    salary: Number
  }]
});

module.exports = mongoose.model('Career', careerSchema);