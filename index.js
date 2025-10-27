// const express = require('express');
// const connectDB = require('./db');
// const careerRoutes = require('./routes/careerRoutes');
// const axios = require("axios");
// const authRoutes=require("./routes/authRoutes")
// const Title=require("./routes/Jobtitle")
// const applicationRoutes = require('./routes/applicationRoutes');
// const videoRoutes = require('./routes/videoRoutes');
// const mentorRoutes = require('./routes/mentorRoutes');
// const strengthRoutes = require('./routes/strengthRoutes');
// const skillsRoutes = require('./routes/skillsRoutes');
// const collegesRoutes = require('./routes/collegesRoutes');
// const recommendationRoutes = require('./routes/Recommendation');
// const workshopRoutes = require('./routes/workshopRoutes');
// const resourceRoutes = require('./routes/resourceRoutes');
// const communityRoutes = require('./routes/communityRoutes');
// const profileRoutes = require('./routes/profileRoutes'); 
// const analyticsRoutes = require("./routes/analyticsRoutes");
// const updateRoutes = require('./routes/updateRoutes'); 
// const universityRoutes = require('./routes/universityRoutes'); 
// const collegeRoutes = require('./routes/collegeRoutes');

// const path = require('path');
// const fs = require('fs');

// require("dotenv").config();

// const cors = require('cors'); 
// const interestRoutes = require('./routes/interestRoutes');

// const app = express();
// const PORT = process.env.PORT || 3001;

// connectDB();

// app.use(cors()); 
// app.use(express.json({ limit: '10mb' }));



// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// app.use('/api/careers', careerRoutes);
// app.use('/api/auth', authRoutes);
// app.use('/api/job',Title)
// app.use('/api/job', collegesRoutes);
// app.use('/api', applicationRoutes);
// app.use('/api/job', interestRoutes);
// app.use('/api', mentorRoutes);
// app.use('/api', recommendationRoutes);
// app.use('/api/videos', videoRoutes);
// app.use('/api/job', strengthRoutes);
// app.use('/api/job', skillsRoutes);
// app.use('/api/workshops', workshopRoutes);
// app.use('/api', resourceRoutes);
// app.use('/api/profile', profileRoutes); 
// app.use('/api', communityRoutes);
// app.use("/api/analytics", analyticsRoutes);
// app.use('/api/updates', updateRoutes); // New updates routes
// app.use('/api/university', universityRoutes);
// app.use('/api/questions', require('./routes/questions'));
// app.use('/api/assessments', require('./routes/assessments'));
// app.use('/api/careers', require('./routes/careers'));

// app.use('/api/colleges', collegeRoutes);



// app.get("/api/job-info/:jobTitle", (req, res) => {
//   const { jobTitle } = req.params;
//   const dataPath = path.join(__dirname, 'data.json');

//   fs.readFile(dataPath, 'utf8', (err, data) => {
//     if (err) {
//       console.error("Error reading data file:", err);
//       return res.status(500).json({ error: "Failed to read job data" });
//     }

//     try {
//       const jobData = JSON.parse(data);
//       const job = jobData.find(j => j.jobTitle === jobTitle);

//       if (job) {
//         res.json(job);
//       } else {
//         res.status(404).json({ error: "Job not found" });
//       }
//     } catch (parseError) {
//       console.error("Error parsing data file:", parseError);
//       res.status(500).json({ error: "Failed to parse job data" });
//     }
//   });
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({ 
//     status: 'healthy', 
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   })
// })

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// index.js - Enhanced with scheduled jobs
const express = require('express');
const connectDB = require('./db');
const cors = require('cors'); 
const path = require('path');
const fs = require('fs');
require("dotenv").config();

// Import routes
const careerRoutes = require('./routes/careerRoutes');
const authRoutes = require("./routes/authRoutes");
const Title = require("./routes/Jobtitle");
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
const analyticsRoutes = require("./routes/analyticsRoutes");
const updateRoutes = require('./routes/updateRoutes'); 
const universityRoutes = require('./routes/universityRoutes'); 
const collegeRoutes = require('./routes/collegeRoutes');
const userDataRoutes = require('./routes/userDataRoutes');
const interestRoutes = require('./routes/interestRoutes');

// Import scheduled jobs
const tempPasswordReminder = require('./jobs/tempPasswordReminder');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Middleware
app.use(cors()); 
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/careers', careerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/job', Title);
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
app.use("/api/analytics", analyticsRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/questions', require('./routes/questions'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/colleges', collegeRoutes);
app.use('/api/user-data', userDataRoutes);

// Job info endpoint
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==================== ADMIN ROUTES FOR SCHEDULED JOBS ====================

// Manual trigger for temporary password reminders (Admin only)
app.post('/api/admin/trigger-password-reminders', async (req, res) => {
  try {
    // In production, add authentication middleware here
    // const token = req.headers.authorization;
    // Verify admin token...
    
    console.log('🔧 Manual trigger requested for password reminders');
    const result = await tempPasswordReminder.runNow();
    
    res.json({
      success: true,
      message: 'Temporary password reminders sent',
      result
    });
  } catch (error) {
    console.error('Error triggering password reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message
    });
  }
});

// Get scheduler status
app.get('/api/admin/scheduler-status', (req, res) => {
  res.json({
    success: true,
    schedulers: {
      tempPasswordReminder: {
        name: 'Temporary Password Reminder',
        schedule: 'Daily at 9:00 AM',
        status: 'active',
        description: 'Sends reminders to users with temporary passwords every 2 days'
      }
    },
    serverTime: new Date().toISOString(),
    timezone: process.env.TZ || 'Asia/Kolkata'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📅 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL }`);
  
  // Initialize scheduled jobs
  console.log('\n⏰ Initializing scheduled jobs...');
  tempPasswordReminder.scheduleReminders();
  
  console.log('\n✅ Server initialization complete!\n');
});