const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class UserProgress {
  static create(data) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO UserProgress (
        id, userId, challengeId, status, attempts, lastCode,
        completedAt, timeSpent, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.userId,
      data.challengeId,
      data.status || 'not_started',
      data.attempts || 0,
      data.lastCode || null,
      data.completedAt || null,
      data.timeSpent || 0,
      now,
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM UserProgress WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserAndChallenge(userId, challengeId) {
    const stmt = db.prepare(`
      SELECT * FROM UserProgress
      WHERE userId = ? AND challengeId = ?
    `);
    return stmt.get(userId, challengeId);
  }

  static findByUser(userId) {
    const stmt = db.prepare(`
      SELECT up.*, c.title, c.levelNumber, c.points
      FROM UserProgress up
      JOIN Challenge c ON up.challengeId = c.id
      WHERE up.userId = ?
      ORDER BY c.levelNumber ASC
    `);
    return stmt.all(userId);
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'status', 'attempts', 'lastCode', 'completedAt', 'timeSpent'
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
      UPDATE UserProgress SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static upsert(userId, challengeId, data) {
    const existing = this.findByUserAndChallenge(userId, challengeId);

    if (existing) {
      return this.update(existing.id, data);
    } else {
      return this.create({ userId, challengeId, ...data });
    }
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM UserProgress WHERE id = ?');
    return stmt.run(id);
  }

  static deleteByUserAndChallenge(userId, challengeId) {
    const stmt = db.prepare(`
      DELETE FROM UserProgress
      WHERE userId = ? AND challengeId = ?
    `);
    return stmt.run(userId, challengeId);
  }

  static getUserStats(userId) {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as totalChallenges,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(attempts) as totalAttempts,
        SUM(timeSpent) as totalTimeSpent
      FROM UserProgress
      WHERE userId = ?
    `);

    return stmt.get(userId);
  }

  static getRecentActivity(userId, limit = 10) {
    const stmt = db.prepare(`
      SELECT up.*, c.title, c.levelNumber
      FROM UserProgress up
      JOIN Challenge c ON up.challengeId = c.id
      WHERE up.userId = ?
      ORDER BY up.updatedAt DESC
      LIMIT ?
    `);

    return stmt.all(userId, limit);
  }
}

module.exports = UserProgress;
