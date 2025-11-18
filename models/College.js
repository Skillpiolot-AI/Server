const mongoose = require('mongoose');


const CtpCtaSchema = new mongoose.Schema({
  courseId: Number,
  rmcUrl: {
    absoluteUrl: String,
    url: String,
    urlHost: String,
  },
}, { _id: false });

const ExamSchema = new mongoose.Schema({
  id: Number,
  name: String,
  url: String,
}, { _id: false });

const CollegeSchema = new mongoose.Schema({
  instituteId: Number,
  courseCount: Number,
  totalSeats: Number,
  acceptingExams: mongoose.Schema.Types.Mixed,
  minFees: Number,
  maxFees: Number,
  minMedianSalary: Number,
  maxMedianSalary: Number,
  averageCourseRating: Number,
  ratingCount: Number,
  ldaTimeStamp: Number,
  averagePlacementRating: Number,
  averageMoneyRating: Number,
  isClientInstitute: Number,
  minEligibilityX: Number,
  minEligibilityXII: Number,
  minEligibilityGrad: Number,
  minEligibilityPostGrad: Number,
  workExpMin: Number,
  workExpMax: Number,

  name: String,
  ownership: String,
  displayLocationString: String,
  instituteHeaderImageUrl: String,
  logoImageUrl: String,
  listingType: String,
  courseRating: String,
  rankingString: String,
  placementUrl: String,
  feesPageUrl: String,
  reviewUrl: String,
  scholarshipUrl: String,
  exams: [ExamSchema],
  ctpCtaData: CtpCtaSchema,
  intakeDates: [mongoose.Schema.Types.Mixed],
  otherFields: mongoose.Schema.Types.Mixed // fallback for any unknown fields
}, { strict: false }); // allow additional fields automatically

const College = mongoose.model('College', CollegeSchema);
module.exports = { College };
