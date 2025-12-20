// routes/logsRoutes.js - Live Server Logs WebSocket and REST API
const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');

// In-memory log storage (circular buffer - last 1000 logs)
const MAX_LOGS = 1000;
const logs = [];
const wsClients = new Set();

// Log levels with colors
const LOG_LEVELS = {
  INFO: { color: '#3B82F6', icon: 'ℹ️' },
  SUCCESS: { color: '#10B981', icon: '✅' },
  WARNING: { color: '#F59E0B', icon: '⚠️' },
  ERROR: { color: '#EF4444', icon: '❌' },
  DEBUG: { color: '#8B5CF6', icon: '🔍' },
  HTTP: { color: '#06B6D4', icon: '🌐' },
};

// Add a log entry
const addLog = (level, message, metadata = {}) => {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    metadata,
  };

  logs.push(logEntry);

  // Keep only last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  // Broadcast to all WebSocket clients
  broadcastLog(logEntry);

  return logEntry;
};

// Broadcast log to all connected WebSocket clients
const broadcastLog = logEntry => {
  const message = JSON.stringify({ type: 'log', data: logEntry });
  wsClients.forEach(client => {
    try {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    } catch (error) {
      console.error('Error broadcasting to client:', error);
    }
  });
};

// Intercept console methods to capture logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

console.log = (...args) => {
  originalConsoleLog.apply(console, args);
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  addLog('INFO', message);
};

console.error = (...args) => {
  originalConsoleError.apply(console, args);
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  addLog('ERROR', message);
};

console.warn = (...args) => {
  originalConsoleWarn.apply(console, args);
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  addLog('WARNING', message);
};

console.info = (...args) => {
  originalConsoleInfo.apply(console, args);
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  addLog('INFO', message);
};

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Get recent logs (Admin only)
router.get('/recent', verifyToken, isAdmin, (req, res) => {
  const { limit = 100, level, search } = req.query;

  let filteredLogs = [...logs];

  // Filter by level
  if (level && level !== 'ALL') {
    filteredLogs = filteredLogs.filter(log => log.level === level.toUpperCase());
  }

  // Filter by search term
  if (search) {
    const searchLower = search.toLowerCase();
    filteredLogs = filteredLogs.filter(log => log.message.toLowerCase().includes(searchLower));
  }

  // Return latest logs first
  const result = filteredLogs.slice(-parseInt(limit)).reverse();

  res.json({
    success: true,
    count: result.length,
    total: logs.length,
    logs: result,
    levels: Object.keys(LOG_LEVELS),
  });
});

// Clear logs (Admin only)
router.delete('/clear', verifyToken, isAdmin, (req, res) => {
  logs.length = 0;

  // Notify clients
  wsClients.forEach(client => {
    try {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'clear' }));
      }
    } catch (error) {
      console.error('Error notifying client:', error);
    }
  });

  res.json({ success: true, message: 'Logs cleared' });
});

// Get log statistics
router.get('/stats', verifyToken, isAdmin, (req, res) => {
  const stats = {
    total: logs.length,
    byLevel: {},
    connectedClients: wsClients.size,
    maxLogs: MAX_LOGS,
  };

  Object.keys(LOG_LEVELS).forEach(level => {
    stats.byLevel[level] = logs.filter(log => log.level === level).length;
  });

  res.json({ success: true, stats });
});

// Add manual log entry (for testing)
router.post('/add', verifyToken, isAdmin, (req, res) => {
  const { level = 'INFO', message, metadata } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const logEntry = addLog(level, message, metadata);
  res.json({ success: true, log: logEntry });
});

// Export for WebSocket setup
module.exports = {
  router,
  wsClients,
  addLog,
  logs,
  LOG_LEVELS,
};
