const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Challenge {
  static create(challengeData) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO Challenge (
        id, levelNumber, title, description, task, starterCode,
        expectedOutput, hint, solution, testType, difficulty, points,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      challengeData.levelNumber,
      challengeData.title,
      challengeData.description,
      challengeData.task,
      challengeData.starterCode,
      challengeData.expectedOutput,
      challengeData.hint || null,
      challengeData.solution,
      challengeData.testType || 'exact',
      challengeData.difficulty || 'beginner',
      challengeData.points || 10,
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM Challenge WHERE id = ?');
    return stmt.get(id);
  }

  static findByLevelNumber(levelNumber) {
    const stmt = db.prepare('SELECT * FROM Challenge WHERE levelNumber = ?');
    return stmt.get(levelNumber);
  }

  static findAll({ includeInactive = false } = {}) {
    let query = 'SELECT * FROM Challenge';

    if (!includeInactive) {
      query += ' WHERE isActive = 1';
    }

    query += ' ORDER BY levelNumber ASC';

    const stmt = db.prepare(query);
    return stmt.all();
  }

  static findAllWithProgress(userId) {
    const query = `
      SELECT
        c.*,
        up.status,
        up.attempts,
        up.completedAt,
        up.timeSpent
      FROM Challenge c
      LEFT JOIN UserProgress up ON c.id = up.challengeId AND up.userId = ?
      WHERE c.isActive = 1
      ORDER BY c.levelNumber ASC
    `;

    const stmt = db.prepare(query);
    return stmt.all(userId);
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'levelNumber', 'title', 'description', 'task', 'starterCode',
      'expectedOutput', 'hint', 'solution', 'testType', 'difficulty',
      'points', 'isActive'
    ];

    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updatedAt = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE Challenge SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Challenge WHERE id = ?');
    return stmt.run(id);
  }

  static reorder(newOrder) {
    // newOrder is an array of { id, levelNumber }
    const stmt = db.prepare('UPDATE Challenge SET levelNumber = ?, updatedAt = ? WHERE id = ?');

    db.transaction(() => {
      const now = Date.now();
      for (const item of newOrder) {
        stmt.run(item.levelNumber, now, item.id);
      }
    })();

    return true;
  }

  static getStats(challengeId) {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as totalAttempts,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completions,
        AVG(CASE WHEN status = 'completed' THEN attempts END) as avgAttempts,
        AVG(CASE WHEN status = 'completed' THEN timeSpent END) as avgTimeSpent
      FROM UserProgress
      WHERE challengeId = ?
    `);

    const stats = stmt.get(challengeId);

    return {
      totalAttempts: stats.totalAttempts || 0,
      completions: stats.completions || 0,
      completionRate: stats.totalAttempts > 0
        ? ((stats.completions / stats.totalAttempts) * 100).toFixed(2)
        : 0,
      avgAttempts: stats.avgAttempts || 0,
      avgTimeSpent: stats.avgTimeSpent || 0
    };
  }
}

module.exports = Challenge;
