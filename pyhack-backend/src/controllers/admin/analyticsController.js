const { db } = require('../../config/database');

// Get overview statistics
exports.getOverviewStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM User').get().count,
      activeUsers: db.prepare('SELECT COUNT(*) as count FROM User WHERE lastLogin > ?').get(Date.now() - 30 * 24 * 60 * 60 * 1000).count,
      totalChallenges: db.prepare('SELECT COUNT(*) as count FROM Challenge WHERE isActive = 1').get().count,
      totalSubmissions: db.prepare('SELECT SUM(attempts) as count FROM UserProgress').get().count || 0,
      avgCompletionRate: 0,
      mostPopularChallenge: null,
      leastPopularChallenge: null
    };

    // Calculate average completion rate
    const completionData = db.prepare(`
      SELECT
        AVG(CASE WHEN status = 'completed' THEN 100 ELSE 0 END) as avgRate
      FROM UserProgress
    `).get();
    stats.avgCompletionRate = parseFloat(completionData.avgRate || 0).toFixed(2);

    // Most popular challenge
    const mostPopular = db.prepare(`
      SELECT c.id, c.title, COUNT(up.id) as attempts
      FROM Challenge c
      LEFT JOIN UserProgress up ON c.id = up.challengeId
      WHERE c.isActive = 1
      GROUP BY c.id
      ORDER BY attempts DESC
      LIMIT 1
    `).get();
    stats.mostPopularChallenge = mostPopular;

    // Least popular challenge
    const leastPopular = db.prepare(`
      SELECT c.id, c.title, COUNT(up.id) as attempts
      FROM Challenge c
      LEFT JOIN UserProgress up ON c.id = up.challengeId
      WHERE c.isActive = 1
      GROUP BY c.id
      ORDER BY attempts ASC
      LIMIT 1
    `).get();
    stats.leastPopularChallenge = leastPopular;

    res.json({ stats });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ error: 'Failed to get overview statistics' });
  }
};

// Get user growth data
exports.getUserGrowth = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let groupBy, timeFrame;
    switch (period) {
      case 'week':
        timeFrame = 7 * 24 * 60 * 60 * 1000;
        groupBy = 'date(createdAt / 1000, \'unixepoch\')';
        break;
      case 'year':
        timeFrame = 365 * 24 * 60 * 60 * 1000;
        groupBy = 'strftime(\'%Y-%m\', date(createdAt / 1000, \'unixepoch\'))';
        break;
      default: // month
        timeFrame = 30 * 24 * 60 * 60 * 1000;
        groupBy = 'date(createdAt / 1000, \'unixepoch\')';
    }

    const startDate = Date.now() - timeFrame;

    const data = db.prepare(`
      SELECT
        ${groupBy} as period,
        COUNT(*) as count
      FROM User
      WHERE createdAt >= ?
      GROUP BY period
      ORDER BY period ASC
    `).all(startDate);

    res.json({ data, period });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({ error: 'Failed to get user growth data' });
  }
};

// Get completion rates
exports.getCompletionRates = async (req, res) => {
  try {
    const data = db.prepare(`
      SELECT
        c.id,
        c.title,
        c.levelNumber,
        COUNT(up.id) as totalAttempts,
        SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) as completions,
        CASE
          WHEN COUNT(up.id) > 0
          THEN ROUND(SUM(CASE WHEN up.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT up.userId), 2)
          ELSE 0
        END as completionRate
      FROM Challenge c
      LEFT JOIN UserProgress up ON c.id = up.challengeId
      WHERE c.isActive = 1
      GROUP BY c.id
      ORDER BY c.levelNumber ASC
    `).all();

    res.json({ data });
  } catch (error) {
    console.error('Get completion rates error:', error);
    res.status(500).json({ error: 'Failed to get completion rates' });
  }
};

// Get activity heatmap
exports.getActivityHeatmap = async (req, res) => {
  try {
    const data = db.prepare(`
      SELECT
        CAST(strftime('%w', date(completedAt / 1000, 'unixepoch')) AS INTEGER) as dayOfWeek,
        CAST(strftime('%H', datetime(completedAt / 1000, 'unixepoch')) AS INTEGER) as hour,
        COUNT(*) as count
      FROM UserProgress
      WHERE status = 'completed'
      AND completedAt IS NOT NULL
      AND completedAt >= ?
      GROUP BY dayOfWeek, hour
      ORDER BY dayOfWeek, hour
    `).all(Date.now() - 30 * 24 * 60 * 60 * 1000);

    res.json({ data });
  } catch (error) {
    console.error('Get activity heatmap error:', error);
    res.status(500).json({ error: 'Failed to get activity heatmap' });
  }
};

// Get top users
exports.getTopUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const users = db.prepare(`
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
      LIMIT ?
    `).all(limit);

    res.json({ users });
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({ error: 'Failed to get top users' });
  }
};

module.exports = exports;
