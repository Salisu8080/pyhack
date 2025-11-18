const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Achievement {
  static create(data) {
    const id = uuidv4();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO Achievement (
        id, name, description, icon, points, condition, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.description,
      data.icon,
      data.points,
      JSON.stringify(data.condition),
      now
    );

    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM Achievement WHERE id = ?');
    const achievement = stmt.get(id);
    if (achievement) {
      achievement.condition = JSON.parse(achievement.condition);
    }
    return achievement;
  }

  static findAll() {
    const stmt = db.prepare('SELECT * FROM Achievement ORDER BY points ASC');
    const achievements = stmt.all();
    return achievements.map(a => ({
      ...a,
      condition: JSON.parse(a.condition)
    }));
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM Achievement WHERE id = ?');
    return stmt.run(id);
  }
}

class UserAchievement {
  static award(userId, achievementId) {
    const id = uuidv4();
    const now = Date.now();

    try {
      const stmt = db.prepare(`
        INSERT INTO UserAchievement (id, userId, achievementId, unlockedAt)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(id, userId, achievementId, now);
      return this.findById(id);
    } catch (error) {
      // Already awarded
      return null;
    }
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM UserAchievement WHERE id = ?');
    return stmt.get(id);
  }

  static findByUser(userId) {
    const stmt = db.prepare(`
      SELECT ua.*, a.name, a.description, a.icon, a.points
      FROM UserAchievement ua
      JOIN Achievement a ON ua.achievementId = a.id
      WHERE ua.userId = ?
      ORDER BY ua.unlockedAt DESC
    `);
    return stmt.all(userId);
  }

  static hasAchievement(userId, achievementId) {
    const stmt = db.prepare(`
      SELECT id FROM UserAchievement
      WHERE userId = ? AND achievementId = ?
    `);
    return stmt.get(userId, achievementId) !== undefined;
  }
}

module.exports = { Achievement, UserAchievement };
