const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/auth');

// Public routes (optional auth to show current user rank)
router.get('/global', optionalAuth, leaderboardController.getGlobalLeaderboard);
router.get('/weekly', optionalAuth, leaderboardController.getWeeklyLeaderboard);

module.exports = router;
