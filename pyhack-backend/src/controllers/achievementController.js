const { Achievement, UserAchievement } = require('../models/Achievement');

// Get all available achievements
exports.getAllAchievements = async (req, res) => {
  try {
    const achievements = Achievement.findAll();

    // If authenticated, mark which ones the user has
    if (req.user) {
      const userAchievements = UserAchievement.findByUser(req.user.id);
      const userAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));

      const achievementsWithStatus = achievements.map(achievement => ({
        ...achievement,
        unlocked: userAchievementIds.has(achievement.id),
        unlockedAt: userAchievements.find(ua => ua.achievementId === achievement.id)?.unlockedAt
      }));

      return res.json({ achievements: achievementsWithStatus });
    }

    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
};

// Get user's achievements
exports.getUserAchievements = async (req, res) => {
  try {
    const userAchievements = UserAchievement.findByUser(req.user.id);

    const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.points, 0);

    res.json({
      achievements: userAchievements,
      totalAchievements: userAchievements.length,
      totalPoints
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: 'Failed to get user achievements' });
  }
};

module.exports = exports;
