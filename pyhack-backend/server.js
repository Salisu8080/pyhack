require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDatabase } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PyHack API is running' });
});

// API routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const challengeRoutes = require('./src/routes/challenges');
const leaderboardRoutes = require('./src/routes/leaderboard');
const achievementRoutes = require('./src/routes/achievements');

app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to PyHack API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      challenges: '/api/challenges',
      leaderboard: '/api/leaderboard',
      achievements: '/api/achievements',
      admin: '/api/admin'
    }
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal Server Error'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║      PyHack API Server Running         ║
╠════════════════════════════════════════╣
║  Port: ${PORT}                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}            ║
║  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}  ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
