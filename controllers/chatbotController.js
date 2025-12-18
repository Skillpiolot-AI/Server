const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use environment variable or fallback (get a new key from https://makersuite.google.com/app/apikey)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAf0qO4iqNNRlzRdY3zPxzRQRTxQvk6PTs';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Skill Pilot AI, an intelligent career guidance assistant for students and professionals.

Your expertise includes:
- Career path recommendations and planning
- Skill development advice and learning roadmaps
- Resume writing and optimization tips
- Interview preparation and mock interviews
- Industry insights and job market trends
- Course and certification recommendations
- Mentorship guidance

Guidelines:
- Be helpful, concise, and encouraging
- Always relate answers to career growth and professional development
- Provide actionable advice when possible
- If asked about specific roles, include skills needed, salary ranges, and growth potential
- For technical questions, be accurate but accessible
- Use bullet points and structure for clarity when appropriate
- Keep responses under 200 words unless more detail is requested

Remember: You are Skill Pilot AI. If anyone asks who you are, introduce yourself as Skill Pilot, the AI career mentor.`;

// Chat with Gemini API
exports.chat = async (req, res) => {
  try {
    const { messages, mode } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages are required',
      });
    }

    // Build mode-specific prompt
    let modePrompt = '';
    switch (mode) {
      case 'career':
        modePrompt = 'Focus on career guidance and job recommendations.';
        break;
      case 'resume':
        modePrompt = 'Focus on resume review and optimization tips.';
        break;
      case 'interview':
        modePrompt = 'Act as a mock interview coach. Ask follow-up questions.';
        break;
      case 'skills':
        modePrompt = 'Focus on skill development and learning paths.';
        break;
      default:
        modePrompt = '';
    }

    // Get the latest user message
    const latestMessage = messages[messages.length - 1]?.text || '';

    // Build conversation context
    const conversationHistory = messages.slice(0, -1).map(msg =>
      `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
    ).join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}

${modePrompt ? `Current Mode: ${modePrompt}` : ''}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ''}
User: ${latestMessage}

Please respond helpfully and concisely:`;

    // Use the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      res.json({
        success: true,
        message: text,
      });
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('Chatbot error:', error.message || error);

    // Check if it's a quota error
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return res.status(429).json({
        success: false,
        message: "I'm experiencing high demand right now. Please try again in a moment, or explore our other features like Career Matches and Mentors!",
      });
    }

    res.status(500).json({
      success: false,
      message: "I'm having trouble connecting right now. Please try again or use the quick action buttons!",
      error: error.message,
    });
  }
};

// Get quick suggestions based on context
exports.getSuggestions = async (req, res) => {
  try {
    const { context } = req.query;

    const suggestions = {
      default: [
        'What career suits my skills?',
        'How to improve my resume?',
        'Best courses for tech careers',
        'Interview tips for freshers',
      ],
      career: [
        'What skills are in demand?',
        'How to switch careers?',
        'Remote job opportunities',
        'Salary negotiation tips',
      ],
      resume: [
        'Review my resume format',
        'ATS-friendly resume tips',
        'How to highlight achievements?',
        'Best resume for freshers',
      ],
      interview: [
        "Tell me about yourself",
        'Strengths and weaknesses',
        'Why should we hire you?',
        'Behavioral interview tips',
      ],
      skills: [
        'In-demand tech skills 2024',
        'Free learning resources',
        'How to learn programming?',
        'Soft skills for success',
      ],
    };

    res.json({
      success: true,
      suggestions: suggestions[context] || suggestions.default,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
    });
  }
};
