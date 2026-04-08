const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Generic content generation for the frontend.
 * This acts as a secure proxy for Gemini API calls.
 */
exports.generateContent = async (req, res) => {
  try {
    const { contents, model: modelName = 'gemini-2.5-flash' } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({
        success: false,
        message: 'Contents array is required',
      });
    }

    // Initialize model
    const model = genAI.getGenerativeModel({ model: modelName });

    // Use the raw contents structure from the frontend
    // Frontend structure: { contents: [{ parts: [{ text: "..." }] }] }
    // We can pass this directly to model.generateContent
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      text: text,
      // Supporting frontend's expected data structure if needed
      candidates: [
        {
          content: {
            parts: [{ text: text }],
          },
        },
      ],
    });
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message,
    });
  }
};

/**
 * Dedicated endpoint for Career Prediction (used by Prediction.jsx).
 */
exports.generatePrediction = async (req, res) => {
  try {
    const { quizData, validJobTitles, language = 'en' } = req.body;

    if (!quizData) {
      return res.status(400).json({ success: false, message: 'Quiz data is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert career counselor. Based on the following quiz responses, suggest a suitable career path from the provided list.
    
    Quiz Responses:
    ${JSON.stringify(quizData, null, 2)}
    
    Valid Career Options (Choose the best match from this list ONLY):
    ${validJobTitles.join(', ')}
    
    Respond STRICTLY in JSON format with exactly these keys:
    {
      "career": "The selected career title from the list",
      "description": "A 3-sentence explanation of why this suits the user",
      "jobProfiles": ["Title 1", "Title 2", "Title 3"]
    }
    
    Language: ${language}. Do not include any markdown formatting or extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response
      .text()
      .trim()
      .replace(/```json|```/g, '');

    let prediction;
    try {
      prediction = JSON.parse(text);
      res.json(prediction);
    } catch (e) {
      console.error('Failed to parse AI JSON:', text);
      res.status(500).json({ success: false, message: 'AI returned invalid JSON' });
    }
  } catch (error) {
    console.error('Prediction Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate career prediction' });
  }
};
