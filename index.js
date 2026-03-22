const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const careerRoutes = require('./routes/careerRoutes');
const authRoutes = require('./routes/authRoutes');
const Title = require('./routes/Jobtitle');
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
const analyticsRoutes = require('./routes/analyticsRoutes');
const updateRoutes = require('./routes/updateRoutes');
const universityRoutes = require('./routes/universityRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const userDataRoutes = require('./routes/userDataRoutes');
const interestRoutes = require('./routes/interestRoutes');
const bulkMentorRoutes = require('./routes/bulkMentorRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const logsModule = require('./routes/logsRoutes');
const mentorServicesRoutes = require('./routes/mentorServicesRoutes');
const priorityDMRoutes = require('./routes/priorityDMRoutes');
const groupRoutes = require('./routes/groupRoutes');

// Import scheduled jobs
const tempPasswordReminder = require('./jobs/tempPasswordReminder');
const bookingReminders = require('./jobs/bookingReminders');
const { startDMCron } = require('./cron/dmCron');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== PERFORMANCE OPTIMIZATIONS ====================

// 1. Enable GZIP compression
app.use(compression());

// 2. Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Adjust based on your needs
    crossOriginEmbedderPolicy: false,
  })
);

// 3. Optimized CORS configuration
// const corsOptions = {
//   origin: process.env.FRONTEND_URL || '*',
//   credentials: true,
//   optionsSuccessStatus: 200,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// };
app.use(cors());

// 4. Increase JSON payload limit with streaming
app.use(
  express.json({
    limit: '10mb',
    strict: true,
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// 5. Static file caching
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true,
  })
);

// ==================== REQUEST LOGGING (DEVELOPMENT) ====================
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
app.use('/api/careers', careerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/job', Title);
app.use('/api/job', collegesRoutes);
app.use('/api/applications', applicationRoutes);
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
app.use('/api/analytics', analyticsRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/questions', require('./routes/questions'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/colleges', collegeRoutes);
app.use('/api/user-data', userDataRoutes);
app.use('/api', bulkMentorRoutes);

// Add this with your other routes
app.use('/api/chatbot', chatbotRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Mentor services, coupons, custom sections & public search (Topmate-style)
app.use('/api', mentorServicesRoutes);

// Priority DM inbox
app.use('/api', priorityDMRoutes);

// Group & Community routes
app.use('/api/groups', groupRoutes);

// Live server logs routes
app.use('/api/logs', logsModule.router);

// Announcement routes
const announcementRoutes = require('./routes/announcementRoutes');
app.use('/api/announcements', announcementRoutes);

// Track application by tracking ID (public endpoint)
const Application = require('./models/Application');
app.get('/api/track/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    const application = await Application.findOne({
      trackingId: trackingId.toUpperCase(),
    }).select(
      'name email trackingId status submittedAt updatedAt rejectionReason additionalInfoRequest'
    );

    if (!application) {
      return res
        .status(404)
        .json({ error: 'Application not found. Please check your tracking ID.' });
    }

    res.json({
      trackingId: application.trackingId,
      name: application.name,
      status: application.status,
      submittedAt: application.submittedAt,
      updatedAt: application.updatedAt,
      rejectionReason: application.rejectionReason,
      additionalInfoRequest: application.additionalInfoRequest,
    });
  } catch (error) {
    console.error('Error tracking application:', error);
    res.status(500).json({ error: 'Failed to track application' });
  }
});

// ==================== CACHED JOB INFO ENDPOINT ====================
let jobDataCache = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.get('/api/job-info/:jobTitle', (req, res) => {
  const { jobTitle } = req.params;
  const dataPath = path.join(__dirname, 'data.json');

  // Check cache first
  const now = Date.now();
  if (jobDataCache && cacheTime && now - cacheTime < CACHE_DURATION) {
    const job = jobDataCache.find(j => j.jobTitle === jobTitle);
    if (job) {
      return res.json(job);
    } else {
      return res.status(404).json({ error: 'Job not found' });
    }
  }

  // Read and cache data
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).json({ error: 'Failed to read job data' });
    }

    try {
      jobDataCache = JSON.parse(data);
      cacheTime = Date.now();

      const job = jobDataCache.find(j => j.jobTitle === jobTitle);
      if (job) {
        res.json(job);
      } else {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (parseError) {
      console.error('Error parsing data file:', parseError);
      res.status(500).json({ error: 'Failed to parse job data' });
    }
  });
});

// ==================== ADMIN ROUTES ====================
app.post('/api/admin/trigger-password-reminders', async (req, res) => {
  try {
    console.log('🔧 Manual trigger requested for password reminders');
    const result = await tempPasswordReminder.runNow();
    res.json({
      success: true,
      message: 'Temporary password reminders sent',
      result,
    });
  } catch (error) {
    console.error('Error triggering password reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message,
    });
  }
});

app.get('/api/admin/scheduler-status', (req, res) => {
  res.json({
    success: true,
    schedulers: {
      tempPasswordReminder: {
        name: 'Temporary Password Reminder',
        schedule: 'Daily at 9:00 AM',
        status: 'active',
        description: 'Sends reminders to users with temporary passwords every 2 days',
      },
    },
    serverTime: new Date().toISOString(),
    timezone: process.env.TZ || 'Asia/Kolkata',
  });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== START SERVER ====================
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📅 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log('⚡ Compression: Enabled');
      console.log('🔒 Security: Enabled');

      // Initialize scheduled jobs
      console.log('\n⏰ Initializing scheduled jobs...');
      tempPasswordReminder.scheduleReminders();
      bookingReminders.scheduleReminders();
      startDMCron();

      console.log('\n✅ Server initialization complete!\n');
    });

    // ==================== WEBSOCKET FOR LIVE LOGS ====================
    const WebSocket = require('ws');
    const wss = new WebSocket.Server({ server, path: '/ws/logs' });

    wss.on('connection', ws => {
      console.log('📊 New WebSocket client connected for live logs');
      logsModule.wsClients.add(ws);

      // Send recent logs on connect
      const recentLogs = logsModule.logs.slice(-50).reverse();
      ws.send(JSON.stringify({ type: 'init', logs: recentLogs }));

      ws.on('close', () => {
        logsModule.wsClients.delete(ws);
        console.log('📊 WebSocket client disconnected');
      });

      ws.on('error', error => {
        console.error('WebSocket error:', error);
        logsModule.wsClients.delete(ws);
      });
    });

    console.log('📊 WebSocket server for logs enabled at /ws/logs');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if this is the main module (being run directly, not imported for tests)
if (require.main === module) {
  startServer();
}

// Export app for use in tests
module.exports = app;
