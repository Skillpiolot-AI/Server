const express = require('express');
const connectDB = require('./db');
const cors = require('cors');

// Import routes
const careerRoutes = require('./routes/careerRoutes');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const videoRoutes = require('./routes/videoRoutes');
const strengthRoutes = require('./routes/strengthRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const collegesRoutes = require('./routes/collegesRoutes');
const recommendationRoutes = require('./routes/Recommendation');
const workshopRoutes = require('./routes/workshopRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const communityRoutes = require('./routes/communityRoutes');
const profileRoutes = require('./routes/profileRoutes');
const interestRoutes = require('./routes/interestRoutes');
const Title = require('./routes/Jobtitle');

const app = express();

// Connect to database only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;