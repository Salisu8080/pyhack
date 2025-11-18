const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validate('updateProfile'), userController.updateProfile);

// Password management
router.post('/change-password', validate('changePassword'), userController.changePassword);

// Avatar upload
router.post('/avatar', userController.uploadAvatar);

// Account deletion
router.delete('/account', userController.deleteAccount);

// Statistics
router.get('/stats', userController.getStats);

module.exports = router;
