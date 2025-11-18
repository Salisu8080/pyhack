const { db } = require('../config/database');

// Get global leaderboard
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        id,
        username,
        avatar,
        totalPoints,
        currentStreak,
        (SELECT COUNT(*) FROM UserProgress WHERE userId = User.id AND status = 'completed') as challengesCompleted
      FROM User
      WHERE isActive = 1
      ORDER BY totalPoints DESC, challengesCompleted DESC
      LIMIT ? OFFSET ?
    `;

    const users = db.prepare(query).all(limit, offset);

    // Add rank numbers
    const leaderboard = users.map((user, index) => ({
      rank: offset + index + 1,
      ...user
    }));

    // Get current user's rank if authenticated
    let currentUserRank = null;
    if (req.user) {
      const rankQuery = `
        SELECT COUNT(*) + 1 as rank
        FROM User
        WHERE totalPoints > (SELECT totalPoints FROM User WHERE id = ?)
        AND isActive = 1
      `;
      const result = db.prepare(rankQuery).get(req.user.id);
      currentUserRank = result.rank;
    }

    res.json({
      leaderboard,
      currentUserRank,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

// Get weekly leaderboard
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    const query = `
      SELECT
        u.id,
        u.username,
        u.avatar,
        SUM(c.points) as weeklyPoints,
        COUNT(DISTINCT up.challengeId) as challengesCompleted
      FROM User u
      INNER JOIN UserProgress up ON u.id = up.userId
      INNER JOIN Challenge c ON up.challengeId = c.id
      WHERE up.status = 'completed'
      AND up.completedAt >= ?
      AND u.isActive = 1
      GROUP BY u.id, u.username, u.avatar
      ORDER BY weeklyPoints DESC
      LIMIT ?
    `;

    const users = db.prepare(query).all(oneWeekAgo, limit);

    // Add rank numbers
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    res.json({ leaderboard, period: 'weekly' });
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get weekly leaderboard' });
  }
};

module.exports = exports;
