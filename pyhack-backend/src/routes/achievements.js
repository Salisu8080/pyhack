const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public/optional auth routes
router.get('/', optionalAuth, achievementController.getAllAchievements);

// Protected routes
router.get('/user', authenticateToken, achievementController.getUserAchievements);

module.exports = router;
