const bcrypt = require('bcrypt');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Session = require('../models/Session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const SALT_ROUNDS = 10;

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get statistics
    const stats = User.getStats(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      stats
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const updates = {};

    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (username !== undefined) {
      // Check if username is already taken
      const existing = User.findByUsername(username);
      if (existing && existing.id !== req.user.id) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updates.username = username;
    }

    // Update user
    const user = User.update(req.user.id, updates);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    User.update(user.id, { password: hashedPassword });

    // Delete all sessions except current (logout from all other devices)
    const allSessions = Session.findByUser(user.id);
    for (const session of allSessions) {
      if (session.token !== req.token) {
        Session.deleteByToken(session.token);
      }
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Upload avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }, // 5MB
  fileFilter
}).single('avatar');

exports.uploadAvatar = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Delete old avatar
      const user = User.findById(req.user.id);
      if (user.avatar) {
        const oldPath = path.join(__dirname, '../..', user.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update user avatar
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      User.update(req.user.id, { avatar: avatarPath });

      res.json({
        message: 'Avatar uploaded successfully',
        avatar: avatarPath
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Get user
    const user = User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    // Delete user (cascade will delete related data)
    User.delete(user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// Get user statistics
exports.getStats = async (req, res) => {
  try {
    const user = User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = User.getStats(user.id);
    const progress = UserProgress.getUserStats(user.id);
    const recentActivity = UserProgress.getRecentActivity(user.id, 10);

    res.json({
      stats: {
        totalPoints: user.totalPoints,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        completedChallenges: stats.completedChallenges,
        totalAttempts: progress.totalAttempts,
        totalTimeSpent: progress.totalTimeSpent,
        inProgress: progress.inProgress
      },
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
