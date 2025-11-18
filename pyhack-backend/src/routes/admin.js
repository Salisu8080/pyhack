const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/admin');

// Import admin controllers
const adminUserController = require('../controllers/admin/userController');
const adminChallengeController = require('../controllers/admin/challengeController');
const analyticsController = require('../controllers/admin/analyticsController');
const settingsController = require('../controllers/admin/settingsController');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// User management routes
router.get('/users', adminUserController.getAllUsers);
router.get('/users/:id', adminUserController.getUserDetails);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', requireSuperAdmin, adminUserController.deleteUser);
router.patch('/users/:id/status', adminUserController.toggleUserStatus);
router.post('/users/:id/reset-password', adminUserController.resetUserPassword);

// Challenge management routes
router.get('/challenges', adminChallengeController.getAllChallenges);
router.post('/challenges', adminChallengeController.createChallenge);
router.put('/challenges/:id', adminChallengeController.updateChallenge);
router.delete('/challenges/:id', adminChallengeController.deleteChallenge);
router.patch('/challenges/:id/status', adminChallengeController.toggleChallengeStatus);
router.post('/challenges/reorder', adminChallengeController.reorderChallenges);
router.get('/challenges/:id/stats', adminChallengeController.getChallengeStats);

// Analytics routes
router.get('/analytics/overview', analyticsController.getOverviewStats);
router.get('/analytics/user-growth', analyticsController.getUserGrowth);
router.get('/analytics/completion-rates', analyticsController.getCompletionRates);
router.get('/analytics/activity-heatmap', analyticsController.getActivityHeatmap);
router.get('/analytics/top-users', analyticsController.getTopUsers);

// Settings routes
router.get('/settings', settingsController.getAllSettings);
router.put('/settings/:key', settingsController.updateSetting);

// Audit logs
router.get('/logs', settingsController.getAuditLogs);

module.exports = router;
