const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public/optional auth routes
router.get('/', optionalAuth, challengeController.getAllChallenges);
router.get('/:id', optionalAuth, challengeController.getChallengeById);

// Protected routes (require authentication)
router.post('/:id/submit', authenticateToken, challengeController.submitCode);
router.get('/progress/all', authenticateToken, challengeController.getProgress);
router.delete('/:id/progress', authenticateToken, challengeController.resetProgress);

module.exports = router;
