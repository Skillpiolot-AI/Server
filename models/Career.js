const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  career_type: { type: String, enum: ['Professional', 'Vocational'] },
  career_cluster_name: { type: String, required: true },
  streams: [{ type: Number }],
  minimum_expense: { type: Number },
  salary_range: {
    '0_2': {
      minimum_years: Number,
      maximum_years: Number,
      salary_from: Number,
      salary_to: Number
    }
  },
  future_growth: {
    very_long_term: {
      text: String,
      value: Number
    }
  },
  icon: String,
  holland_codes: [{ type: String, enum: ['R', 'I', 'A', 'S', 'E', 'C'] }],
  description: String,
  primary_holland_code: String
}, { timestamps: true });

careerSchema.index({ holland_codes: 1 });
careerSchema.index({ career_cluster_name: 1 });
careerSchema.index({ primary_holland_code: 1 });
careerSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('CareerResult', careerSchema);
