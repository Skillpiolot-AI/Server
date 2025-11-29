const Question = require('../models/Question');

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .sort({ order: 1 })
      .select('-createdAt -updatedAt -__v');

    res.json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
