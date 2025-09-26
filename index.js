const express = require('express');
const connectDB = require('./db');
const careerRoutes = require('./routes/careerRoutes');
const axios = require("axios");
const authRoutes=require("./routes/authRoutes")
const Title=require("./routes/Jobtitle")
const applicationRoutes = require('./routes/applicationRoutes');
const videoRoutes = require('./routes/videoRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const strengthRoutes = require('./routes/strengthRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const collegesRoutes = require('./routes/collegesRoutes');
const recommendationRoutes = require('./routes/Recommendation');
const workshopRoutes = require('./routes/workshopRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const communityRoutes = require('./routes/communityRoutes');
const profileRoutes = require('./routes/profileRoutes'); 
const path = require('path');
const fs = require('fs');

require("dotenv").config();

const cors = require('cors'); // Import cors
const interestRoutes = require('./routes/interestRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' }));


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log(GEMINI_API_KEY)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/careers', careerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/job',Title)
app.use('/api/job', collegesRoutes);
app.use('/api', applicationRoutes);
app.use('/api/job', interestRoutes);
app.use('/api', mentorRoutes);
app.use('/api', recommendationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/job', strengthRoutes);
app.use('/api/job', skillsRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api', resourceRoutes);
app.use('/api/profile', profileRoutes); 
app.use('/api', communityRoutes);


app.post("/api/gemini-suggestion", async (req, res) => {
  const { quizData, validJobTitles = [] } = req.body;

  if (!Array.isArray(validJobTitles) || validJobTitles.length === 0) {
    return res.status(400).json({ error: "Invalid or missing validJobTitles in request body" });
  }

  const prompt = `Based on the following quiz responses, suggest a suitable career path from the following list of job titles: ${validJobTitles.join(", ")}

  Quiz responses:
  ${JSON.stringify(quizData, null, 2)}
  
  Analyze the user's answers carefully and suggest a career path that best matches their interests and skills as indicated by their choices. You must only choose from the provided list of job titles.
  
  Format the output in a JSON object following this structure:
  {
    "career": "<predicted career from the provided list>",
    "description": "<brief description of why this career path suits the person based on their specific answers>"
  }
  Make sure the output is relevant to the given profile and follows the format. Do not include any explanations or additional text. Only provide the formatted JSON output.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  try {
    console.log("Sending request with payload:", JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("API response:", JSON.stringify(response.data, null, 2));

    const content = response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content;
    
    if (content && content.parts && content.parts[0] && content.parts[0].text) {
      let suggestion;
      try {
        suggestion = JSON.parse(content.parts[0].text);
      } catch (parseError) {
        const jsonMatch = content.parts[0].text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to extract JSON from API response");
        }
      }

      if (validJobTitles.includes(suggestion.career)) {
        res.json(suggestion);
      } else {
        throw new Error("Invalid career suggestion");
      }
    } else {
      throw new Error("Content not found in API response");
    }
  } catch (error) {
    console.error("Error making API request:", error.message);
    res.status(500).json({ error: "Failed to get a valid career suggestion. Please try again." });
  }
});


app.get("/api/job-info/:jobTitle", (req, res) => {
  const { jobTitle } = req.params;
  const dataPath = path.join(__dirname, 'data.json');

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading data file:", err);
      return res.status(500).json({ error: "Failed to read job data" });
    }

    try {
      const jobData = JSON.parse(data);
      const job = jobData.find(j => j.jobTitle === jobTitle);

      if (job) {
        res.json(job);
      } else {
        res.status(404).json({ error: "Job not found" });
      }
    } catch (parseError) {
      console.error("Error parsing data file:", parseError);
      res.status(500).json({ error: "Failed to parse job data" });
    }
  });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
